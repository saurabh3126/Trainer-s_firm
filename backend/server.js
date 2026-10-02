require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Cloudinary & Multer imports
const { v2: cloudinary } = require('cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// 1. CLOUDINARY & MULTER CONFIGURATION
// ==========================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'venty_resumes',
        resource_type: 'auto', 
    }
});
const upload = multer({ storage: storage });

// ==========================================
// 2. DATABASE SETUP & SCHEMAS
// ==========================================
// Cached connection for serverless
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
    });
    console.log('MongoDB Connected');
};

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('DB Middleware Error:', err);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

const vendorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true }
});
const Vendor = mongoose.model('Vendor', vendorSchema);

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true }, 
    whatsapp_number: { type: String, default: '' },
    personal_email: { type: String, default: '' },
    profile_photo: { type: String, default: '' },
    profile_photo_public_id: { type: String, default: '' },
    role: { type: String, enum: ['vendor', 'trainer', 'admin'], required: true },
    isVerified: { type: Boolean, default: false },
    experience_years: { type: String, default: "" },
    resume_link: { type: String, default: "" },
    resume_public_id: { type: String, default: "" },
    location: { type: String, default: "" },
    skills: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 } 
});
const OTP = mongoose.model('OTP', otpSchema);

const jobPostSchema = new mongoose.Schema({
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    posted_by_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    raw_text: String,
    subject: String,
    city: String,
    duration: String,
    mode: String,
    pay_disclosed: String,
    tfa: String,
    custom_fields: [{ key: String, value: String }],
    experience_level: { type: String, default: 'TBD' },
    employment_type: { type: String, default: 'TBD' },
    skills: { type: [String], default: [] }, // Ã°Å¸Å¡Â¨ NEW: Added schema support for dynamic fields
    cleaned_text: String,
    status: { type: String, enum: ['open', 'fulfilled', 'dropped'], default: 'open' },
    guest_resumes: [{ type: String }], 
    trainer_name: String,
    trainer_phone: String,
    fulfilled_date: Date,
    createdAt: { type: Date, default: Date.now }
});
const JobPost = mongoose.model('JobPost', jobPostSchema);

const interactionSchema = new mongoose.Schema({
    job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost' },
    trainer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});
const Interaction = mongoose.model('Interaction', interactionSchema);

// ==========================================
// 3. MIDDLEWARE & EMAIL TRANSPORTER
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

