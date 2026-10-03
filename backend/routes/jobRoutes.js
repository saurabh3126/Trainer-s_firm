// routes/jobRoutes.js
const TrainerContactEvent = require('../models/TrainerContactEvent');
const express = require('express');
const router = express.Router();
const { GoogleGenAI, Type } = require('@google/genai');
const Vendor = require('../models/Vendor');
const JobPost = require('../models/JobPost');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Route: POST /api/jobs/parse
// Purpose: JIT Vendor Registration & AI Text Parsing
router.post('/parse', async (req, res) => {
    try {
        const { raw_text, vendor_name, vendor_phone } = req.body;

        if (!raw_text || !vendor_name || !vendor_phone) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // 1. Just-In-Time Vendor Registration (Find or Create)
        let vendor = await Vendor.findOne({ contact_value: vendor_phone });
        if (!vendor) {
            vendor = await Vendor.create({
                name: vendor_name,
                contact_method: 'whatsapp',
                contact_value: vendor_phone
            });
        }

        // 2. Structured AI Parsing with Gemini
        const prompt = `
            You are a specialized parser for trainer requirements posted in raw WhatsApp messages.
            Analyze the following raw message and extract the job details.

            Mandatory fields to check:
            - subject (Technology / topic to train)
            - city (Location of the college/training)
            - duration (Days, hours, or weeks)
            - mode ('online', 'offline', or 'hybrid')
            - pay_disclosed (Remuneration or budget if mentioned - convert any 'k' or 'K' to full zeros like 50000)

            If any of these mandatory fields cannot be determined from the text, list them in "missing_mandatory_fields".
            Also provide a "cleaned_text" summary that formats the raw WhatsApp text into clean, professional bullet points.

            Raw text:
            """
            ${raw_text}
            """
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subject: { type: Type.STRING },
                        city: { type: Type.STRING },
                        college_area_notes: { type: Type.STRING },
                        duration: { type: Type.STRING },
                        mode: { type: Type.STRING, enum: ['online', 'offline', 'hybrid'] },
                        pay_disclosed: { type: Type.STRING },
                        cleaned_text: { type: Type.STRING },
                        missing_mandatory_fields: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['subject', 'city', 'missing_mandatory_fields', 'cleaned_text']
                }
            }
        });

        const parsedData = JSON.parse(response.text);

        if (parsedData.pay_disclosed) {
            parsedData.pay_disclosed = parsedData.pay_disclosed.toString().replace(/(\d+(?:\.\d+)?)\s*[kK]\b/g, (_, num) => {
                const parsed = parseFloat(num);
                return isNaN(parsed) ? _ : Math.round(parsed * 1000).toString();
            });
        }

        res.status(200).json({
            success: true,
            vendor_id: vendor._id,
            parsed_data: parsedData,
            raw_text: raw_text
        });

    } catch (error) {
        console.error("AI Parsing Error:", error);
        res.status(500).json({ success: false, message: "Failed to parse text with AI." });
    }
});

// Route: POST /api/jobs/create
// Purpose: Finalize and publish the job post
router.post('/create', async (req, res) => {
    try {
        const { vendor_id, subject, city, college_area_notes, duration, mode, tfa_status, local_preference, pay_disclosed, raw_text, cleaned_text } = req.body;

        const newJob = await JobPost.create({
            vendor_id, subject, city, college_area_notes, duration, mode, tfa_status, local_preference, pay_disclosed, raw_text, cleaned_text, status: 'open'
        });

        res.status(201).json({ success: true, message: "Job posted successfully!", job: newJob });
    } catch (error) {
        console.error("Create Job Error:", error);
        res.status(500).json({ success: false, message: "Failed to create job posting." });
    }
});
// Route: GET /api/jobs
// Purpose: Fetch all open jobs for the public Trainer board (with optional filters)
router.get('/', async (req, res) => {
    try {
        const { city, subject } = req.query;
        let filter = { status: 'open' };
        
        // Add basic text searching if the trainer uses the filters
        if (city) filter.city = new RegExp(city, 'i');
        if (subject) filter.subject = new RegExp(subject, 'i');

        const jobs = await JobPost.find(filter)
            // We populate the vendor name, but WE DO NOT send the contact info here to prevent scraping
            .populate('vendor_id', 'name rating_placeholder') 
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, jobs });
    } catch (error) {
        console.error("Fetch Jobs Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch jobs." });
    }
});

// Route: POST /api/jobs/contact
// Purpose: Trainer clicks "Contact about this" (JIT Registration + Securely fetching Vendor info)
router.post('/contact', async (req, res) => {
    try {
        const { job_post_id, trainer_name, trainer_contact } = req.body;

        if (!job_post_id || !trainer_name || !trainer_contact) {
            return res.status(400).json({ success: false, message: "Missing trainer details." });
        }

        // 1. Log the contact event (Just-In-Time Trainer capture)
        await TrainerContactEvent.create({
            job_post_id,
            trainer_name,
            trainer_contact
        });

        // 2. Securely fetch the Vendor's actual contact details from the database
        const job = await JobPost.findById(job_post_id).populate('vendor_id');
        if (!job) return res.status(404).json({ success: false, message: "Job not found." });

        const vendor = job.vendor_id;

        // 3. Generate the pre-filled branded message
        const message = `Hi ${vendor.name}, I saw your requirement for ${job.subject} in ${job.city} on the Job Board. I am interested and would love to connect!`;

        // 4. Send the contact details back to the frontend to trigger the WhatsApp deep-link
        res.status(200).json({
            success: true,
            vendor_contact_method: vendor.contact_method, // e.g., 'whatsapp'
            vendor_contact_value: vendor.contact_value,   // e.g., '919876543210'
            pre_filled_message: message
        });

    } catch (error) {
        console.error("Contact Event Error:", error);
        res.status(500).json({ success: false, message: "Failed to process contact event." });
    }
});

// Route: PUT /api/jobs/:id (Edit Job)
app.put('/api/jobs/:id', async (req, res) => {
    try {
        const job = await JobPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        res.status(200).json({ success: true, job });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update job' });
    }
});

// Route: DELETE /api/jobs/:id (Delete Job)
app.delete('/api/jobs/:id', async (req, res) => {
    try {
        const job = await JobPost.findByIdAndDelete(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        res.status(200).json({ success: true, message: 'Job deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete job' });
    }
});

module.exports = router;
