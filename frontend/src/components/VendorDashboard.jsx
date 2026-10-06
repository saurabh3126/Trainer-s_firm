import toast from 'react-hot-toast';
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Loader2, Send, CheckCircle, ArrowRight, Briefcase, Bookmark, LogIn, X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Loader from './Loader.jsx';
import { formatPhoneWithSpace, cleanPhone } from '../utils/phoneFormatter';

const FIELD_LABELS = {
    subject: "Subject / Technology",
    city: "City / Location",
    duration: "Duration",
    mode: "Training Mode (Onsite, Remote, Hybrid)",
    pay_disclosed: "Pay / Budget",
    tfa: "TFA (Travel/Food/Accommodation)"
};

const MANDATORY_FIELDS = ['subject', 'city', 'mode', 'duration'];

const POPULAR_TECHS = [
    "MERN Stack", "React", "Node.js", "Python", 
    "Data Structures", "Java", "C++", "PHP", 
    "AWS", "Power BI"
];

const INDIAN_CITIES = [
    "Agra", "Ahmedabad", "Ajmer", "Aligarh", "Allahabad", "Amravati", "Amritsar", "Asansol", "Aurangabad", 
    "Bangalore", "Bareilly", "Belgaum", "Bhavnagar", "Bhilai", "Bhiwandi", "Bhopal", "Bhubaneswar", "Bikaner", "Chandigarh", 
    "Chennai", "Coimbatore", "Cuttack", "Dehradun", "Delhi", "Dhanbad", "Durgapur", "Erode", "Faridabad", "Firozabad", 
    "Ghaziabad", "Gorakhpur", "Gulbarga", "Guntur", "Gurugram", "Guwahati", "Gwalior", "Hubballi-Dharwad", "Hyderabad", 
    "Indore", "Jabalpur", "Jaipur", "Jalandhar", "Jalgaon", "Jammu", "Jamnagar", "Jamshedpur", "Jhansi", "Jodhpur", 
    "Kakinada", "Kalyan-Dombivli", "Kanpur", "Kochi", "Kolhapur", "Kolkata", "Kota", "Kozhikode", "Kurnool", "Lucknow", 
    "Ludhiana", "Madurai", "Malegaon", "Mangalore", "Meerut", "Mira-Bhayandar", "Moradabad", "Mumbai", "Mysuru", "Nagpur", 
    "Nanded", "Nashik", "Nellore", "Noida", "Patna", "Pimpri-Chinchwad", "Pune", "Raipur", "Rajamahendravaram", "Rajkot", 
    "Ranchi", "Rourkela", "Saharanpur", "Salem", "Sangli", "Siliguri", "Solapur", "Srinagar", "Surat", 
    "Thane", "Thiruvananthapuram", "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Udaipur", "Ujjain", "Ulhasnagar", 
    "Vadodara", "Varanasi", "Vasai-Virar", "Vellore", "Vijayawada", "Visakhapatnam", "Warangal"
];