const authenticate = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || authHeader.startsWith('Bearer null') || authHeader.startsWith('Bearer undefined')) {
        return res.status(401).json({ error: 'Access denied. Please log in again.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
    next();
};

// ==========================================
// 4. FILE UPLOAD ROUTE
// ==========================================
app.post('/api/upload', (req, res) => {
    upload.single('resume')(req, res, function (err) {
        if (err) return res.status(500).json({ error: err.message || "Cloudinary connection failed" });
        if (!req.file) return res.status(400).json({ error: "No file was received by the server" });
        res.json({ url: req.file.path, public_id: req.file.filename });
    });
});

// ==========================================
// 5. AUTHENTICATION ROUTES
// ==========================================
// ============================================================
// Message Central: Get auth token (runs fresh per OTP request)
// ============================================================
async function getMCToken() {
    const encoded = Buffer.from(process.env.MC_PASSWORD).toString('base64');
    const url = `https://cpaas.messagecentral.com/auth/v1/authentication/token?customerId=${process.env.MC_CUSTOMER_ID}&key=${encoded}&scope=NEW&country=91`;
    const res = await axios.get(url, { timeout: 5000 });
    return res.data.token;
}

// ============================================================
// Message Central: Send OTP via SMS
// ============================================================
async function sendSmsOtp(phone, otp) {
    const token = await getMCToken();
    // New Message Central platform — uses verificationId flow (no custom message text)
    const res = await axios.post(
        'https://cpaas.messagecentral.com/verification/v3/send',
        null,
        {
            params: {
                countryCode: '91',
                customerId: process.env.MC_CUSTOMER_ID,
                flowType: 'SMS',
                mobileNumber: phone,
                type: 'OTP',
                senderId: process.env.MC_SENDER_ID || 'VENTYS',
                otpLength: 6,
            },
            headers: { authToken: token },
            timeout: 10000
        }
    );
    return res.data; // contains verificationId for later validation
}

app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { email, phone } = req.body;
        if (!phone) return res.status(400).json({ error: 'Phone number is required to send OTP.' });

        // ----- Duplicate Check (email + phone) -----
        const orQuery = [];
        if (email) orQuery.push({ email });
        if (phone) orQuery.push({ phone });
        
        const existingUser = await User.findOne({ $or: orQuery });
        if (existingUser) {
            if (email && existingUser.email === email && !email.endsWith('@no-email.venty.in'))
                return res.status(400).json({ error: 'Email is already registered. Please log in.' });
            if (phone && existingUser.phone === phone)
                return res.status(400).json({ error: 'Phone number is already registered. Please log in.' });
        }

        // ----- PRIMARY: Send via SMS (Message Central) — MC generates & delivers its own OTP -----
        if (phone && process.env.MC_CUSTOMER_ID && process.env.MC_PASSWORD) {
            try {
                const mcRes = await sendSmsOtp(phone);
                const verificationId = mcRes && mcRes.data && mcRes.data.verificationId;
                // Store MC verificationId keyed by phone so register can validate it
                await OTP.findOneAndDelete({ email: phone });
                await OTP.create({ email: phone, otp: verificationId || 'mc_sent' });
                return res.json({ success: true, smsSent: true, verificationId, message: 'OTP sent to your phone.' });
            } catch (smsErr) {
                console.error('[MC SMS Error]', smsErr?.response?.data || smsErr.message);
                if (!email) {
                    return res.json({ success: false, smsSent: false, smsFailed: true, error: 'SMS delivery failed. No email fallback available.' });
                }
                // SMS failed but email provided — fall through to email OTP below
            }
        }

        // ----- FALLBACK: Generate our own OTP for email delivery -----
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const identifier = phone;
        await OTP.findOneAndDelete({ email: identifier });
        await OTP.create({ email: identifier, otp: otpCode });

        // ----- NO SMS CONFIGURED OR NO PHONE -----
        if (email) {
            const mailOptions = {
                from: `"Trainer Firm Support" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Your Trainer Firm Verification Code',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                        <h2>Welcome to Trainer Firm!</h2>
                        <p>Your verification code is:</p>
                        <h1 style="color: #111; letter-spacing: 6px; font-size: 36px;">${otpCode}</h1>
                        <p>This code will expire in 5 minutes.</p>
                        <p style="font-size:12px;color:#999;">Do not share this code with anyone.</p>
                    </div>
                `
            };
            await transporter.sendMail(mailOptions);
            return res.json({ success: true, smsSent: false, message: 'OTP sent to your email.' });
        } else {
            return res.status(400).json({ error: 'SMS is unconfigured. Please provide an email address to receive the code.' });
        }
    } catch (error) {
        console.error('OTP Error:', error);
        res.status(500).json({ error: 'Failed to send OTP. Please check configuration.' });
    }
});



