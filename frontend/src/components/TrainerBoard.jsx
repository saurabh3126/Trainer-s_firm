import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Calendar, Clock, IndianRupee, Loader2, X, Share2, ArrowLeft, Search, Filter, Code, ChevronDown, MessageCircle, User, Phone, Briefcase, Link as LinkIcon, SlidersHorizontal , BadgeCheck} from 'lucide-react';
import Loader from './Loader.jsx';

const INDIAN_CITIES = [
    "Agra", "Ahmedabad", "Ajmer", "Aligarh", "Allahabad", "Amravati", "Amritsar", "Asansol", "Aurangabad", 
    "Bangalore", "Bareilly", "Belgaum", "Bhavnagar", "Bhilai", "Bhiwandi", "Bhopal", "Bhubaneswar", "Bikaner", "Chandigarh", 
    "Chennai", "Coimbatore", "Cuttack", "Dehradun", "Delhi", "Dhanbad", "Durgapur", "Erode", "Faridabad", "Firozabad", 
    "Ghaziabad", "Gorakhpur", "Gulbarga", "Guntur", "Gurugram", "Guwahati", "Gwalior", "Hubballi-Dharwad", "Hyderabad", 
    "Indore", "Jabalpur", "Jaipur", "Jaisalmer", "Jalandhar", "Jalgaon", "Jammu", "Jamnagar", "Jamshedpur", "Jhansi", "Jodhpur", 
    "Kakinada", "Kalyan-Dombivli", "Kanpur", "Kochi", "Kolhapur", "Kolkata", "Kota", "Kozhikode", "Kurnool", "Lucknow", 
    "Ludhiana", "Madurai", "Malegaon", "Mangalore", "Meerut", "Mira-Bhayandar", "Moradabad", "Mumbai", "Mysuru", "Nagpur", 
    "Nanded", "Nashik", "Nellore", "Noida", "Patna", "Pimpri-Chinchwad", "Pune", "Raipur", "Rajamahendravaram", "Rajkot", 
    "Ranchi", "Rourkela", "Saharanpur", "Salem", "Sangli", "Siliguri", "Solapur", "Srinagar", "Surat", 
    "Thane", "Thiruvananthapuram", "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Udaipur", "Ujjain", "Ulhasnagar", 
    "Vadodara", "Varanasi", "Vasai-Virar", "Vellore", "Vijayawada", "Visakhapatnam", "Warangal",
    // Smaller/Tier-2 cities
    "Alwar", "Ambala", "Anand", "Bhilwara", "Bharatpur", "Bhopal", "Bilaspur", "Chittorgarh", "Davangere",
    "Gandhinagar", "Hapur", "Haridwar", "Hassan", "Hisar", "Hubli", "Imphal", "Itanagar", "Jind", "Junagadh",
    "Kalyani", "Karnal", "Katni", "Kharagpur", "Kolhapur", "Loni", "Lucknnow", "Mandya", "Mathura", "Muzaffarnagar",
    "Mysore", "Nellore", "New Delhi", "Panipat", "Parbhani", "Pathankot", "Patiala", "Pondicherry", "Puducherry",
    "Ratlam", "Rohtak", "Rourkela", "Sagar", "Satna", "Shahjahanpur", "Shimla", "Shivamogga", "Sikar",
    "Solapur", "Sonipat", "Thanjavur", "Thrissur", "Tumkur", "Unnao", "Yamunanagar"
];