export default function VendorDashboard() {
    const { user, login: loginFn, register: registerFn } = useContext(AuthContext);

    const [formData, setFormData] = useState({ 
        vendor_name: '', 
        contact_number: '', 
        vendor_phone: '', // WhatsApp number
        vendor_email: '', // optional email
        same_as_whatsapp: false,
        raw_text: '' 
    });
    const [parseAlert, setParseAlert] = useState('');
    const [parseErrors, setParseErrors] = useState({});
    const [pendingParse, setPendingParse] = useState(false);
    const [parsedData, setParsedData] = useState(null);
    const [vendorId, setVendorId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    const [vendorJobs, setVendorJobs] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showFulfillForm, setShowFulfillForm] = useState(false);
    const [fulfillList, setFulfillList] = useState([{ trainer_name: '', trainer_phone: '' }]);
    const [fulfillLoading, setFulfillLoading] = useState(false);
const [fulfillingJobId, setFulfillingJobId] = useState(null);
    const [appStep, setAppStep] = useState('input'); 
    const [currentMissingIndex, setCurrentMissingIndex] = useState(0);
    const [wizardSubStep, setWizardSubStep] = useState('prompt'); 
    const [drafts, setDrafts] = useState([]);

    // Full page theme modal state for Mode Selection
    const [isModeModalOpen, setIsModeModalOpen] = useState(false);
    const [showVendorRegModal, setShowVendorRegModal] = useState(false);
    const [modalMode, setModalMode] = useState('register'); // 'register' | 'login'
    const [vendorRegData, setVendorRegData] = useState({ name: '', email: '', password: '', phone: '', whatsapp_number: '', same_as_phone: true });
    const [vendorRegStep, setVendorRegStep] = useState('form'); // 'form' | 'otp'
    const [vendorRegOtp, setVendorRegOtp] = useState('');
    const [vendorRegLoading, setVendorRegLoading] = useState(false);
    const [vendorRegError, setVendorRegError] = useState('');
    const [vendorFieldErrors, setVendorFieldErrors] = useState({});
    const getVendorInputCls = (name) => `w-full px-3 py-2.5 bg-white border rounded-lg text-[13px] font-medium placeholder-zinc-400 focus:outline-none focus:ring-1 transition-all ${vendorFieldErrors && vendorFieldErrors[name] ? 'border-red-500 ring-red-500' : 'border-zinc-200 focus:border-black focus:ring-black'}`;
    const [showPassword, setShowPassword] = useState(false);
    const [vendorSmsFailed, setVendorSmsFailed] = useState(false);

    // Lock background scroll when modal is open
    
    useEffect(() => {
        if (user && (user.role === 'vendor' || user.role === 'admin')) {
            const rawPhone = user.phone || '';
            const rawWhatsapp = user.whatsapp_number || user.phone || '';
            const contact = cleanPhone(rawPhone);
            const whatsapp = cleanPhone(rawWhatsapp);
            const sameAsContact = whatsapp === contact || !whatsapp;
            
            setFormData(prev => ({
                ...prev,
                vendor_name: user.name || prev.vendor_name || '',
                contact_number: contact || prev.contact_number || '',
                vendor_phone: sameAsContact ? (contact || prev.contact_number) : (whatsapp || prev.vendor_phone),
                vendor_email: user.personal_email || user.email || prev.vendor_email || '',
                same_as_whatsapp: sameAsContact
            }));
            fetchVendorHistory();
        } else {
            fetchVendorHistory();
        }
    }, [user]);

    useEffect(() => {
        if (user && pendingParse) {
            setPendingParse(false);
            handleParse();
        }
    }, [user, pendingParse]);

    const handleFulfillSubmit = async (e) => {
        e.preventDefault();
        setFulfillLoading(true);
        try {
            const token = localStorage.getItem('venty_token');
            await axios.put(`/api/jobs/${selectedJob._id}/fulfill`, fulfillData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Job successfully marked as fulfilled!');
            setShowFulfillForm(false);
            setSelectedJob(null);
            fetchVendorHistory();
        } catch (error) {
            console.error('Error fulfilling job:', error);
            toast.error('Failed to mark job as fulfilled. Please try again.');
        }
        setFulfillLoading(false);
    };

    const fetchVendorHistory = async () => {
        setLoadingHistory(true);
        try {
            const token = localStorage.getItem('venty_token'); 
            if (token) {
                const res = await axios.get('/api/users/history', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.jobs) {
                    setVendorJobs(res.data.jobs);
                }
            } else {
                setVendorJobs([]);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
            setVendorJobs([]);
        }
        setLoadingHistory(false);
    };

    const canFulfillJob = (job) => {
        if (!user || !job) return false;
        
        const currentUserId = (user.id || user._id || '').toString();
        const jobUserId = (job.posted_by_user?._id || job.posted_by_user || '').toString();
        if (jobUserId && currentUserId && jobUserId === currentUserId) return true;

        const userPhone = (user.phone || '').replace(/\D/g, '').slice(-10);
        const vendorPhone = (job.vendor_id?.phone || job.vendor_phone || '').replace(/\D/g, '').slice(-10);
        if (userPhone && vendorPhone && userPhone === vendorPhone) return true;
        
        return false;
    };

    const handleFulfillClick = (jobId, e) => {
        e.stopPropagation();
        setFulfillingJobId(jobId);
        setFulfillList([{ trainer_name: '', trainer_phone: '' }]);
    };

    const submitFulfill = async () => {
        for (const t of fulfillList) {
            if (!t.trainer_name || !t.trainer_phone) {
                return toast.error("Please provide both the trainer's name and phone number for all entries.");
            }
        }
        
        const payload = {
            trainer_name: fulfillList.map(t => t.trainer_name).join(', '),
            trainer_phone: fulfillList.map(t => t.trainer_phone).join(', ')
        };

        try {
            const token = localStorage.getItem('venty_token'); 
            await axios.put(`/api/jobs/${fulfillingJobId}/fulfill`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFulfillingJobId(null);
            fetchVendorHistory(); 
        } catch (error) {
            console.error("Fulfill error:", error);
            toast.error(error.response?.data?.error || "Failed to fulfill job.");
        }
    };

    useEffect(() => {
        if (user) {
            const saved = localStorage.getItem(`venty_drafts_${user.id || user._id}`);
            if (saved) {
                try {
                    setDrafts(JSON.parse(saved));
                } catch (e) {
                    console.error("Error parsing drafts", e);
                }
            }
        }
    }, [user]);

    const saveCurrentDraft = () => {
        if (!formData.raw_text.trim()) return toast.error("Nothing to save!");
        const newDraft = { id: Date.now(), text: formData.raw_text, date: new Date().toISOString() };
        const updated = [newDraft, ...drafts];
        setDrafts(updated);
        localStorage.setItem(`venty_drafts_${user.id || user._id}`, JSON.stringify(updated));
        toast.success("Draft saved successfully!");
    };

    const handleSelectDraft = (d) => {
        setFormData(prev => ({ ...prev, raw_text: d.text }));
    };

    
    const handleDeleteJob = async (jobId) => {
        if (!window.confirm("Are you sure you want to delete this job permanently?")) return;
        try {
            await axios.delete(`/api/jobs/${jobId}`);
            setJobHistory(jobHistory.filter(j => j._id !== jobId));
            if (selectedJob && selectedJob._id === jobId) setSelectedJob(null);
            toast.success("Job deleted successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete job");
        }
    };

    const handleDeleteDraft = (id, e) => {
        e.stopPropagation();
        const updated = drafts.filter(d => d.id !== id);
        setDrafts(updated);
        localStorage.setItem(`venty_drafts_${user.id || user._id}`, JSON.stringify(updated));
    };

    const handleParse = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setParseAlert('');
        setParseErrors({});
        let errors = {};
        
        const cleanContact = cleanPhone(formData.contact_number);
        const cleanWhatsapp = formData.same_as_whatsapp ? cleanContact : cleanPhone(formData.vendor_phone);

        if (!formData.vendor_name || !formData.vendor_name.trim()) errors.vendor_name = true;
        if (cleanContact.length !== 10) errors.contact_number = true;
        if (!formData.same_as_whatsapp && cleanWhatsapp.length !== 10) errors.vendor_phone = true;
        if (!formData.raw_text || !formData.raw_text.trim()) errors.raw_text = true;

        if (Object.keys(errors).length > 0) {
            setParseErrors(errors);
            let msg = "Please fill in all highlighted fields correctly.";
            if (errors.vendor_name) msg = "Please enter your Name or Company Name.";
            else if (errors.contact_number) msg = "Please enter a valid 10-digit Contact number.";
            else if (errors.vendor_phone) msg = "Please enter a valid 10-digit WhatsApp number.";
            else if (errors.raw_text) msg = "Please paste or write your requirement text before proceeding.";
            setParseAlert(msg);
            return;
        }

        // Check if user is logged in before proceeding with parsing
        if (!user) { 
            setVendorRegData(prev => ({
                ...prev,
                name: formData.vendor_name || '',
                email: formData.vendor_email || '',
                phone: cleanContact || '',
                whatsapp_number: cleanWhatsapp || '',
                same_as_phone: formData.same_as_whatsapp
            }));
            setPendingParse(true);
            setShowVendorRegModal(true); 
            return; 
        }

        setLoading(true);
        setSuccessMessage('');
        try {
            const payload = {
                ...formData,
                contact_number: cleanContact,
                vendor_phone: `+91${cleanWhatsapp}`
            };

            const res = await axios.post('/api/jobs/parse', payload);
            const data = res.data.parsed_data;
            setParsedData(data);
            setVendorId(res.data.vendor_id);
            
            if (data.missing_fields && data.missing_fields.length > 0) {
                setCurrentMissingIndex(0);
                setWizardSubStep('prompt');
                setAppStep('wizard');
            } else {
                setAppStep('review');
            }
        } catch (error) {
            console.error(error);
            toast.error("Error parsing data. Ensure your backend server is running.");
        }
        setLoading(false);
    };


    const normalizeMode = (m) => {
        if (!m) return undefined;
        const lc = m.toLowerCase().trim();
        if (lc === 'onsite') return 'offline';
        if (lc === 'remote') return 'online';
        if (['online', 'offline', 'hybrid'].includes(lc)) return lc;
        return undefined;
    };

    const handlePublish = async () => {
        const missingKeys = MANDATORY_FIELDS.filter(key => !parsedData[key] || parsedData[key].toString().trim() === '');
        if (missingKeys.length > 0) {
            return toast.error(`Cannot publish. Missing: ${missingKeys.map(k => FIELD_LABELS[k] || k).join(', ')}`);
        }
        setPublishing(true);
        try {
            const payload = {
                vendor_id: vendorId,
                raw_text: formData.raw_text,
                subject: parsedData.subject,
                city: parsedData.city,
                duration: parsedData.duration,
                mode: normalizeMode(parsedData.mode),
                tfa: parsedData.tfa || undefined,
                pay_disclosed: parsedData.pay_disclosed || undefined,
                college_area_notes: parsedData.college_area_notes || undefined,
                cleaned_text: parsedData.cleaned_text || undefined,
                custom_fields: parsedData.custom_fields || undefined,
            };
            const token = localStorage.getItem('venty_token');
            await axios.post('/api/jobs/create', payload, { headers: { Authorization: `Bearer ${token}` } });
            setSuccessMessage('Job published successfully to the Trainer Board!');
            setParsedData(null);
            setFormData({ vendor_name: user?.name || '', contact_number: '', vendor_phone: user?.phone || '', vendor_email: user?.email || '', same_as_whatsapp: false, raw_text: '' });
            setAppStep('input');
            fetchVendorHistory();
        } catch (error) {
            console.error('Publish error:', error.response?.data || error.message);
            toast.error(`Error publishing: ${error.response?.data?.error || error.message}`);
        }
        setPublishing(false);
    };

    const handleVendorResendEmail = async () => {
        setVendorResendingEmail(true);
        try {
            await axios.post('/api/auth/resend-otp-email', { email: vendorRegData.email, phone: vendorRegData.phone.replace(/\D/g, '') });
            setVendorOtpChannel('email');
        } catch (err) {
            setVendorRegError(err.response?.data?.error || 'Failed to send email.');
        }
        setVendorResendingEmail(false);
    };

    const handleVendorLoginSubmit = async (e) => {
        e.preventDefault();
        setVendorRegError('');
        setVendorFieldErrors({});
        let currentErrors = {};
        if (!vendorRegData.email) currentErrors.email = true;
        if (!vendorRegData.password) currentErrors.password = true;
        
        if (Object.keys(currentErrors).length > 0) {
            setVendorFieldErrors(currentErrors);
            return setVendorRegError('Please fill out the highlighted fields correctly.');
        }

        setVendorRegLoading(true);
        try {
            const res = await loginFn(vendorRegData.email, vendorRegData.password);
            if (res?.success) {
                setShowVendorRegModal(false);
                setVendorRegData({ name: '', email: '', password: '', phone: '', whatsapp_number: '', same_as_phone: true });
            }
        } catch (err) {
            setVendorFieldErrors({ email: true, password: true });
            setVendorRegError(err.response?.data?.error || 'Invalid email or password. Please try again.');
        }
        setVendorRegLoading(false);
    };

    const handleVendorRegister = async (e) => {
        e?.preventDefault();
        setVendorRegError('');
        setVendorFieldErrors({});
        
        if (vendorRegStep === 'form') {
            let currentErrors = {};
            if (!vendorRegData.name.trim()) currentErrors.name = true;
            if (!vendorRegData.email) currentErrors.email = true;
            else if (vendorRegData.email && !/^[^s@]+@[^s@]+.[^s@]+$/.test(vendorRegData.email)) currentErrors.email = true;
            if (vendorRegData.phone.replace(/\D/g,'').length !== 10) currentErrors.phone = true;
            const pass = vendorRegData.password;
            const hasLetters = /[a-zA-Z]/.test(pass);
            const hasNumbers = /[0-9]/.test(pass);
            if (pass.length < 8 || !(hasLetters && hasNumbers)) currentErrors.password = true;
            
            if (Object.keys(currentErrors).length > 0) {
                setVendorFieldErrors(currentErrors);
                let errMsg = 'Please fill out all highlighted fields correctly.';
                if (currentErrors.email && vendorRegData.email) errMsg = 'Please enter a valid email address (e.g., name@example.com).';
                else if (currentErrors.password) errMsg = 'Password must be at least 8 characters and include a letter and number.';
                else if (currentErrors.phone) errMsg = 'Please enter a valid 10-digit phone number.';
                return setVendorRegError(errMsg);
            }
            
            setVendorRegLoading(true);
            setVendorSmsFailed(false);
            try {
                const otpRes = await axios.post('/api/auth/send-otp', { email: vendorRegData.email || undefined, phone: vendorRegData.phone.replace(/\D/g, '') });
                if (otpRes.data && otpRes.data.smsFailed) setVendorSmsFailed(true);
                setVendorRegStep('otp');
            } catch (err) {
                setVendorRegError(err.response?.data?.error || 'Failed to send OTP.');
            }
            setVendorRegLoading(false);
        } else {
            if (vendorRegOtp.length !== 6) return setVendorRegError('Enter the 6-digit code.');
            setVendorRegLoading(true);
            try {
                const cleanPhone = vendorRegData.phone.replace(/\D/g, '');
                const res = await registerFn({
                    name: vendorRegData.name,
                    email: vendorRegData.email,
                    password: vendorRegData.password,
                    phone: cleanPhone,
                    whatsapp_number: vendorRegData.same_as_phone ? cleanPhone : vendorRegData.whatsapp_number.replace(/\D/g,''),
                    same_as_phone: vendorRegData.same_as_phone,
                    role: 'vendor',
                    otp: vendorRegOtp,
                });
                if (res?.success) {
                    await loginFn(vendorRegData.email || vendorRegData.phone.replace(/\D/g, ''), vendorRegData.password);
                    setShowVendorRegModal(false);
                    setVendorRegStep('form');
                }
            } catch (err) {
                setVendorRegError(err.response?.data?.error || 'Invalid OTP. Try again.');
            }
            setVendorRegLoading(false);
        }
    };

    const handleSaveInputValue = () => {
        const currentField = parsedData.missing_fields[currentMissingIndex];
        const currentValue = parsedData[currentField];
        const isMandatory = MANDATORY_FIELDS.includes(currentField);

        if (isMandatory && (!currentValue || currentValue.toString().trim() === '')) {
            return toast.error(`${FIELD_LABELS[currentField]} is a mandatory field. Please enter a value to continue.`);
        }

        advanceWizard();
    };

    const advanceWizard = () => {
        if (currentMissingIndex < parsedData.missing_fields.length - 1) {
            setCurrentMissingIndex(currentMissingIndex + 1);
            setWizardSubStep('prompt'); 
        } else {
            setAppStep('review'); 
        }
    };

    // Calculate percentage complete
    const calculateCompletion = () => {
        if (!parsedData) return 20;
        let score = 20;
        if (formData.vendor_name && formData.contact_number) score += 20;
        if (parsedData.subject) score += 20;
        if (parsedData.city) score += 15;
        if (parsedData.mode) score += 10;
        if (parsedData.duration) score += 15;
        return Math.min(score, 100);
    };

    return (
        <div className="flex-1 flex flex-col pt-2 sm:pt-8">
            <datalist id="indian-cities">
                {INDIAN_CITIES.map(city => <option key={city} value={city} />)}
            </datalist>
            
            <datalist id="tech-options">
                {POPULAR_TECHS.map(tech => <option key={tech} value={tech} />)}
            </datalist>

            <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 xl:px-8 relative flex-1 space-y-4 sm:space-y-8 pb-16">
                {/* Header Title Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:gap-3.5">
                        {/* Emblem Logo */}
                        <img src="/logo-mark.png" alt="Trainer Firm" className="hidden sm:block sm:w-11 sm:h-11 object-contain flex-shrink-0" />

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-zinc-900 tracking-wider uppercase">
                                    TRAINER FIRM
                                </span>
                                <span className="text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase">
                                    • Vendor Dashboard
                                </span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black tracking-tighter mt-0.5 drop-shadow-sm">
                                Create a trainer requirement.
                            </h1>
                        </div>
                    </div>
                </div>

                {successMessage && (
                    <div className="p-4 bg-emerald-50 text-emerald-900 border-2 border-emerald-600 rounded-xl flex items-center gap-3 font-bold text-sm shadow-md">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* Main 2-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
                    
                    {/* LEFT COLUMN: The Form & Input Steps (Cols 1-7) */}
                    <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-4 sm:p-8 shadow-sm space-y-6 sm:space-y-8">
                        
                        {/* Compact Drafts Strip (Mobile Only, Inside Form) */}
                        {user && drafts.length > 0 && (
                            <div className="lg:hidden p-3 bg-zinc-50 border border-zinc-200 rounded-xl mb-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Resume a Draft</span>
                                    <span className="text-[10px] font-black text-zinc-400">{drafts.length} saved</span>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                    {drafts.map((d) => (
                                        <button
                                            key={d.id}
                                            onClick={() => handleSelectDraft(d)}
                                            className="flex-shrink-0 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-left hover:border-zinc-600 transition-all group max-w-[140px]"
                                        >
                                            <p className="text-[11px] font-black text-zinc-900 truncate group-hover:text-black">{d.title}</p>
                                            <p className="text-[9px] text-zinc-400">{new Date(d.savedAt).toLocaleDateString()}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Compact Drafts CTA (Mobile Only, Guest, Inside Form) */}
                        {!user && (
                            <div className="lg:hidden flex items-center justify-between gap-3 p-3 bg-zinc-950 text-white rounded-xl mb-6 shadow-sm border border-zinc-800">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Bookmark className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black tracking-wide truncate">Keep Messages as Drafts</p>
                                        <p className="text-[9px] text-zinc-400 truncate">Log in to never lose work.</p>
                                    </div>
                                </div>
                                <Link to="/auth" className="flex-shrink-0 px-3 py-1.5 bg-white text-black rounded-lg text-[10px] font-black tracking-wide">
                                    LOG IN
                                </Link>
                            </div>
                        )}

                        {/* 1. Vendor Contact */}
                        <div className="space-y-4">
                            <h2 className="text-base font-black text-zinc-900 tracking-tight">
                                1. Vendor contact
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-zinc-900 mb-1.5">
                                        Your Name / Agency Name
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="E.g., Rajesh Sharma / Northstar Learning"
                                        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all disabled:bg-zinc-50 disabled:text-zinc-500 ${parseErrors.vendor_name ? 'border-red-500 ring-red-500 text-red-900' : 'border-zinc-200 focus:ring-zinc-900 focus:border-zinc-900'}`}
                                        value={formData.vendor_name}
                                        onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                                        disabled={!!user && user.role !== 'admin'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-zinc-900 mb-1.5">
                                        Contact Number
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-xs font-black text-zinc-500 select-none">
                                            +91
                                        </span>
                                        <input 
                                            type="text" 
                                            required 
                                            maxLength="10" 
                                            pattern="\d{10}"
                                            placeholder="80412 97840"
                                            className={`w-full pl-12 pr-3.5 py-2.5 bg-white border rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all disabled:bg-zinc-50 disabled:text-zinc-500 ${parseErrors.contact_number ? 'border-red-500 ring-red-500 text-red-900' : 'border-zinc-200 focus:ring-zinc-900 focus:border-zinc-900'}`}
                                            value={formData.contact_number}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (formData.same_as_whatsapp) {
                                                    setFormData({...formData, contact_number: val, vendor_phone: val});
                                                } else {
                                                    setFormData({...formData, contact_number: val});
                                                }
                                            }}
                                            disabled={!!user && user.role !== 'admin'}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-zinc-900 mb-1.5">
                                        WhatsApp Number
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-xs font-black text-zinc-500 select-none">
                                            +91
                                        </span>
                                        <input 
                                            type="text" 
                                            required 
                                            maxLength="10" 
                                            pattern="\d{10}"
                                            placeholder="80412 97840"
                                            className={`w-full pl-12 pr-3.5 py-2.5 bg-white border rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all disabled:bg-zinc-50 disabled:text-zinc-400 ${parseErrors.vendor_phone ? 'border-red-500 ring-red-500 text-red-900' : 'border-zinc-200 focus:ring-zinc-900 focus:border-zinc-900'}`}
                                            value={formData.vendor_phone}
                                            disabled={formData.same_as_whatsapp}
                                            onChange={(e) => setFormData({...formData, vendor_phone: e.target.value.replace(/\D/g, '')})}
                                        />
                                    </div>
                                    {/* Switch Pill Toggle */}
                                    <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = !formData.same_as_whatsapp;
                                        setFormData({
                                            ...formData,
                                            same_as_whatsapp: next,
                                            vendor_phone: next ? formData.contact_number : ''
                                        });
                                    }}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border border-zinc-200 transition-colors duration-200 ease-in-out focus:outline-none ${
                                        formData.same_as_whatsapp ? 'bg-black' : 'bg-zinc-200'
                                    }`}
                                >
                                    <span 
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                            formData.same_as_whatsapp ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                                <span className="text-xs font-bold text-zinc-800">
                                    WhatsApp is the same as contact number
                                </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-zinc-900 mb-1.5">
                                        Email <span className="text-zinc-400 font-bold">(optional)</span>
                                    </label>
                                    <input 
                                        type="email"
                                        placeholder="ops@company.in"
                                        className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all disabled:bg-zinc-50 disabled:text-zinc-500"
                                        value={formData.vendor_email}
                                        onChange={(e) => setFormData({...formData, vendor_email: e.target.value})}
                                        disabled={!!user && user.role !== 'admin'}
                                    />
                                </div>
                            </div>
                        </div>

                        
                          {parseAlert && (
                              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-medium mb-4">
                                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                  <span>{parseAlert}</span>
                              </div>
                          )}
                          {/* 2. Paste the raw requirement */}
                        <div className="space-y-4 pt-4 border-t border-zinc-100">
                            <h2 className="text-base font-black text-zinc-900 tracking-tight">
                                2. Paste the raw requirement
                            </h2>

                            <div className="relative">
                                <textarea 
                                    rows="5"
                                    required
                                    placeholder="Need senior AWS trainer in Bangalore for 5 days, Oct 12-16. Audience is 24 cloud engineers, 5+ years. Must cover SAA-C03, Terraform, VPC, IAM and EKS. Hybrid delivery. Please share profile today."
                                    className={`w-full p-4 bg-white border rounded-xl text-sm font-semibold leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all resize-none shadow-inner ${parseErrors.raw_text ? 'border-red-500 ring-red-500' : 'border-zinc-200 focus:ring-zinc-900'}`}
                                    value={formData.raw_text}
                                    onChange={(e) => setFormData({...formData, raw_text: e.target.value})}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                                <div className="flex items-center gap-2">
                                    {user && (
                                        <button 
                                            type="button"
                                            onClick={saveCurrentDraft}
                                            className="px-3.5 py-2 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                                        >
                                            Save as Draft
                                        </button>
                                    )}
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleParse}
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-md border border-zinc-200 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {loading ? 'Processing...' : 'PROCEED'}
                                </button>
                            </div>
                        </div>

                        {/* 3. Interactive Clarification Box */}
                        {appStep === 'wizard' && parsedData && (
                            <div className="mt-6 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-4">
                                <div className="flex items-center justify-between text-xs font-black text-zinc-600">
                                    <span className="text-zinc-900 font-black">
                                        {parsedData.missing_fields.length - currentMissingIndex} details still needed
                                    </span>
                                    <span>
                                        Step {currentMissingIndex + 1} of {parsedData.missing_fields.length}
                                    </span>
                                </div>

                                {(() => {
                                    const currentField = parsedData.missing_fields[currentMissingIndex];
                                    const label = FIELD_LABELS[currentField] || currentField;

                                    return (
                                        <div className="space-y-4 pt-2">
                                            <h3 className="text-lg font-black text-zinc-900">
                                                What is the target {label.toLowerCase()}?
                                            </h3>

                                            {/* Specific input format for duration */}
                                            {currentField === 'duration' && (
                                                <div className="space-y-3">
                                                    <input 
                                                        type="text"
                                                        placeholder="Enter duration (e.g. 3, 5, 10)..."
                                                        className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none"
                                                        value={parsedData.duration ? parsedData.duration.replace(/\s*(days|weeks|months|day|week|month).*/i, '') : ''}
                                                        onChange={(e) => {
                                                            const num = e.target.value;
                                                            const unit = parsedData._durationUnit || 'Days';
                                                            setParsedData({
                                                                ...parsedData, 
                                                                duration: num ? `${num} ${unit}` : '',
                                                                _durationNum: num
                                                            });
                                                        }}
                                                    />
                                                    <div className="flex gap-2">
                                                        {['Days', 'Weeks', 'Months'].map((unit) => {
                                                            const activeUnit = parsedData._durationUnit || 'Days';
                                                            const isSelected = activeUnit === unit;
                                                            return (
                                                                <button
                                                                    key={unit}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const num = parsedData._durationNum || parsedData.duration?.split(' ')[0] || '';
                                                                        setParsedData({
                                                                            ...parsedData,
                                                                            _durationUnit: unit,
                                                                            duration: num ? `${num} ${unit}` : ''
                                                                        });
                                                                    }}
                                                                    className={`flex-1 py-2 px-3 rounded-xl border border-zinc-200 text-xs font-black transition-all ${
                                                                        isSelected ? 'bg-black text-white' : 'bg-white text-zinc-900 hover:bg-zinc-100'
                                                                    }`}
                                                                >
                                                                    {unit}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Quick options for pay */}
                                            {currentField === 'pay_disclosed' && (
                                                <div className="space-y-3">
                                                    <input 
                                                        type="text"
                                                        placeholder="Enter amount (e.g. 15000)..."
                                                        className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none"
                                                        value={parsedData.pay_disclosed ? parsedData.pay_disclosed.replace(/\s*(\/day|\/week|\/month).*/i, '') : ''}
                                                        onChange={(e) => {
                                                            const num = e.target.value;
                                                            const unit = parsedData._payUnit || '/day';
                                                            setParsedData({
                                                                ...parsedData, 
                                                                pay_disclosed: num ? `${num}${unit}` : '',
                                                                _payNum: num
                                                            });
                                                        }}
                                                    />
                                                    <div className="flex gap-2">
                                                        {['/day', '/week', '/month'].map((unit) => {
                                                            const activeUnit = parsedData._payUnit || '/day';
                                                            const isSelected = activeUnit === unit;
                                                            return (
                                                                <button
                                                                    key={unit}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const num = parsedData._payNum || parsedData.pay_disclosed?.split('/')[0].trim() || '';
                                                                        setParsedData({
                                                                            ...parsedData,
                                                                            _payUnit: unit,
                                                                            pay_disclosed: num ? `${num}${unit}` : ''
                                                                        });
                                                                    }}
                                                                    className={`flex-1 py-2 px-3 rounded-xl border border-zinc-200 text-xs font-black transition-all ${
                                                                        isSelected ? 'bg-black text-white' : 'bg-white text-zinc-900 hover:bg-zinc-100'
                                                                    }`}
                                                                >
                                                                    {unit}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Options for TFA */}
                                            {currentField === 'tfa' && (
                                                <div className="flex gap-3">
                                                    {['Yes', 'No'].map((opt) => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => setParsedData({...parsedData, tfa: opt})}
                                                            className={`flex-1 py-3 rounded-xl text-xs font-black border border-zinc-200 transition-all ${
                                                                parsedData.tfa === opt
                                                                    ? 'bg-black text-white'
                                                                    : 'bg-white text-zinc-900 hover:bg-zinc-100'
                                                            }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Button to Trigger Full-Page Modal Theme for Mode Selection */}
                                            {currentField === 'mode' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsModeModalOpen(true)}
                                                    className="w-full p-4 bg-black text-white border border-zinc-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-md"
                                                >
                                                    {parsedData.mode ? `Selected Mode: ${parsedData.mode.toUpperCase()} (Click to Change)` : 'Open Full Page Mode Selector'}
                                                </button>
                                            )}

                                            {/* Default Input Field */}
                                            {currentField !== 'mode' && currentField !== 'duration' && currentField !== 'tfa' && currentField !== 'pay_disclosed' && (
                                                <input 
                                                    type="text"
                                                    list={currentField === 'subject' ? 'tech-options' : currentField === 'city' ? 'indian-cities' : undefined}
                                                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none"
                                                    placeholder={`Enter ${label}...`}
                                                    value={parsedData[currentField] || ''}
                                                    onChange={(e) => setParsedData({...parsedData, [currentField]: e.target.value})}
                                                />
                                            )}

                                            <div className="flex items-center justify-between pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (currentMissingIndex > 0) {
                                                            setCurrentMissingIndex(currentMissingIndex - 1);
                                                        } else {
                                                            setAppStep('input');
                                                        }
                                                    }}
                                                    className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-900 hover:bg-zinc-200 transition-colors"
                                                >
                                                    BACK
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleSaveInputValue}
                                                    className="px-5 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md border border-zinc-200"
                                                >
                                                    CONTINUE
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* 4. Full Review / Edit Mode before Publishing */}
                        {appStep === 'review' && parsedData && (
                            <div className="mt-6 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-4">
                                <h3 className="text-base font-black text-zinc-900">
                                    Review & Polish Extracted Fields
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-zinc-800 mb-1">Subject / Tech</label>
                                        <input 
                                            type="text" 
                                            list="tech-options"
                                            className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold"
                                            value={parsedData.subject || ''}
                                            onChange={(e) => setParsedData({...parsedData, subject: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-zinc-800 mb-1">City / Location</label>
                                        <input 
                                            type="text" 
                                            list="indian-cities"
                                            className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold"
                                            value={parsedData.city || ''}
                                            onChange={(e) => setParsedData({...parsedData, city: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-zinc-800 mb-1">Duration</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold"
                                                value={parsedData.duration || ''}
                                                onChange={(e) => setParsedData({...parsedData, duration: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-zinc-800 mb-1">Training Mode</label>
                                        <button 
                                            type="button"
                                            onClick={() => setIsModeModalOpen(true)}
                                            className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-left flex justify-between items-center"
                                        >
                                            <span className="capitalize">{parsedData.mode || 'Select Mode...'}</span>
                                            <span className="text-[10px] bg-zinc-200 px-2 py-0.5 rounded font-black">CHANGE</span>
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-zinc-800 mb-1">Budget / Pay</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold"
                                            placeholder="12k-15k"
                                            value={parsedData.pay_disclosed || ''}
                                            onChange={(e) => setParsedData({...parsedData, pay_disclosed: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-zinc-800 mb-1">TFA (Travel/Food/Stay)</label>
                                        <select 
                                            className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold"
                                            value={parsedData.tfa || ''}
                                            onChange={(e) => setParsedData({...parsedData, tfa: e.target.value})}
                                        >
                                            <option value="">Select...</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => { setParsedData(null); setAppStep('input'); }}
                                        className="flex-1 px-4 py-2.5 border border-zinc-200 bg-white rounded-xl text-xs font-black text-zinc-900 hover:bg-zinc-100 transition-colors"
                                    >
                                        Reset & Reparse
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handlePublish}
                                        disabled={publishing}
                                        className="flex-1 px-4 py-2.5 bg-black hover:bg-zinc-800 text-white border border-zinc-200 rounded-xl text-xs font-black transition-colors disabled:opacity-50 shadow-md"
                                    >
                                        {publishing ? 'Publishing...' : 'Confirm & Publish'}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* RIGHT COLUMN: Requirement Review (Dark Card) + Recent Jobs */}
                    <div className="lg:col-span-5 space-y-4 sm:space-y-6">
                        
                        {/* Requirement Review - Dark Card */}
                        {parsedData && (
                            <div className="bg-zinc-950 text-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5 border border-zinc-800 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between pb-3 border-b border-white/20">
                                    <h3 className="text-sm font-black text-white tracking-tight">
                                        Requirement review
                                    </h3>
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                                        {calculateCompletion()}% COMPLETE
                                    </span>
                                </div>

                                <div className="space-y-3.5 text-xs">
                                    <div>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-neutral-400 block mb-0.5">
                                            ROLE
                                        </span>
                                        <p className="font-bold text-white text-sm">
                                            {parsedData.subject || 'Role / Subject'}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-neutral-400 block mb-0.5">
                                            DELIVERY
                                        </span>
                                        <p className="font-bold text-neutral-200 capitalize">
                                            {`${parsedData.mode || 'TBD'} • ${parsedData.city || 'Location TBD'}`}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-neutral-400 block mb-0.5">
                                            DATES / DURATION
                                        </span>
                                        <p className="font-bold text-neutral-200">
                                            {parsedData.duration || 'Duration TBD'}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-neutral-400 block mb-0.5">
                                            TFA
                                        </span>
                                        <p className="font-bold text-neutral-200">
                                            {parsedData.tfa ? `TFA: ${parsedData.tfa}` : 'TFA: Not Specified'}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-neutral-400 block mb-0.5">
                                            BUDGET
                                        </span>
                                        <p className="font-bold text-neutral-200">
                                            {parsedData.pay_disclosed || 'Negotiable'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button 
                                        type="button"
                                        onClick={handlePublish}
                                        disabled={publishing || loading}
                                        className="w-full py-3 bg-white hover:bg-neutral-100 text-zinc-900 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm border border-zinc-200 disabled:opacity-50"
                                    >
                                        {publishing ? 'Publishing...' : 'REVIEW AND PUBLISH'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Saved Drafts Section */}
                        {user ? (
                            <div className="hidden lg:block bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-zinc-900 tracking-tight flex items-center gap-1.5">
                                        Saved drafts
                                    </h3>
                                    <span className="text-[10px] font-black text-zinc-500">
                                        {drafts.length} saved
                                    </span>
                                </div>

                                {drafts.length === 0 ? (
                                    <p className="text-xs font-bold text-zinc-500">
                                        No saved drafts yet. Click "Save as Draft" while writing a requirement to resume anytime.
                                    </p>
                                ) : (
                                    <div className="space-y-2.5">
                                        {drafts.map((d) => (
                                            <div 
                                                key={d.id}
                                                onClick={() => handleSelectDraft(d)}
                                                className="bg-white p-3 rounded-xl border border-zinc-200 shadow-md hover:border-zinc-600 transition-all cursor-pointer group flex items-center justify-between gap-3"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-xs font-black text-zinc-900 truncate group-hover:text-blue-600 transition-colors">
                                                        {d.title}
                                                    </h4>
                                                    <span className="text-[10px] font-bold text-zinc-500">
                                                        {new Date(d.savedAt).toLocaleDateString()} • Click to load
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteDraft(d.id, e)}
                                                    className="text-zinc-500 hover:text-red-600 p-1 rounded font-black text-xs"
                                                    title="Delete draft"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden lg:block bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-3.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center border border-zinc-200">
                                        <Bookmark className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-zinc-900 tracking-tight leading-tight">
                                            Keep Messages as Drafts
                                        </h3>
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                                            Never lose your work
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs font-semibold text-zinc-700 leading-relaxed">
                                    Drafting a complex training requirement or waiting on client details? Log in to save your draft messages securely and resume anytime from any device.
                                </p>
                                <div className="pt-1">
                                    <Link 
                                        to="/auth" 
                                        className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-black transition-all shadow-md border border-zinc-200"
                                    >
                                        <LogIn className="w-3.5 h-3.5" />
                                        Log in to unlock drafts &rarr;
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Recent Jobs */}
                        <div id="my-jobs" className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 scroll-mt-24">
                            <h3 className="text-sm font-black text-zinc-900 tracking-tight">
                                Posted jobs
                            </h3>

                            {loadingHistory ? (
                                <div className="flex justify-center py-6">
                                    <Loader />
                                </div>
                            ) : vendorJobs.length === 0 ? (
                                <div className="py-8 px-4 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                                    <p className="text-xs font-bold text-zinc-600 mb-1">No posted jobs yet</p>
                                    <p className="text-[11px] text-zinc-400">
                                        {!user ? 'Log in as a vendor to view and manage your posted requirements.' : 'Jobs you post will appear here.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {vendorJobs.slice(0, 5).map((job) => (
                                        <div 
                                            key={job._id}
                                            className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-md space-y-2 group hover:border-zinc-600 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col max-w-[200px]">
                                                    <h4 className="text-xs font-black text-zinc-900 truncate">
                                                        {job.subject}
                                                    </h4>
                                                    {user?.role === 'admin' && (
                                                        <span className="text-[10px] font-semibold text-zinc-500 truncate mt-0.5">
                                                            Vendor: {job.vendor_id?.name || 'Unknown'}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border border-black ${
                                                    job.status === 'open' ? 'bg-emerald-100 text-emerald-900' :
                                                    job.status === 'fulfilled' ? 'bg-zinc-200 text-zinc-900' :
                                                    'bg-amber-100 text-amber-900'
                                                }`}>
                                                    {job.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600">
                                                <span>{job.city || 'Flexible'} • {job.mode}</span>
                                                <div className="flex items-center gap-3">
                                                    {job.status === 'open' && canFulfillJob(job) && (
                                                        <button 
                                                            onClick={(e) => handleFulfillClick(job._id, e)}
                                                            className="font-black text-emerald-600 hover:text-emerald-700 hover:underline"
                                                        >
                                                            Fulfill
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                                                        className="font-black text-zinc-900 hover:underline"
                                                    >
                                                        Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                </div>

            </main>

            {/* VENDOR REGISTRATION POPUP - shown when unlogged user tries to publish */}
            {showVendorRegModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-zinc-950 px-6 py-5 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-1">Vendor Account</p>
                                <h2 className="text-xl font-bold text-white tracking-tight">
                                    {modalMode === 'login' ? 'Log in.' : (vendorRegStep === 'otp' ? 'Verify your phone.' : 'Create your account.')}
                                </h2>
                                <p className="text-xs text-zinc-400 mt-1">
                                    {modalMode === 'login' ? 'Log in to publish this job.' : (vendorRegStep === 'otp' ? `Code sent to +91${vendorRegData.phone}.` : 'Register to publish this job to the Trainer Board.')}
                                </p>
                            </div>
                            <button onClick={() => { setShowVendorRegModal(false); setVendorRegStep('form'); setVendorRegError(''); }} className="text-zinc-500 hover:text-white mt-0.5 flex-shrink-0">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {vendorRegError && (
                                <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                                    <span>{vendorRegError}</span>
                                </div>
                            )}

                            {modalMode === 'login' ? (
    <form onSubmit={handleVendorLoginSubmit} className="space-y-4">
        <div>
            <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">Email or Phone</label>
                                        <input type="text" required placeholder="email or phone"
                value={vendorRegData.email}
                onChange={(e) => setVendorRegData({ ...vendorRegData, email: e.target.value })}
                className={getVendorInputCls('email')}
            />
        </div>
        <div>
            <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">Password</label>
            <div className="relative">
                <input type={showPassword ? "text" : "password"} required placeholder="••••••••"
                value={vendorRegData.password}
                onChange={(e) => setVendorRegData({ ...vendorRegData, password: e.target.value })}
                className={getVendorInputCls('password')} />
                                        {vendorRegStep === 'form' && vendorRegData.password && (() => {
                                            const pass = vendorRegData.password;
                                            const hasLetters = /[a-zA-Z]/.test(pass);
                                            const hasNumbers = /[0-9]/.test(pass);
                                            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
                                            let msg = 'Weak - requires letter and number';
                                            let col = 'text-red-500';
                                            if (pass.length >= 8) {
                                                if (hasLetters && hasNumbers && hasSpecial) {
                                                    msg = 'Strong'; col = 'text-emerald-600';
                                                } else if (hasLetters && hasNumbers) {
                                                    msg = 'Medium'; col = 'text-amber-500';
                                                }
                                            } else {
                                                msg = 'Weak - must be at least 8 characters';
                                            }
                                            return <div className={`text-[10px] font-bold mt-1.5 ${col}`}>{msg}</div>;
                                        })()}
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
        <button type="submit" disabled={vendorRegLoading}
            className="w-full bg-black hover:bg-zinc-800 text-white py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all disabled:opacity-50 mt-1">
            {vendorRegLoading ? 'Logging in...' : 'LOG IN ?'}
        </button>
        <p className="text-center text-[11px] text-zinc-400 mt-4">
            Don't have an account?{' '}
            <button type="button" onClick={() => { setModalMode('register'); setVendorRegError(''); }} className="text-black font-bold hover:underline">Sign up</button>
        </p>
    </form>
) : vendorRegStep === 'otp' ? (
                                <form onSubmit={handleVendorRegister} className="space-y-4">
                                    <div>
                                        {vendorSmsFailed && (
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium mb-2">
                                            ⚠️ SMS could not be delivered.{vendorRegData.email ? ' Use the button below to get the code on your email.' : ' Please go back and add your email address as a fallback.'}
                                        </div>
                                    )}
                                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Verification Code</label>
                                        <input
                                            type="text" maxLength="6" required
                                            placeholder="0 0 0 0 0 0"
                                            value={vendorRegOtp}
                                            onChange={(e) => setVendorRegOtp(e.target.value.replace(/\D/g, ''))}
                                            className="w-full text-center tracking-[0.75em] text-lg font-bold bg-white border border-zinc-200 rounded-lg py-2.5 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                        />
                                    </div>
                                    <button type="submit" disabled={vendorRegLoading || vendorRegOtp.length !== 6}
                                        className="w-full bg-black hover:bg-zinc-800 text-white py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all disabled:opacity-50">
                                        {vendorRegLoading ? 'Verifying...' : 'VERIFY OTP'}
                                    </button>
                                    {vendorRegData.email && (
                                        <button type="button" onClick={handleVendorResendEmail} disabled={vendorResendingEmail}
                                            className="w-full border border-zinc-300 hover:border-black text-zinc-700 hover:text-black py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all disabled:opacity-50">
                                            {vendorResendingEmail ? 'Sending...' : 'SEND OTP TO EMAIL INSTEAD'}
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setVendorRegStep('form')} className="w-full text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
                                        Use a different phone number
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVendorRegister} className="space-y-3">
                                    {/* Name */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">First name</label>
                                            <input type="text" required placeholder="First name"
                                                value={vendorRegData.name.split(' ')[0] || ''}
                                                onChange={(e) => setVendorRegData({ ...vendorRegData, name: e.target.value + (vendorRegData.name.split(' ').slice(1).join(' ') ? ' ' + vendorRegData.name.split(' ').slice(1).join(' ') : '') })}
                                                className={getVendorInputCls('name')}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">Last name</label>
                                            <input type="text" placeholder="Last name"
                                                value={vendorRegData.name.split(' ').slice(1).join(' ') || ''}
                                                onChange={(e) => setVendorRegData({ ...vendorRegData, name: (vendorRegData.name.split(' ')[0] || '') + ' ' + e.target.value })}
                                                className={getVendorInputCls('name')}
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">Email <span className="text-zinc-400 font-normal">(optional)</span></label>
                                        <input type="email" placeholder="name@company.com"
                                            value={vendorRegData.email}
                                            onChange={(e) => setVendorRegData({ ...vendorRegData, email: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-[13px] font-medium placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">Phone <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[11px] text-zinc-500 pointer-events-none">+91</span>
                                                <input type="text" required maxLength="10" placeholder="9876543210"
                                                    value={vendorRegData.phone}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setVendorRegData({ ...vendorRegData, phone: val, whatsapp_number: vendorRegData.same_as_phone ? val : vendorRegData.whatsapp_number });
                                                    }}
                                                    className="w-full pl-8 pr-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-[13px] font-medium placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">WhatsApp</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[11px] text-zinc-500 pointer-events-none">+91</span>
                                                <input type="text" maxLength="10" placeholder="Same as phone"
                                                    value={vendorRegData.same_as_phone ? vendorRegData.phone : vendorRegData.whatsapp_number}
                                                    disabled={vendorRegData.same_as_phone}
                                                    onChange={(e) => setVendorRegData({ ...vendorRegData, whatsapp_number: e.target.value.replace(/\D/g,'') })}
                                                    className="w-full pl-8 pr-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-[13px] font-medium placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all disabled:bg-zinc-50 disabled:text-zinc-400"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Same as phone toggle */}
                                    <div className="flex items-center gap-2.5">
                                        <button type="button"
                                            onClick={() => setVendorRegData({ ...vendorRegData, same_as_phone: !vendorRegData.same_as_phone })}
                                            className={`relative inline-flex h-4.5 w-8 flex-shrink-0 cursor-pointer rounded-full border border-zinc-300 transition-colors duration-200 ${vendorRegData.same_as_phone ? 'bg-black' : 'bg-zinc-200'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-3.5 w-3.5 mt-[1px] ml-[1px] transform rounded-full bg-white shadow transition duration-200 ${vendorRegData.same_as_phone ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                        </button>
                                        <span className="text-[11px] text-zinc-600 font-medium">WhatsApp is the same as phone</span>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                                        <div className="relative">
                <input type={showPassword ? "text" : "password"} required placeholder="••••••••"
                                            value={vendorRegData.password}
                                            onChange={(e) => setVendorRegData({ ...vendorRegData, password: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-[13px] font-medium placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
                                    </div>

                                    {/* T&C Checkbox */}
                                    <div className="flex items-start gap-2 pt-1 pb-1">
                                        <input type="checkbox" id="vendor-terms-check" required className="mt-0.5 w-3 h-3 rounded border-zinc-300 text-black focus:ring-black cursor-pointer" />
                                        <label htmlFor="vendor-terms-check" className="text-[10px] text-zinc-500 cursor-pointer leading-tight">
                                            I agree to the <Link to="/terms" target="_blank" className="text-black font-semibold hover:underline">Terms of Service</Link> and <Link to="/privacy" target="_blank" className="text-black font-semibold hover:underline">Privacy Policy</Link>.
                                        </label>
                                    </div>

                                    <button type="submit" disabled={vendorRegLoading}
                                        className="w-full bg-black hover:bg-zinc-800 text-white py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all disabled:opacity-50 mt-1">
                                        {vendorRegLoading ? 'Sending code...' : 'SEND VERIFICATION CODE →'}
                                    </button>

                                    <p className="text-center text-[11px] text-zinc-400">
                                        Already have an account?{' '}
                                        <button type="button" onClick={() => { setModalMode('login'); setVendorRegError(''); }} className="text-black font-bold hover:underline">Log in</button>
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* FULL PAGE THEME MODAL FOR TRAINING MODE SELECTION */}
            {isModeModalOpen && (
                <div className="fixed inset-0 z-[200] bg-black text-white flex flex-col justify-between p-6 sm:p-12 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                            Select Training Delivery Mode
                        </span>
                        <button 
                            type="button" 
                            onClick={() => setIsModeModalOpen(false)}
                            className="p-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X className="w-8 h-8" />
                        </button>
                    </div>

                    <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 my-auto py-8">
                        {[
                            { title: 'Onsite', desc: 'In-person classroom training at client venue or office location.' },
                            { title: 'Remote', desc: '100% online training sessions delivered via Zoom, Teams, or Webex.' },
                            { title: 'Hybrid', desc: 'Combination of online theory and physically co-located sessions.' }
                        ].map((m) => {
                            const val = m.title.toLowerCase();
                            const isSelected = parsedData?.mode?.toLowerCase() === val;
                            return (
                                <div 
                                    key={m.title}
                                    onClick={() => {
                                        setParsedData({...parsedData, mode: val});
                                        setIsModeModalOpen(false);
                                    }}
                                    className={`p-8 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-6 ${
                                        isSelected 
                                            ? 'border-white bg-white/10 shadow-sm scale-105' 
                                            : 'border-zinc-800 bg-zinc-900 hover:border-zinc-500'
                                    }`}
                                >
                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black">{m.title}</h3>
                                        <p className="text-sm font-semibold text-zinc-400 leading-relaxed">{m.desc}</p>
                                    </div>
                                    <button 
                                        type="button"
                                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 ${
                                            isSelected ? 'bg-white text-black border-white' : 'border-zinc-700 text-white'
                                        }`}
                                    >
                                        {isSelected ? 'Selected' : 'Choose Option'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="max-w-5xl mx-auto w-full text-center">
                        <button 
                            type="button"
                            onClick={() => setIsModeModalOpen(false)}
                            className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                        >
                            Close Selection Page
                        </button>
                    </div>
                </div>
            )}

            {/* Modal: Job Details */}
            {selectedJob && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="bg-white rounded-xl shadow-sm max-w-xl w-full p-6 relative max-h-[90vh] overflow-y-auto border border-zinc-200">
                        <button 
                            onClick={() => { setSelectedJob(null); setShowFulfillForm(false); setFulfillList([{ trainer_name: '', trainer_phone: '' }]); }}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 p-1"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                        
                        <div className="mb-6 pr-8">
                            <span className="inline-block px-2 py-0.5 bg-zinc-100 border border-black text-zinc-900 text-[10px] font-black uppercase rounded mb-3">
                                {selectedJob.status}
                            </span>
                            <h2 className="text-2xl font-black text-zinc-900 mb-2 leading-tight">
                                {selectedJob.subject}
                            </h2>
                            {user?.role === 'admin' && (
                                <p className="text-sm font-bold text-zinc-700 mb-1">
                                    Posted for: {selectedJob.vendor_id?.name || 'Unknown'} ({selectedJob.vendor_id?.phone || 'No phone'})
                                </p>
                            )}
                            <p className="text-xs text-zinc-500 font-medium">
                                Posted on {new Date(selectedJob.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                        </div>

                        {/* Highlighted Pinned Items */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Posted By</p>
                                <p className="text-xs font-black text-zinc-900 truncate">You (Vendor)</p>
                            </div>
                            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Budget / Salary</p>
                                <p className="text-xs font-black text-zinc-900 truncate">{selectedJob.pay_disclosed || 'Not disclosed'}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4 text-xs text-zinc-800 font-semibold">
                            <div>
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2">Job Parameters</h3>
                                <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                                    <div><span className="text-zinc-500 block mb-0.5 font-bold">Location</span> <span className="font-black text-zinc-900">{selectedJob.city || 'TBD'}</span></div>
                                    <div><span className="text-zinc-500 block mb-0.5 font-bold">Mode</span> <span className="font-black text-zinc-900 capitalize">{selectedJob.mode || 'TBD'}</span></div>
                                    <div><span className="text-zinc-500 block mb-0.5 font-bold">Duration</span> <span className="font-black text-zinc-900">{selectedJob.duration || 'TBD'}</span></div>
                                    <div><span className="text-zinc-500 block mb-0.5 font-bold">TFA</span> <span className="font-black text-zinc-900">{selectedJob.tfa || 'N/A'}</span></div>
                                    <div className="col-span-2"><span className="text-zinc-500 block mb-0.5 font-bold">Budget</span> <span className="font-black text-zinc-900">{selectedJob.pay_disclosed || 'N/A'}</span></div>
                                </div>
                            </div>

                            {(selectedJob.cleaned_text || selectedJob.raw_text) && (
                                <div>
                                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2">Requirement Description</h3>
                                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 font-semibold leading-relaxed">
                                        {(() => {
                                            const text = selectedJob.cleaned_text || selectedJob.raw_text;
                                            if (selectedJob.cleaned_text) {
                                                const lines = text.split('\n').filter(l => l.trim().length > 0);
                                                const isList = lines.some(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
                                                if (isList) {
                                                    return (
                                                        <ul className="list-disc pl-5 space-y-1.5 marker:text-zinc-400">
                                                            {lines.map((l, i) => {
                                                                let cleaned = l.replace(/^[-*]\s*/, '').trim();
                                                                const parts = cleaned.split(/(\*\*.*?\*\*)/g);
                                                                return (
                                                                    <li key={i}>
                                                                        {parts.map((part, j) => {
                                                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                                                return <strong key={j} className="text-zinc-900">{part.slice(2, -2)}</strong>;
                                                                            }
                                                                            return part;
                                                                        })}
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    );
                                                }
                                            }
                                            return <div className="whitespace-pre-wrap">{text}</div>;
                                        })()}
                                    </div>
                                </div>
                            )}

                            {selectedJob.status === 'fulfilled' && selectedJob.trainer_name && (
                                <div>
                                    <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mb-2">Fulfillment Record</h3>
                                    <div className="grid grid-cols-2 gap-3 bg-emerald-50 p-4 rounded-xl border-2 border-emerald-600 text-emerald-950">
                                        <div><span className="text-emerald-800 text-[10px] block font-bold">Trainer Name</span> <span className="font-black">{selectedJob.trainer_name}</span></div>
                                        <div><span className="text-emerald-800 text-[10px] block font-bold">Phone</span> <span className="font-black">{formatPhoneWithSpace(selectedJob.trainer_phone)}</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                            {selectedJob.status === 'open' && canFulfillJob(selectedJob) && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedJob(null); handleFulfillClick(selectedJob._id, e); }}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all mr-3"
                                >
                                    Mark as Fulfilled
                                </button>
                            )}

                            <button 
                                onClick={() => { setSelectedJob(null); setShowFulfillForm(false); setFulfillList([{ trainer_name: '', trainer_phone: '' }]); }}
                                className="px-4 py-2 bg-black text-white rounded-xl text-xs font-black border border-zinc-200 hover:bg-zinc-800 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Mark as Fulfilled */}
            {fulfillingJobId && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="bg-white rounded-xl shadow-sm max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto border border-zinc-200">
                        <h2 className="text-lg font-black text-zinc-900 mb-1">Mark Requirement as Fulfilled</h2>
                        <p className="text-xs font-semibold text-zinc-600 mb-5">
                            Record the details of the trainers who fulfilled this training engagement (up to 10).
                        </p>
                        
                        <div className="space-y-4">
                            {fulfillList.map((trainer, idx) => (
                                <div key={idx} className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl relative">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Trainer {idx + 1}</h3>
                                        {fulfillList.length > 1 && (
                                            <button 
                                                onClick={() => {
                                                    const newList = [...fulfillList];
                                                    newList.splice(idx, 1);
                                                    setFulfillList(newList);
                                                }}
                                                className="text-red-500 hover:text-red-700 text-xs font-bold"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-900 mb-1">Name <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:outline-none"
                                                placeholder="E.g., Rajesh Kumar"
                                                value={trainer.trainer_name}
                                                onChange={(e) => {
                                                    const newList = [...fulfillList];
                                                    newList[idx].trainer_name = e.target.value;
                                                    setFulfillList(newList);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-900 mb-1">Phone <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:outline-none"
                                                placeholder="E.g., 9876543210"
                                                value={trainer.trainer_phone}
                                                onChange={(e) => {
                                                    const newList = [...fulfillList];
                                                    newList[idx].trainer_phone = e.target.value;
                                                    setFulfillList(newList);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {fulfillList.length < 10 && (
                            <button 
                                onClick={() => setFulfillList([...fulfillList, { trainer_name: '', trainer_phone: '' }])}
                                className="mt-4 w-full py-2.5 border-2 border-dashed border-zinc-200 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 transition-all flex justify-center items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                Add Another Trainer
                            </button>
                        )}

                        <div className="mt-6 flex justify-end gap-2.5">
                            <button 
                                onClick={() => setFulfillingJobId(null)}
                                className="px-4 py-2 bg-zinc-100 border border-zinc-200 text-zinc-900 rounded-xl text-xs font-black hover:bg-zinc-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={submitFulfill}
                                disabled={fulfillList.some(t => !t.trainer_name || !t.trainer_phone)}
                                className="px-5 py-2 bg-black border border-zinc-200 text-white rounded-xl text-xs font-black hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                Confirm & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

