// ============================================================
// Resend OTP via Email only (user-requested fallback)
// ============================================================
app.post('/api/auth/resend-otp-email', async (req, res) => {
    try {
        const { email, phone } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required to send the code.' });
        if (!phone) return res.status(400).json({ error: 'Phone is required to look up your OTP session.' });

        // OTP is stored keyed by phone
        const otpRecord = await OTP.findOne({ email: phone });
        if (!otpRecord) return res.status(400).json({ error: 'No active OTP found. Please restart registration.' });

        const mailOptions = {
            from: `"Trainer Firm Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Trainer Firm Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                    <h2>Welcome to Trainer Firm!</h2>
                    <p>Your verification code is:</p>
                    <h1 style="color: #111; letter-spacing: 6px; font-size: 36px;">${otpRecord.otp}</h1>
                    <p>This code will expire in 5 minutes.</p>
                    <p style="font-size:12px;color:#999;">Do not share this code with anyone.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'OTP sent to your email.' });
    } catch (error) {
        console.error('Resend Email OTP Error:', error);
        res.status(500).json({ error: 'Failed to send email. Please try again.' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, whatsapp_number, personal_email, role, experience_years, resume_link, resume_public_id, otp } = req.body;

        // OTP validation: if MC verificationId stored, validate against MC API; else check our DB
        const otpRecord = await OTP.findOne({ email: phone });
        if (!otpRecord) return res.status(400).json({ error: "OTP session expired. Please restart registration." });

        const verificationId = otpRecord.otp; // stored as verificationId or plain OTP code
        const isMcFlow = verificationId && /^\d+$/.test(verificationId); // MC verificationId is purely numeric
        if (isMcFlow) {
            // Validate against Message Central
            try {
                const mcToken = await getMCToken();
                await axios.get('https://cpaas.messagecentral.com/verification/v3/validateOtp', {
                    params: { verificationId, code: otp, customerId: process.env.MC_CUSTOMER_ID },
                    headers: { authToken: mcToken },
                    timeout: 8000
                });
            } catch (mcErr) {
                const errMsg = mcErr?.response?.data?.message || 'Invalid OTP.';
                return res.status(400).json({ error: errMsg });
            }
        } else {
            // Email fallback OTP — check our DB
            if (otpRecord.otp !== otp) return res.status(400).json({ error: "Invalid or expired OTP." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const finalEmail = email && email.trim() ? email.trim() : `${phone}@no-email.venty.in`;
        await User.create({
            name,
            email: finalEmail,
            password: hashedPassword,
            phone,
            whatsapp_number: whatsapp_number || phone,
            personal_email: personal_email || '',
            role,
            experience_years: role === 'trainer' ? experience_years : "",
            resume_link: role === 'trainer' ? resume_link : "",
            resume_public_id: role === 'trainer' ? resume_public_id : ""
        });

        await OTP.findByIdAndDelete(otpRecord._id);
        res.status(201).json({ success: true, message: "User registered successfully" });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: "Server error during registration" });
    }
});


// Admin Fast Login
app.post('/api/auth/admin-login', async (req, res) => {
    try {
        const { password } = req.body;
        // Default admin password if not set in .env
        const adminPass = process.env.ADMIN_PASSWORD || 'ventyadmin2026';
        if (password === adminPass) {
            const token = jwt.sign(
                { id: '000000000000000000000000', role: 'admin', name: 'System Admin' },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '7d' }
            );
            res.json({
                success: true,
                token,
                user: { id: '000000000000000000000000', name: 'System Admin', role: 'admin' }
            });
        } else {
            res.status(401).json({ error: 'Invalid admin password' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email/phone and password are required.' });

        // Accept email or phone as login identifier
        const identifier = email.trim();
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { phone: identifier },
                { email: `${identifier}@no-email.venty.in` }
            ]
        });
        if (!user) return res.status(404).json({ error: 'User not found. Please check your details.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { id: user._id, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: { 
                id: user._id, 
                name: user.name, 
                role: user.role, 
                email: user.email,
                phone: user.phone,
                whatsapp_number: user.whatsapp_number,
                personal_email: user.personal_email,
                profile_photo: user.profile_photo,
                profile_photo_public_id: user.profile_photo_public_id,
                experience_years: user.experience_years,
                resume_link: user.resume_link,
                resume_public_id: user.resume_public_id
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Server error during login" });
    }
});

// ==========================================
// 6. VENDOR ROUTES (Create, Parse, Fulfill)
// ==========================================
// Helper to normalize salary amounts (e.g. 50k -> 50000, 1.5k -> 1500)
function convertKtoZeros(val) {
    if (!val) return val;
    let str = val.toString().trim();
    // Replace patterns like 50k, 50K, 2.5k, 50 k, 15k/day, etc. with numbers
    str = str.replace(/(\d+(?:\.\d+)?)\s*[kK]\b/g, (match, num) => {
        const parsed = parseFloat(num);
        return isNaN(parsed) ? match : Math.round(parsed * 1000).toString();
    });
    return str;
}

app.post('/api/jobs/parse', async (req, res) => {
    try {
        const { vendor_name, vendor_phone, raw_text } = req.body;
        if (!vendor_name || !vendor_phone || !raw_text) return res.status(400).json({ error: "Missing required fields" });

        let vendor = await Vendor.findOne({ phone: vendor_phone });
        if (!vendor) vendor = await Vendor.create({ name: vendor_name, phone: vendor_phone });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Ã°Å¸Å¡Â¨ NEW: Prompt instructs Gemini to convert 'k' into '0's for slider compatibility
        const prompt = `
        Analyze the following trainer job requirement and extract the details into a strict JSON format. 
        Requirement: "${raw_text}"
        Expected JSON format:
        {
          "subject": "Main topic/technology (e.g., React JS, Node.js)",
          "city": "City name if mentioned, otherwise null",
          "duration": "Duration if mentioned, otherwise null",
          "mode": "onsite, remote, or hybrid (infer if possible), otherwise null",
            "experience_level": "Extract required experience (e.g., '3-5 years', 'No prior experience required'). Default to 'TBD' if not mentioned",
            "employment_type": "Extract employment type (e.g., 'Part Time', 'Full Time', 'Contract'). Default to 'TBD' if not mentioned",
            "skills": ["List of specific technologies or skills mentioned, e.g. 'React', 'SystemVerilog'"],
          "pay_disclosed": "Budget/pay if mentioned. CRITICAL RULE: ALWAYS convert shorthand salary amounts like 'k' or 'K' into numbers with full zeros (e.g. convert '50k' or '50K' to '50000', '5k' to '5000', '1.5k' to '1500', '25k/day' to '25000/day', '80k per month' to '80000/month'). If frequency is mentioned, keep it formatted as '[numeric_amount][/day|/week|/month]' (e.g. '50000/month' or '5000/day'), otherwise null if not mentioned",
          "tfa": "Extract details about Travel, Food, or Accommodation (TFA) if mentioned, otherwise null",
          "custom_fields": [{"key": "Extra Feature Name (e.g. Language, Shift, Hardware)", "value": "Detail mentioned"}],
          "highlights": ["Very short 2-3 word highlights", "e.g. Own Device", "e.g. Weekend Shift"],
          "cleaned_text": "A professional, clear rewrite of the requirement formatted as a markdown bulleted list. CRITICAL: Do NOT include any contact information, phone numbers, or email addresses.",
          "missing_fields": []
        }
        NOTE: Extract ANY extra requirements (like specific languages, shifts, hardware provided, etc.) into the custom_fields array. If there are no extra details, return an empty array []. Also extract up to 4 very short tags for the "highlights" array (e.g., 'Own Device', 'Laptops Provided', 'Night Shift'). If there are no highlights, return an empty array [].
        Make sure cleaned_text uses markdown bullet points (- ) to list the details.
        Return ONLY valid JSON.
        `;

        const result = await model.generateContent(prompt);
        let aiResponseText = result.response.text().trim();
        
        if (aiResponseText.startsWith('```json')) {
            aiResponseText = aiResponseText.replace(/^```json\n/, '').replace(/\n```$/, '');
        }

        const parsedData = JSON.parse(aiResponseText);
        
        // Ensure custom_fields exists even if AI missed it
        parsedData.custom_fields = parsedData.custom_fields || [];
        parsedData.highlights = parsedData.highlights || [];

        // Ã°Å¸Å¡Â¨ Convert any remaining 'k' or 'K' in salary to numerical zeros
        if (parsedData.pay_disclosed) {
            parsedData.pay_disclosed = convertKtoZeros(parsedData.pay_disclosed);
        }

        // ========================================================
        // Ã°Å¸Å¡Â¨ ULTIMATE BULLETPROOF FIX 
        // Force the backend to detect missing fields perfectly
        // ========================================================
        const allKeys = ['subject', 'city', 'duration', 'mode', 'pay_disclosed', 'tfa'];
        
        parsedData.missing_fields = allKeys.filter(key => {
            const val = parsedData[key];
            if (!val) return true; // Catches actual null or undefined
            
            const strVal = val.toString().toLowerCase().trim();
            return strVal === "" || 
                   strVal === "null" || 
                   strVal === "n/a" || 
                   strVal === "none" || 
                   strVal.includes("not mentioned") ||
                   strVal.includes("not provided");
        });

        res.json({ vendor_id: vendor._id, parsed_data: parsedData });
    } catch (error) {
        console.error("Parsing Error:", error);
        res.status(500).json({ error: "Failed to parse data" });
    }
});