export default function TrainerBoard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Do not show trainer feed to vendors
    useEffect(() => {
        if (user && user.role === 'vendor') {
            navigate('/vendor', { replace: true });
        }
    }, [user, navigate]);

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    // Modal & Form State
    const [selectedJob, setSelectedJob] = useState(null);
    const [viewJobDetails, setViewJobDetails] = useState(null);
    const [contactForm, setContactForm] = useState({ name: '', phone: '', experience: '', resume_link: '', resume_file: null });
    const [contactLoading, setContactLoading] = useState(false);
    const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

    // Lock background scroll when modal is open
    useEffect(() => {
        if (selectedJob || viewJobDetails) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedJob, viewJobDetails]);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState('All');
    const [filterCity, setFilterCity] = useState('All');
    const [filterTech, setFilterTech] = useState('All');
    const [techInput, setTechInput] = useState('');
    const [techSuggestions, setTechSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [showTechDropdown, setShowTechDropdown] = useState(false);
    const [cityInput, setCityInput] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [showModeDropdown, setShowModeDropdown] = useState(false);
    const [salarySlider, setSalarySlider] = useState(0);
    const [showFilters, setShowFilters] = useState(false); 
    const techDropdownRef = useRef(null);
    const cityDropdownRef = useRef(null);
    const modeDropdownRef = useRef(null);

    const { jobId } = useParams(); 

    useEffect(() => {
        fetchJobs();
    }, [jobId]); 

    // Auto-fill form if the user is a logged-in trainer
    useEffect(() => {
        if (user && user.role === 'trainer') {
            setContactForm({
                name: user.name || '',
                phone: user.phone || '',
                experience: user.experience_years || '',
                resume_link: user.resume_link || '',
                resume_file: null
            });
        }
    }, [user, selectedJob]);

    // Fetch AI Tech Suggestions
    const fetchTechSuggestions = async (query = '') => {
        setLoadingSuggestions(true);
        try {
            const res = await axios.get(`/api/jobs/ai-suggestions?q=${encodeURIComponent(query)}`);
            if (res.data?.suggestions) {
                setTechSuggestions(res.data.suggestions);
            }
        } catch (err) {
            console.error("Failed to fetch AI suggestions:", err);
        }
        setLoadingSuggestions(false);
    };

    // Debounced suggestion fetcher when techInput changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTechSuggestions(techInput);
        }, 200);
        return () => clearTimeout(timer);
    }, [techInput]);

    const [apiCitySuggestions, setApiCitySuggestions] = useState([]);

    // Fetch backend (Gemini-enriched) city suggestions - non-blocking, merges with local list
    useEffect(() => {
        if (!cityInput) { setApiCitySuggestions([]); return; }
        const timer = setTimeout(async () => {
            try {
                const res = await axios.get(`/api/jobs/city-suggestions?q=${encodeURIComponent(cityInput)}`);
                if (res.data?.suggestions) setApiCitySuggestions(res.data.suggestions);
            } catch (_) {}
        }, 400);
        return () => clearTimeout(timer);
    }, [cityInput]);

    // Merge local instant results with API results, deduped
    const activeCitySuggestions = Array.from(new Set([
        ...INDIAN_CITIES.filter(c => c.toLowerCase().includes(cityInput.toLowerCase())),
        ...apiCitySuggestions
    ])).slice(0, 30);

    // Close tech & city dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (techDropdownRef.current && !techDropdownRef.current.contains(e.target)) {
                setShowTechDropdown(false);
            }
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
                setShowCityDropdown(false);
            }
            if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target)) {
                setShowModeDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            if (jobId) {
                const res = await axios.get(`/api/jobs/${jobId}`);
                setJobs([res.data.job]); 
            } else {
                const res = await axios.get('/api/jobs');
                setJobs(res.data.jobs);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
            setJobs([]); 
        }
        setLoading(false);
    };

    const handleShare = async (id, subject) => {
        const url = `${window.location.origin}/job/${id}`;
        const title = subject || 'Trainer Requirement';
        
        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        if (isMobile && navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: `Check out this requirement on Trainer Firm: ${title}`,
                    url: url,
                });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }
        
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500); 
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'experience') {
            let val = parseInt(value, 10);
            if (isNaN(val)) val = '';
            else if (val < 0) val = 0;
            else if (val > 30) val = 30;
            setContactForm({ ...contactForm, [name]: val });
        } else {
            setContactForm({ ...contactForm, [name]: value });
        }
    };

    const closeContactModal = () => { 
        setSelectedJob(null); 
        setAlertMsg({ text: '', type: '' });
        if (!user) {
            setContactForm({ name: '', phone: '', experience: '', resume_link: '', resume_file: null }); 
        }
    };

    const handleWhatsApp = async () => {
        if (!contactForm.name || contactForm.phone.length !== 10) {
            return setAlertMsg({ text: 'Name and a valid 10-digit phone number are required.', type: 'error' });
        }
        
        setContactLoading(true);
        setAlertMsg({ text: 'Preparing application...', type: 'success' });
        
        try {
            let final_resume_url = contactForm.resume_link;
            let final_resume_public_id = null;

            if (contactForm.resume_file) {
                setAlertMsg({ text: 'Uploading resume securely...', type: 'success' });
                const formData = new FormData();
                formData.append('resume', contactForm.resume_file);
                
                const uploadRes = await axios.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                final_resume_url = uploadRes.data.url;
                final_resume_public_id = uploadRes.data.public_id;
            }

            const payload = { 
                job_post_id: selectedJob._id, 
                trainer_name: contactForm.name, 
                trainer_contact: contactForm.phone, 
                experience: contactForm.experience, 
                resume_link: final_resume_url,
                resume_public_id: final_resume_public_id,
                is_guest: !user
            };
            
            const headers = user ? { Authorization: `Bearer ${localStorage.getItem('venty_token')}` } : {};
            const res = await axios.post('/api/jobs/contact', payload, { headers });
            
            if (res.data.success) {
                const cleanVendorPhone = res.data.vendor_contact_value.replace(/\D/g, '').slice(-10);
                const encodedMsg = encodeURIComponent(res.data.pre_filled_message);
                const waUrl = `https://wa.me/91${cleanVendorPhone}?text=${encodedMsg}`;
                const newWin = window.open(waUrl, '_blank');
                if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
                    window.location.href = waUrl;
                }
                closeContactModal();
            }
        } catch (error) {
            console.error(error);
            setAlertMsg({ text: 'Failed to process application.', type: 'error' });
        }
        setContactLoading(false);
    };

    const parseSalaryNumber = (val) => {
        if (!val) return 0;
        const clean = val.toString().replace(/(\d+(?:\.\d+)?)\s*[kK]\b/gi, (_, n) => `${Math.round(parseFloat(n) * 1000)}`);
        const match = clean.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    };

    const maxJobSalary = Math.max(100000, ...jobs.map(j => parseSalaryNumber(j.pay_disclosed)));

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = (job.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                              (job.cleaned_text?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesMode = filterMode === 'All' || (job.mode?.toLowerCase() || '') === filterMode.toLowerCase();
        const matchesCity = filterCity === 'All' || (job.city?.toLowerCase() || '') === filterCity.toLowerCase();
        const matchesTech = filterTech === 'All' || (job.subject?.toLowerCase() || '').includes(filterTech.toLowerCase());
        
        const jobSalary = parseSalaryNumber(job.pay_disclosed);
        const matchesSalary = salarySlider === 0 || jobSalary >= salarySlider;
        
        return matchesSearch && matchesMode && matchesCity && matchesTech && matchesSalary;
    });

    const hasActiveFilters = filterMode !== 'All' || filterCity !== 'All' || filterTech !== 'All' || salarySlider > 0;

    if (user && user.role === 'vendor') return null;

    if (loading) return <div className="flex justify-center mt-32"><Loader /></div>;

    const getStatusBadge = (job) => {
        const created = new Date(job.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        if (diffDays <= 2) return { label: 'NEW', cls: 'bg-black text-white' };
        if (diffDays <= 5) return { label: 'OPEN', cls: 'bg-zinc-700 text-white' };
        return { label: 'URGENT', cls: 'bg-black text-white' };
    };

    return (
        <div className="flex-1 flex flex-col pt-4 sm:pt-8">
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 xl:px-8 relative flex-1">

            {/* Header */}
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 sm:gap-3.5">
                    {/* Emblem Logo */}
                    <img src="/logo-mark.png" alt="Trainer Firm" className="hidden sm:block sm:w-11 sm:h-11 object-contain flex-shrink-0" />
                    
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-zinc-900 tracking-wider uppercase">
                                TRAINER FIRM
                            </span>
                            <span className="text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase">
                                • Trainer Board
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black tracking-tighter mt-0.5 drop-shadow-sm">
                            {jobId ? 'Shared requirement.' : 'Find your next engagement.'}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!jobId && jobs.length > 0 && (
                        <span className="text-xs text-zinc-400 font-medium">{filteredJobs.length} active requirements</span>
                    )}
                    {jobId && (
                        <Link to="/trainers" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-950 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors border border-zinc-300 hover:bg-zinc-50 bg-white">
                            <ArrowLeft className="w-3.5 h-3.5" /> All Jobs
                        </Link>
                    )}
                </div>
            </div>

            {/* Search bar */}
            {!jobId && jobs.length > 0 && (
                <div className="mb-5 relative z-40">
                    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-visible">

                        {/* Mobile: search + filter toggle row */}
                        <div className="flex items-center gap-2 p-3 sm:hidden">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Search requirements..."
                                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold border transition-all flex-shrink-0 ${hasActiveFilters ? 'bg-black text-white border-black' : 'bg-white border-zinc-200 text-zinc-700'}`}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Filters{hasActiveFilters ? ` (${[filterMode !== 'All', filterCity !== 'All', filterTech !== 'All', salarySlider > 0].filter(Boolean).length})` : ''}
                            </button>
                        </div>

                        {/* Mobile: collapsible filter panel */}
                        {showFilters && (
                            <div className="sm:hidden px-3 pb-3 border-t border-zinc-100 pt-3 space-y-3">
                                {/* Technology */}
                                <div ref={techDropdownRef} className="relative">
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Technology</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="e.g. AWS, Terraform"
                                            value={techInput}
                                            onFocus={() => { setShowTechDropdown(true); if (techSuggestions.length === 0) fetchTechSuggestions(techInput); }}
                                            onChange={(e) => { setTechInput(e.target.value); setShowTechDropdown(true); }}
                                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium placeholder:text-zinc-400 focus:outline-none focus:border-black transition-all pr-8"
                                        />
                                        {techInput && <button onClick={() => { setTechInput(''); setFilterTech('All'); }} className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"><X className="w-3.5 h-3.5" /></button>}
                                    </div>
                                    {showTechDropdown && (
                                        <div className="absolute left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 p-2 max-h-48 overflow-y-auto">
                                            {loadingSuggestions && <div className="flex justify-center py-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" /></div>}
                                            <button onClick={() => { setFilterTech('All'); setTechInput(''); setShowTechDropdown(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors mb-1 ${filterTech === 'All' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-600 hover:bg-zinc-50'}`}>All Technologies</button>
                                            {techSuggestions.map((s, i) => (
                                                <button key={i} onClick={() => { setFilterTech(s); setTechInput(s); setShowTechDropdown(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterTech.toLowerCase() === s.toLowerCase() ? 'bg-black text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}>{s}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Location + Mode row */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div ref={cityDropdownRef} className="relative">
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Location</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="City..."
                                                value={cityInput}
                                                onFocus={() => setShowCityDropdown(true)}
                                                onChange={(e) => { setCityInput(e.target.value); setShowCityDropdown(true); }}
                                                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium placeholder:text-zinc-400 focus:outline-none focus:border-black transition-all pr-7"
                                            />
                                            {cityInput && <button onClick={() => { setCityInput(''); setFilterCity('All'); }} className="absolute right-2 top-2.5 text-zinc-400 hover:text-zinc-600"><X className="w-3.5 h-3.5" /></button>}
                                        </div>
                                        {showCityDropdown && (
                                            <div className="absolute left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 p-2 max-h-48 overflow-y-auto">
                                                <button onClick={() => { setFilterCity('All'); setCityInput(''); setShowCityDropdown(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors mb-1 ${filterCity === 'All' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-600 hover:bg-zinc-50'}`}>All Cities</button>
                                                {activeCitySuggestions.map((s, i) => (
                                                    <button key={i} onClick={() => { setFilterCity(s); setCityInput(s); setShowCityDropdown(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCity.toLowerCase() === s.toLowerCase() ? 'bg-black text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}>{s}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div ref={modeDropdownRef}>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Mode</label>
                                        <div className="relative">
                                            <button onClick={() => setShowModeDropdown(!showModeDropdown)} className="w-full flex items-center justify-between px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 focus:outline-none focus:border-black transition-all">
                                                <span className={filterMode === 'All' ? 'text-zinc-400' : 'text-zinc-900 font-bold capitalize'}>{filterMode === 'All' ? 'All' : filterMode}</span>
                                                <ChevronDown className="w-4 h-4 text-zinc-400" />
                                            </button>
                                            {showModeDropdown && (
                                                <div className="absolute left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 p-2">
                                                    {['All', 'online', 'offline', 'hybrid'].map((mode) => (
                                                        <button key={mode} onClick={() => { setFilterMode(mode); setShowModeDropdown(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors mb-1 ${filterMode === mode ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}>
                                                            {mode === 'All' ? 'All modes' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Salary slider */}
                                <div className="pt-2 border-t border-zinc-100">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Min Budget</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-zinc-800">{salarySlider > 0 ? `≥ ₹${salarySlider.toLocaleString()}` : 'Any Budget'}</span>
                                            {salarySlider > 0 && <button onClick={() => setSalarySlider(0)} className="text-[10px] text-zinc-400 hover:text-zinc-700">Reset</button>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-zinc-400">₹0</span>
                                        <input type="range" min="0" max={maxJobSalary} step="1000" value={salarySlider} onChange={(e) => setSalarySlider(Number(e.target.value))} className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-black" />
                                        <span className="text-[10px] text-zinc-400">₹{maxJobSalary.toLocaleString()}</span>
                                    </div>
                                </div>

                                {hasActiveFilters && (
                                    <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                                        <span className="text-xs text-zinc-500">Showing <strong className="text-zinc-800">{filteredJobs.length}</strong> result{filteredJobs.length !== 1 ? 's' : ''}</span>
                                        <button onClick={() => { setFilterMode('All'); setFilterCity('All'); setCityInput(''); setFilterTech('All'); setTechInput(''); setSalarySlider(0); setSearchTerm(''); }} className="text-xs text-zinc-400 hover:text-black font-semibold flex items-center gap-1 transition-colors">
                                            <X className="w-3.5 h-3.5" /> Clear all
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Desktop: full filter grid (unchanged) */}
                        <div className="hidden sm:block p-4 overflow-visible">
                            <div className="grid grid-cols-4 gap-3 overflow-visible">
                                {/* Keywords */}
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Keywords</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. AWS trainer"
                                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                {/* Technology */}
                                <div ref={techDropdownRef} className="relative">
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Technology</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="e.g. AWS, Terraform"
                                            value={techInput}
                                            onFocus={() => { setShowTechDropdown(true); if (techSuggestions.length === 0) fetchTechSuggestions(techInput); }}
                                            onChange={(e) => { setTechInput(e.target.value); setShowTechDropdown(true); }}
                                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all pr-8"
                                        />
                                        {techInput && <button onClick={() => { setTechInput(''); setFilterTech('All'); }} className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"><X className="w-3.5 h-3.5" /></button>}
                                    </div>
                                    {showTechDropdown && (
                                        <div className="absolute left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 p-2 max-h-56 overflow-y-auto">
                                            {loadingSuggestions && <div className="flex justify-center py-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" /></div>}
                                            <button onClick={() => { setFilterTech('All'); setTechInput(''); setShowTechDropdown(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors mb-1 ${filterTech === 'All' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-600 hover:bg-zinc-50'}`}>All Technologies</button>
                                            {techSuggestions.map((s, i) => (
                                                <button key={i} onClick={() => { setFilterTech(s); setTechInput(s); setShowTechDropdown(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterTech.toLowerCase() === s.toLowerCase() ? 'bg-black text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}>{s}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Location */}
                                <div ref={cityDropdownRef} className="relative">
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Location</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="e.g. Bengaluru"
                                            value={cityInput}
                                            onFocus={() => setShowCityDropdown(true)}
                                            onChange={(e) => { setCityInput(e.target.value); setShowCityDropdown(true); }}
                                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all pr-8"
                                        />
                                        {cityInput && <button onClick={() => { setCityInput(''); setFilterCity('All'); }} className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"><X className="w-3.5 h-3.5" /></button>}
                                    </div>
                                    {showCityDropdown && (
                                        <div className="absolute left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 p-2 max-h-56 overflow-y-auto">
                                            <button onClick={() => { setFilterCity('All'); setCityInput(''); setShowCityDropdown(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors mb-1 ${filterCity === 'All' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-600 hover:bg-zinc-50'}`}>All Cities</button>
                                            {activeCitySuggestions.map((s, i) => (
                                                <button key={i} onClick={() => { setFilterCity(s); setCityInput(s); setShowCityDropdown(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCity.toLowerCase() === s.toLowerCase() ? 'bg-black text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}>{s}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Work mode */}
                                <div ref={modeDropdownRef}>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Work mode</label>
                                    <div className="relative">
                                        <button onClick={() => setShowModeDropdown(!showModeDropdown)} className="w-full flex items-center justify-between px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all">
                                            <span className={filterMode === 'All' ? 'text-zinc-700' : 'text-zinc-900 font-bold capitalize'}>{filterMode === 'All' ? 'All modes' : filterMode}</span>
                                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                                        </button>
                                        {showModeDropdown && (
                                            <div className="absolute left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 p-2 max-h-56 overflow-y-auto">
                                                {['All', 'online', 'offline', 'hybrid'].map((mode) => (
                                                    <button key={mode} onClick={() => { setFilterMode(mode); setShowModeDropdown(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors mb-1 ${filterMode === mode ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}>
                                                        {mode === 'All' ? 'All modes' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Salary slider */}
                            <div className="mt-3 pt-3 border-t border-zinc-100">
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                                        <IndianRupee className="w-3 h-3" /> Min Budget
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-zinc-800">{salarySlider > 0 ? `≥ ₹${salarySlider.toLocaleString()}` : 'Any Budget'}</span>
                                        {salarySlider > 0 && <button onClick={() => setSalarySlider(0)} className="text-[10px] text-zinc-400 hover:text-zinc-700">Reset</button>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-zinc-400">₹0</span>
                                    <input type="range" min="0" max={maxJobSalary} step="1000" value={salarySlider} onChange={(e) => setSalarySlider(Number(e.target.value))} className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-black" />
                                    <span className="text-[10px] text-zinc-400">₹{maxJobSalary.toLocaleString()}</span>
                                </div>
                            </div>

                            {hasActiveFilters && (
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-100">
                                    <span className="text-xs text-zinc-500">Showing <strong className="text-zinc-800">{filteredJobs.length}</strong> result{filteredJobs.length !== 1 ? 's' : ''}</span>
                                    <button onClick={() => { setFilterMode('All'); setFilterCity('All'); setCityInput(''); setFilterTech('All'); setTechInput(''); setSalarySlider(0); setSearchTerm(''); }} className="text-xs text-zinc-400 hover:text-black font-semibold flex items-center gap-1 transition-colors">
                                        <X className="w-3.5 h-3.5" /> Clear all
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Jobs area - main + sidebar */}

            {/* Mobile-only: compact sidebar cards strip */}
            {!jobId && (
                <div className="lg:hidden flex gap-2 mb-4">
                    {/* CTA / Profile card */}
                    <div className="flex-1 bg-zinc-900 text-white rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                        {user ? (
                            <>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase leading-none mb-0.5">Your Profile</p>
                                    <p className="text-[11px] text-zinc-300 truncate">{filterTech !== 'All' ? filterTech : 'All techs'}</p>
                                </div>
                                <Link to="/profile" className="flex-shrink-0 px-2.5 py-1 bg-white text-black rounded-lg text-[10px] font-black tracking-wide">EDIT</Link>
                            </>
                        ) : (
                            <>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase leading-none mb-0.5">New to Trainer Firm?</p>
                                    <p className="text-[11px] text-zinc-300">Create a profile to apply faster.</p>
                                </div>
                                <Link to="/auth?mode=signup" className="flex-shrink-0 px-2.5 py-1 bg-white text-black rounded-lg text-[10px] font-black tracking-wide whitespace-nowrap">SIGN UP</Link>
                            </>
                        )}
                    </div>
                    {/* Digest card */}
                    <div className="flex-shrink-0 bg-white border border-zinc-200 rounded-xl px-3 py-2.5 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-zinc-900 leading-none">{filteredJobs.length} roles</p>
                        <p className="text-[9px] text-zinc-400 mt-0.5">available today</p>
                    </div>
                </div>
            )}

            {filteredJobs.length === 0 ? (
                <div className="text-center p-16 bg-white rounded-xl border border-zinc-200">
                    <p className="text-sm text-zinc-500 font-medium">
                        {jobId ? 'This job is no longer available.' : 'No requirements match your current filters.'}
                    </p>
                    {(!jobId && jobs.length > 0) && (
                        <button onClick={() => { setSearchTerm(''); setFilterMode('All'); setFilterCity('All'); setFilterTech('All'); setSalarySlider(0); }} className="mt-4 text-xs font-bold text-black hover:underline">
                            Reset all filters
                        </button>
                    )}
                    {jobId && <Link to="/trainers" className="mt-4 inline-block text-xs font-bold text-black hover:underline">View all requirements →</Link>}
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6 xl:gap-12 pb-16">
                    {/* Left: Job listings */}
                    <div className="flex-1 space-y-4 min-w-0 lg:pr-8 xl:pr-16">
                        {filteredJobs.map((job) => {
                            const badge = getStatusBadge(job);
                            // Extract tech tags from subject
                            const techTags = (job.subject || '').split(/[\s,\/]+/).filter(w => w.length > 2 && /^[A-Z]/.test(w.toUpperCase()) && !/^(and|the|for|with|in|of|to|a|an|at)$/i.test(w)).slice(0, 4).map(w => w.toUpperCase().replace(/[^A-Z0-9#.+]/g, ''));
                            const aiHighlights = job.highlights || [];

                            return (
                                <div
                                    key={job._id}
                                    className="group relative rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 z-0 hover:z-10"
                                >
                                    {/* Base White Background */}
                                    <div className="absolute inset-0 bg-white rounded-xl -z-10 pointer-events-none" />

                                    {/* Default Static Border */}
                                    <div className="absolute inset-0 border border-zinc-200 rounded-xl group-hover:opacity-0 transition-opacity duration-300 -z-10 pointer-events-none" />

                                    {/* Revolving Border Layer */}
                                    <div className="absolute inset-[-1px] rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-20">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] aspect-square bg-[conic-gradient(from_0deg,transparent_0_75%,#000_100%)] animate-[spin_2.5s_linear_infinite]" />
                                    </div>

                                    {/* Content Container */}
                                    <div className="relative p-5 z-10">
                                        {/* Row 1: badge + vendor + pay */}
                                        <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded ${badge.cls} uppercase`}>
                                                {badge.label}
                                            </span>
                                            <span className="text-xs text-zinc-500 font-medium">
                                                {job.vendor_id?.name || 'Vendor'}{job.posted_by_user?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 inline ml-1" />}
                                            </span>
                                        </div>
                                        {job.pay_disclosed && (
                                            <span className="text-sm font-bold text-zinc-900 flex-shrink-0 ml-3">
                                                {/^[₹$€£]/.test(job.pay_disclosed.trim()) ? job.pay_disclosed : `₹${job.pay_disclosed}`}
                                            </span>
                                        )}
                                    </div>

                                    {/* Row 2: Title */}
                                    <h2 
                                        className="text-base font-bold text-zinc-900 tracking-tight leading-snug mb-3 truncate"
                                        title={job.subject}
                                    >
                                        {job.subject}
                                    </h2>

                                    {/* Row 3: Requested extracted fields */}
                                    <div className="flex items-center gap-3 mb-1.5 text-[13px] text-zinc-600 flex-wrap font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Briefcase className="w-4 h-4 text-zinc-700" />
                                            <span>{job.experience_level === 'Flexible' ? 'TBD' : (job.experience_level || 'TBD')}</span>
                                        </div>
                                        <span className="text-zinc-300">|</span>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-zinc-700" />
                                            <span>{job.employment_type === 'Flexible' ? 'TBD' : (job.employment_type || (job.duration === 'Flexible' ? 'TBD' : job.duration) || 'TBD')}</span>
                                        </div>
                                        <span className="text-zinc-300">|</span>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-zinc-700" />
                                            <span className="capitalize">{job.mode === 'remote' ? 'Work from Home' : (job.city === 'Flexible' ? 'TBD' : (job.city || (job.mode === 'Flexible' ? 'TBD' : job.mode) || 'TBD'))}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Row 4: Skills and Highlights */}
                                    <div className="mb-4 text-[13.5px] text-[#1a73e8] font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
                                        {(job.skills && job.skills.length > 0 ? job.skills : techTags).map((skill, i, arr) => (
                                            <span key={i} className="flex items-center gap-2">
                                                <span>{skill}</span>
                                                {i < arr.length - 1 && <span className="text-zinc-300">•</span>}
                                            </span>
                                        ))}
                                        
                                        {/* Original AI Highlights (if any) as small pills next to skills */}
                                        {aiHighlights.length > 0 && (
                                            <div className="flex gap-1.5 ml-2 border-l border-zinc-200 pl-3">
                                                {aiHighlights.map((hl, i) => (
                                                    <span key={`hl-${i}`} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded tracking-wider uppercase">
                                                        {hl}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* CTAs */}
                                    <div className="flex items-center justify-end gap-3 mt-4">
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleShare(job._id, job.subject)}
                                                    className="p-1.5 border border-zinc-200 rounded-lg text-zinc-400 hover:border-zinc-400 hover:text-zinc-900 transition-all relative"
                                                    title="Copy link"
                                                >
                                                    <Share2 className="w-3.5 h-3.5" />
                                                    {copiedId === job._id && (
                                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-10">Copied!</span>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => { if (job.status !== 'fulfilled') setViewJobDetails(job); }}
                                                    className="px-3 py-1.5 border border-zinc-200 rounded-lg text-[11px] font-bold text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-all"
                                                >
                                                    VIEW DETAILS
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedJob(job); setAlertMsg({ text: '', type: '' }); }}
                                                className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-[11px] font-bold transition-all tracking-wide"
                                            >
                                                WHATSAPP APPLY
                                            </button>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right: Sidebar — desktop only */}
                    {!jobId && (
                        <div className="hidden lg:block w-72 flex-shrink-0 space-y-4">
                            {/* Profile card / Guest CTA */}
                            {user ? (
                                <div className="bg-zinc-900 text-white rounded-2xl p-5 shadow-lg">
                                    <p className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase mb-2">Your search profile</p>
                                    <div className="mb-4">
                                        {user.skills && user.skills.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5 mb-2.5">
                                                {user.skills.slice(0, 8).map((skill, idx) => (
                                                    <span key={idx} className="bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-zinc-700/50">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {user.skills.length > 8 && <span className="text-[10px] text-zinc-500 font-bold px-1 py-0.5">+{user.skills.length - 8}</span>}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-zinc-500 italic mb-2.5">No skills added yet.</p>
                                        )}
                                        <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-2 flex-wrap">
                                            {user.experience_years && <span>{user.experience_years} Years Exp</span>}
                                            {user.experience_years && user.location && <span className="text-zinc-600">•</span>}
                                            {user.location && <span>{user.location}</span>}
                                        </div>
                                    </div>
                                    <Link to="/profile" className="block w-full py-2 px-4 bg-white text-black rounded-xl text-xs font-bold text-center tracking-wider hover:bg-zinc-100 transition-all">
                                        EDIT PROFILE
                                    </Link>
                                </div>
                            ) : (
                                <div className="bg-zinc-900 text-white rounded-2xl p-5 shadow-lg">
                                    <p className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase mb-2">New to Trainer Firm?</p>
                                    <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                                        Create a trainer profile to apply faster and get matched with relevant vendor requirements.
                                    </p>
                                    <Link to="/auth?mode=signup" className="block w-full py-2 px-4 bg-white text-black rounded-xl text-xs font-bold text-center tracking-wider hover:bg-zinc-100 transition-all">
                                        SIGN UP NOW
                                    </Link>
                                </div>
                            )}

                            {/* Digest card */}
                            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                                <p className="text-sm font-bold text-zinc-900 mb-1">Daily opportunity digest</p>
                                <p className="text-xs text-zinc-500">
                                    {user ? `${filteredJobs.length} new roles match your profile.` : `${filteredJobs.length} new roles available today.`}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}



            {/* Application Modal */}
            {selectedJob && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl border border-zinc-200">
                        <button
                            onClick={closeContactModal}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="p-6 sm:p-8">
                            <div className="mb-6">
                                <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-1">Apply for role</span>
                                <h3 className="text-xl font-bold text-zinc-900 tracking-tight mt-0.5 pr-8 leading-snug">
                                    {selectedJob.subject || 'Open Requirement'}
                                </h3>
                                <p className="text-xs text-zinc-500 mt-1.5">
                                    Your details will be sent directly via WhatsApp.
                                </p>
                            </div>

                            {alertMsg.text && (
                                <div className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-medium mb-5 border ${
                                    alertMsg.type === 'error'
                                        ? 'bg-red-50 border-red-100 text-red-700'
                                        : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                }`}>
                                    {alertMsg.text}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Your Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                        <input
                                            type="text" name="name"
                                            value={contactForm.name} onChange={handleFormChange}
                                            disabled={user?.role === 'trainer'} placeholder="E.g., Rajesh Kumar"
                                            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all disabled:bg-zinc-50 disabled:text-zinc-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">WhatsApp Number</label>
                                    <div className="relative flex items-center">
                                        <Phone className="absolute left-3 w-4 h-4 text-zinc-400" />
                                        <span className="absolute left-8 text-sm font-medium text-zinc-900 select-none">+91 </span>
                                        <input
                                            type="text" name="phone"
                                            value={contactForm.phone}
                                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value.replace(/\D/g, '') })}
                                            disabled={user?.role === 'trainer'} maxLength="10" placeholder=" 10-digit number"
                                            className="w-full pl-[3.5rem] pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all disabled:bg-zinc-50 disabled:text-zinc-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Years of Experience <span className="font-normal text-zinc-400">(optional)</span></label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                        <input
                                            type="number" name="experience" min="0" max="30"
                                            value={contactForm.experience} onChange={handleFormChange}
                                            disabled={user?.role === 'trainer'} placeholder="E.g., 5"
                                            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all disabled:bg-zinc-50 disabled:text-zinc-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Resume</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-[0.6rem] w-4 h-4 text-zinc-400" />
                                        {user?.role === 'trainer' && user.resume_link ? (
                                            <div className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg bg-zinc-50 text-sm text-zinc-600 flex items-center justify-between">
                                                <span className="truncate text-xs font-medium">Profile Resume Attached</span>
                                                <a href={user.resume_link} target="_blank" rel="noreferrer" className="text-zinc-900 hover:underline flex-shrink-0 ml-2 text-[10px] font-bold uppercase tracking-wide">View →</a>
                                            </div>
                                        ) : (
                                            <input
                                                type="file" accept=".pdf,.doc,.docx"
                                                onChange={(e) => setContactForm({ ...contactForm, resume_file: e.target.files[0] })}
                                                className="w-full pl-9 pr-4 py-1.5 border border-zinc-200 rounded-lg text-sm text-zinc-600 bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleWhatsApp}
                                disabled={contactLoading}
                                className="w-full mt-6 bg-black hover:bg-zinc-800 text-white py-2.5 rounded-lg text-[11px] font-bold transition-all tracking-widest flex justify-center items-center gap-2 disabled:opacity-60"
                            >
                                {contactLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                                CONTINUE TO WHATSAPP
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Job Details Modal */}
            {viewJobDetails && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto border border-zinc-200">
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10 bg-white rounded-lg">
                            <button
                                onClick={() => handleShare(viewJobDetails._id, viewJobDetails.subject)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-all relative"
                                title="Copy link"
                            >
                                <Share2 className="w-4 h-4" />
                                {copiedId === viewJobDetails._id && (
                                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-10">Copied!</span>
                                )}
                            </button>
                            <button
                                onClick={() => setViewJobDetails(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="mb-6 pr-16 mt-2">
                            <span className="inline-block px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest rounded mb-3">
                                {viewJobDetails.status || 'open'}
                            </span>
                            <h2 className="text-2xl font-black text-zinc-900 mb-2 leading-tight">
                                {viewJobDetails.subject}
                            </h2>
                            <p className="text-xs text-zinc-500 font-medium">
                                Posted on {new Date(viewJobDetails.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                        </div>

                        {/* Highlighted Pinned Items */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                                <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Posted By</p>
                                <p className="text-xs font-black text-zinc-900 truncate" title={viewJobDetails.vendor_id?.name || 'Vendor'}>{viewJobDetails.vendor_id?.name || 'Vendor'}{viewJobDetails.posted_by_user?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 inline ml-1" />}</p>
                            </div>
                            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                                <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Budget / Salary</p>
                                <p className="text-xs font-black text-zinc-900 truncate">{viewJobDetails.pay_disclosed || 'Not disclosed'}</p>
                            </div>
                            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                                <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Location</p>
                                <p className="text-xs font-black text-zinc-900 truncate">{viewJobDetails.city || 'Any'}</p>
                            </div>
                            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                                <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Work Mode</p>
                                <p className="text-xs font-black text-zinc-900 capitalize truncate">{viewJobDetails.mode || 'Flexible'}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {viewJobDetails.college_area_notes && (
                                <div>
                                    <h3 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-2">For Whom / Client Notes</h3>
                                    <p className="text-sm text-zinc-800 font-medium">{viewJobDetails.college_area_notes}</p>
                                </div>
                            )}

                            <div>
                                <h3 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-2">Requirement Description</h3>
                                <div className="bg-zinc-50 p-4 rounded-xl text-sm leading-relaxed text-zinc-700 border border-zinc-200">
                                    {(() => {
                                        const text = viewJobDetails.cleaned_text || viewJobDetails.raw_text;
                                        if (!text) return null;
                                        
                                        if (viewJobDetails.cleaned_text) {
                                            const lines = text.split('\n').filter(l => l.trim().length > 0);
                                            const isList = lines.some(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
                                            if (isList) {
                                                return (
                                                    <ul className="list-disc pl-5 space-y-1.5 marker:text-zinc-400">
                                                        {lines.map((l, i) => {
                                                            let cleaned = l.replace(/^[-*]\s*/, '').trim();
                                                            // Basic bold rendering for **text**
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Duration</h3>
                                    <p className="text-sm font-medium text-zinc-900">{viewJobDetails.duration || 'Not specified'}</p>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Travel & Accommodation (TFA)</h3>
                                    <p className="text-sm font-medium text-zinc-900">{viewJobDetails.tfa || 'Not specified'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3 pt-6 border-t border-zinc-100">
                            <button
                                onClick={() => {
                                    setSelectedJob(viewJobDetails);
                                    setViewJobDetails(null);
                                    setAlertMsg({ text: '', type: '' });
                                }}
                                className="flex-1 bg-black hover:bg-zinc-800 text-white py-3 rounded-xl text-xs font-bold transition-all tracking-widest flex justify-center items-center gap-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                WHATSAPP APPLY
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </main>
        </div>
    );
}