app.post('/api/jobs/create', authenticate, async (req, res) => {
    try {
        if (req.body.pay_disclosed) {
            req.body.pay_disclosed = convertKtoZeros(req.body.pay_disclosed);
        }
        // Stamp the posting user so vendor history queries work
        req.body.posted_by_user = req.user.id;
        const newJob = await JobPost.create(req.body);
        res.status(200).json({ success: true, job: newJob });
    } catch (error) {
        console.error("Job Creation Error:", error);
        res.status(500).json({ error: "Failed to create job post" });
    }
});

// ==========================================
// Ã°Å¸Å¡Â¨ AI TECH & SKILL SUGGESTIONS ROUTE
// Provides at least 8 intelligent suggestions based on alphabets entered
// ==========================================
const POPULAR_SKILLS = [
    "React JS", "Node.js", "Python", "Java", "Full Stack Web Development",
    "Machine Learning", "Artificial Intelligence", "Data Science", "AWS Cloud",
    "DevOps", "Docker & Kubernetes", "Cyber Security", "Prompt Engineering",
    "Generative AI", "Azure Cloud", "Google Cloud Platform (GCP)", "SQL & Database Design",
    "PostgreSQL", "MongoDB", "Angular", "Vue.js", "Next.js", "TypeScript",
    "Spring Boot", "Microservices", "C++ Programming", "C# & .NET Core",
    "Golang (Go)", "Rust Programming", "Flutter & Dart", "React Native",
    "Android Development (Kotlin)", "iOS Development (Swift)", "Power BI",
    "Tableau Data Analytics", "Snowflake", "Databricks & Spark", "Apache Kafka",
    "Selenium Automation Testing", "Penetration Testing & Ethical Hacking",
    "Linux System Administration", "Terraform & IaC", "Salesforce Development",
    "SAP ABAP / S4 HANA", "UI/UX Design with Figma", "Blockchain & Web3",
    "Robotic Process Automation (RPA)", "Excel & Advanced Analytics",
    "Scrum & Agile Methodology", "PHP & Laravel", "GraphQL", "Ruby on Rails",
    "PyTorch & Deep Learning", "Redis In-Memory Database", "Redux State Management"
];

const suggestionsCache = new Map();

app.get('/api/jobs/ai-suggestions', async (req, res) => {
    try {
        const query = (req.query.q || '').trim();
        if (!query) {
            return res.json({ suggestions: POPULAR_SKILLS.slice(0, 10) });
        }

        const cacheKey = query.toLowerCase();
        if (suggestionsCache.has(cacheKey)) {
            return res.json({ suggestions: suggestionsCache.get(cacheKey) });
        }

        // 1. Fetch matching job subjects currently in database
        const existingJobs = await JobPost.find({
            status: 'open',
            subject: { $regex: query, $options: 'i' }
        }).distinct('subject');

        // 2. Filter local catalog matching the query
        const localMatches = POPULAR_SKILLS.filter(s => 
            s.toLowerCase().includes(query.toLowerCase())
        );

        let combined = Array.from(new Set([...existingJobs, ...localMatches]));

        // 3. AI call removed to make search faster
        /*
        if (combined.length < 8) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const prompt = `Provide a JSON array of at least 10 relevant corporate training technologies, IT skills, frameworks, or programming languages that start with or contain the letters "${query}". Return ONLY a JSON array of strings, e.g. ["Python", "PyTorch", ...]. Do not include markdown codeblocks or explanation.`;
                const result = await model.generateContent(prompt);
                let text = result.response.text().trim();
                if (text.startsWith('```json')) text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
                if (text.startsWith('```')) text = text.replace(/^```\n?/, '').replace(/\n```$/, '');
                const aiList = JSON.parse(text);
                if (Array.isArray(aiList)) {
                    combined = Array.from(new Set([...combined, ...aiList]));
                }
            } catch (err) {
                console.error("Gemini Suggestions Error:", err.message);
            }
        }
        */

        // Guarantee at least 8 suggestions
        if (combined.length < 8) {
            for (const skill of POPULAR_SKILLS) {
                if (!combined.includes(skill)) combined.push(skill);
                if (combined.length >= 8) break;
            }
        }

        const finalSuggestions = combined.slice(0, 12);
        if (suggestionsCache.size > 200) suggestionsCache.clear();
        suggestionsCache.set(cacheKey, finalSuggestions);

        res.json({ suggestions: finalSuggestions });
    } catch (error) {
        console.error("AI Suggestions Route Error:", error);
        res.status(500).json({ error: "Failed to get suggestions" });
    }
});

// ==========================================
// Ã°Å¸Å¡Â¨ AI CITY SUGGESTIONS ROUTE
// Provides at least 8 intelligent city suggestions based on alphabets entered
// ==========================================
const POPULAR_CITIES = [
    "Bangalore", "Hyderabad", "Pune", "Mumbai", "Delhi", "Chennai",
    "Noida", "Gurgaon", "Kolkata", "Ahmedabad", "Jaipur", "Chandigarh",
    "Kochi", "Indore", "Lucknow", "Coimbatore", "Bhopal", "Visakhapatnam",
    "Surat", "Nagpur", "Patna", "Vadodara", "Bhubaneswar", "Thiruvananthapuram",
    "Mysore", "Mangalore", "Dehradun", "Ranchi", "Raipur", "Nashik",
    "Vijayawada", "Trichy", "Madurai", "Kanpur", "Varanasi", "Amritsar", "Goa"
];

const citySuggestionsCache = new Map();

app.get('/api/jobs/city-suggestions', async (req, res) => {
    try {
        const query = (req.query.q || '').trim();
        if (!query) {
            return res.json({ suggestions: POPULAR_CITIES.slice(0, 10) });
        }

        const cacheKey = query.toLowerCase();
        if (citySuggestionsCache.has(cacheKey)) {
            return res.json({ suggestions: citySuggestionsCache.get(cacheKey) });
        }

        // 1. Fetch matching job cities currently in database
        const existingCities = await JobPost.find({
            status: 'open',
            city: { $regex: query, $options: 'i' }
        }).distinct('city');

        // 2. Filter local popular cities list matching query
        const localMatches = POPULAR_CITIES.filter(c => 
            c.toLowerCase().includes(query.toLowerCase())
        );

        let combined = Array.from(new Set([...existingCities.filter(Boolean), ...localMatches]));

        // 3. Fire Gemini AI in background (non-blocking) to expand cache for future requests
        // Only if we have fewer than 10 suggestions and the result isn't already cached
        if (combined.length < 10) {
            (async () => {
                try {
                    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                    const prompt = `List Indian cities or training locations matching "${query}". Return ONLY a JSON array of city name strings, e.g. ["Ajmer","Agra"]. No markdown, no explanation.`;
                    const result = await model.generateContent(prompt);
                    let text = result.response.text().trim();
                    if (text.startsWith('```json')) text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
                    if (text.startsWith('```')) text = text.replace(/^```\n?/, '').replace(/\n```$/, '');
                    const aiList = JSON.parse(text);
                    if (Array.isArray(aiList)) {
                        const expanded = Array.from(new Set([...combined, ...aiList.filter(Boolean)])).slice(0, 20);
                        citySuggestionsCache.set(cacheKey, expanded); // Update cache for next request
                    }
                } catch (err) {
                    console.error("Gemini City BG Error:", err.message);
                }
            })();
        }

        // Guarantee at least 8 suggestions from local list
        if (combined.length < 8) {
            for (const city of POPULAR_CITIES) {
                if (!combined.includes(city)) combined.push(city);
                if (combined.length >= 8) break;
            }
        }

        const finalSuggestions = combined.slice(0, 20);
        if (citySuggestionsCache.size > 200) citySuggestionsCache.clear();
        citySuggestionsCache.set(cacheKey, finalSuggestions);

        res.json({ suggestions: finalSuggestions });
    } catch (error) {
        console.error("AI City Suggestions Route Error:", error);
        res.status(500).json({ error: "Failed to get city suggestions" });
    }
});

app.put('/api/jobs/:id/fulfill', authenticate, async (req, res) => {
    try {
        const job = await JobPost.findById(req.params.id);
        if (!job) return res.status(404).json({ error: "Job not found" });

        const isOwner = job.posted_by_user?.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: "Unauthorized to modify this job" });
        }

        if (job.guest_resumes && job.guest_resumes.length > 0) {
            for (const public_id of job.guest_resumes) {
                await cloudinary.uploader.destroy(public_id);
            }
        }

        const { trainer_name, trainer_phone } = req.body;

        job.status = 'fulfilled';
        job.trainer_name = trainer_name;
        job.trainer_phone = trainer_phone;
        job.fulfilled_date = new Date();
        job.guest_resumes = []; 
        await job.save();

        res.json({ success: true, message: "Job marked as fulfilled and temporary resumes deleted." });
    } catch (error) {
        console.error("Fulfill Error:", error);
        res.status(500).json({ error: "Failed to fulfill job" });
    }
});

// ==========================================
// 7. TRAINER ROUTES (View & Contact)
// ==========================================
app.get('/api/ping', (req, res) => res.json({pong: true}));
app.get('/api/jobs', async (req, res) => {
    try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const jobs = await JobPost.find({ status: 'open' })
            .populate('vendor_id', 'name phone').populate('posted_by_user', 'isVerified name')
            .sort({ createdAt: -1 });
        res.json({ jobs });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
});

app.get('/api/jobs/:id', async (req, res) => {
    try {
        const job = await JobPost.findById(req.params.id).populate('vendor_id', 'name phone').populate('posted_by_user', 'isVerified name');
        if (!job) return res.status(404).json({ error: "Job not found" });
        res.json({ job });
    } catch (error) {
        console.error("Error fetching single job:", error);
        res.status(500).json({ error: "Failed to fetch job" });
    }
});

app.post('/api/jobs/contact', async (req, res) => {
    try {
        const { job_post_id, trainer_name, trainer_contact, experience, resume_link, resume_public_id, is_guest } = req.body;
        const job = await JobPost.findById(job_post_id).populate('vendor_id');
        if (!job) return res.status(404).json({ error: "Job not found" });

        const vendorPhone = job.vendor_id.phone;
        
        if (is_guest && resume_public_id) {
            job.guest_resumes.push(resume_public_id);
            await job.save();
        }

        const token = req.header('Authorization')?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
                if (decoded.role === 'trainer') {
                    await Interaction.create({ job_id: job_post_id, trainer_id: decoded.id });
                }
            } catch (e) { /* Ignore */ }
        }

        let preFilledMessage = `Hi,\n\nI am reaching out regarding your requirement for "${job.subject}" on Trainer Firm.\n\nMy name is ${trainer_name} and my contact number is ${trainer_contact}.`;

        if (experience) preFilledMessage += `\nI have ${experience} years of experience in this domain.`;
        if (resume_link) preFilledMessage += `\nYou can review my resume and previous work here: ${resume_link}`;
        preFilledMessage += `\n\nAre you available for a quick chat to discuss further?`;

        res.json({
            success: true,
            vendor_contact_value: vendorPhone,
            pre_filled_message: preFilledMessage
        });
    } catch (error) {
        console.error("Contact Error:", error);
        res.status(500).json({ error: "Failed to process contact request" });
    }
});

// ==========================================
// 8. PROFILE & HISTORY ROUTES
// ==========================================
app.put('/api/users/profile', authenticate, async (req, res) => {
    try {
        const { name, phone, experience_years, resume_link, resume_public_id, profile_photo, profile_photo_public_id, location, skills } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (resume_public_id && user.resume_public_id && user.resume_public_id !== resume_public_id) {
            await cloudinary.uploader.destroy(user.resume_public_id);
        }

        if (profile_photo_public_id && user.profile_photo_public_id && user.profile_photo_public_id !== profile_photo_public_id) {
            await cloudinary.uploader.destroy(user.profile_photo_public_id);
        }

        user.name = name || user.name;
        user.phone = phone || user.phone;
        if (location !== undefined) user.location = location;
        if (skills !== undefined) user.skills = skills;
        
        if (profile_photo) user.profile_photo = profile_photo;
        if (profile_photo_public_id) user.profile_photo_public_id = profile_photo_public_id;
        
        if (user.role === 'trainer') {
            user.experience_years = experience_years || user.experience_years;
            if (resume_link) user.resume_link = resume_link;
            if (resume_public_id) user.resume_public_id = resume_public_id;
        }

        await user.save();
        res.json({ 
            success: true, 
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                email: user.email,
                phone: user.phone,
                location: user.location,
                skills: user.skills,
                profile_photo: user.profile_photo,
                profile_photo_public_id: user.profile_photo_public_id,
                experience_years: user.experience_years,
                resume_link: user.resume_link,
                resume_public_id: user.resume_public_id,
                isApproved: user.isApproved,
                createdAt: user.createdAt
            } 
        });
    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

app.get('/api/users/history', authenticate, async (req, res) => {
    try {
        let jobQuery = { posted_by_user: req.user.id };

        if (req.user.role === 'admin') {
            jobQuery = {}; // Admin sees all jobs
        } else if (req.user.role === 'vendor') {
            const user = await User.findById(req.user.id);
            if (user && user.phone) {
                const cleanPhone = user.phone.replace(/\D/g, '').slice(-10);
                const vendors = await Vendor.find({
                    phone: { $regex: cleanPhone }
                }).select('_id');
                const vIds = vendors.map(v => v._id);
                jobQuery = {
                    $or: [
                        { posted_by_user: req.user.id },
                        { vendor_id: { $in: vIds } }
                    ]
                };
            }
        }

        const [jobs, interactions] = await Promise.all([
            JobPost.find(jobQuery).populate('vendor_id', 'name phone').populate('posted_by_user', 'isVerified name').sort({ createdAt: -1 }),
            Interaction.find({ trainer_id: req.user.id })
                .populate({ path: 'job_id', populate: { path: 'vendor_id', select: 'name' } })
                .sort({ createdAt: -1 })
        ]);
        return res.json({ jobs, interactions });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// ==========================================
// 9. ADMIN ROUTES
// ==========================================
app.get('/api/admin/vendors', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const vendors = await User.find({ role: 'vendor' }).sort({ createdAt: -1 });
        res.json({ vendors });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch vendors" });
    }
});

app.put('/api/admin/vendors/:id/verify', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const vendor = await User.findById(req.params.id);
        if (!vendor) return res.status(404).json({ error: "Vendor not found" });
        vendor.isVerified = !vendor.isVerified;
        await vendor.save();
        res.json({ success: true, isVerified: vendor.isVerified });
    } catch (error) {
        res.status(500).json({ error: "Failed to verify vendor" });
    }
});

app.get('/api/admin/jobs', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const jobs = await JobPost.find().populate('vendor_id', 'name phone').populate('posted_by_user', 'isVerified name').sort({ createdAt: -1 });
        res.json({ jobs });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch admin jobs" });
    }
});

app.put('/api/admin/jobs/:id/repost', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const job = await JobPost.findById(req.params.id);
        if (!job) return res.status(404).json({ error: "Job not found" });

        job.createdAt = Date.now(); 
        await job.save();
        res.json({ success: true, message: "Job successfully reposted to the top." });
    } catch (error) {
        res.status(500).json({ error: "Failed to repost job" });
    }
});

app.put('/api/admin/jobs/:id/status', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const job = await JobPost.findById(req.params.id);
        if (!job) return res.status(404).json({ error: "Job not found" });

        if ((status === 'dropped' || status === 'fulfilled') && job.guest_resumes && job.guest_resumes.length > 0) {
            for (const public_id of job.guest_resumes) {
                await cloudinary.uploader.destroy(public_id);
            }
            job.guest_resumes = [];
        }

        job.status = status;
        await job.save();
        res.json({ success: true, message: `Job marked as ${status}.` });
    } catch (error) {
        res.status(500).json({ error: "Failed to update job status" });
    }
});

// ==========================================
// 10. SERVER INITIALIZATION
// ==========================================
// Export app for Vercel serverless - only listen when running locally
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Backend Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;


