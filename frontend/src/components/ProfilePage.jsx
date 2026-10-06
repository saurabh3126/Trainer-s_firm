import toast from 'react-hot-toast';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Phone, Briefcase, Link as LinkIcon, Loader2, Save, CheckCircle2, Camera, MapPin, Calendar, IndianRupee, ArrowLeft, X, FileText } from 'lucide-react';
import Loader from './Loader.jsx';

export default function ProfilePage() {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState('profile');
    const [postedJobs, setPostedJobs] = useState([]);
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showFulfillForm, setShowFulfillForm] = useState(false);
    const [fulfillData, setFulfillData] = useState({ trainer_name: '', trainer_phone: '' });
    const [fulfillLoading, setFulfillLoading] = useState(false);

    // Profile State
    const [profileData, setProfileData] = useState({ 
        name: '', 
        phone: '', 
        email: '',
        location: '',
        skills: [],
        experience_years: '', 
        resume_file: null 
    });
    const [skillInput, setSkillInput] = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showPhoneOtp, setShowPhoneOtp] = useState(false);
    const [phoneOtp, setPhoneOtp] = useState('');

    // Photo State
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');

    // Lock background scroll when modal is open
    useEffect(() => {
        if (selectedJob) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedJob]);

    useEffect(() => {
        if (!user) return navigate('/auth');
        setProfileData({
            name: user.name || '',
            phone: user.phone || '',
            email: user.email || '',
            location: user.location || '',
            skills: user.skills || [],
            experience_years: user.experience_years || '',
            resume_file: null
        });
        setPhotoPreview(user.profile_photo || '');

        const requestedTab = searchParams.get('tab');
        if (requestedTab === 'posted' || requestedTab === 'history') {
            if (user.role === 'trainer') {
                setActiveTab('applied');
            } else {
                setActiveTab('posted');
            }
        } else if (requestedTab === 'applied') {
            if (user.role === 'vendor') {
                setActiveTab('posted');
            } else {
                setActiveTab('applied');
            }
        } else {
            setActiveTab('profile');
        }
    }, [user, navigate, searchParams]);

    useEffect(() => {
        if (activeTab === 'posted' || activeTab === 'applied') {
            fetchHistory();
        }
    }, [activeTab]);

        const canFulfillJob = (job) => {
        if (!user || !job) return false;
        if (user.role === 'admin') return true;
        if (user.role === 'vendor') {
            const currentUserId = (user.id || user._id || '').toString();
            const jobUserId = (job.posted_by_user?._id || job.posted_by_user || '').toString();
            if (jobUserId && currentUserId && jobUserId === currentUserId) return true;

            const userPhone = (user.phone || '').replace(/\D/g, '').slice(-10);
            const vendorPhone = (job.vendor_id?.phone || job.vendor_phone || '').replace(/\D/g, '').slice(-10);
            if (userPhone && vendorPhone && userPhone === vendorPhone) return true;
        }
        return false;
    };

    const handleFulfillSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setFulfillLoading(true);
        try {
            const token = localStorage.getItem('venty_token');
            await axios.put(`/api/jobs/${selectedJob._id}/fulfill`, fulfillData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowFulfillForm(false);
            setSelectedJob(null);
            setFulfillData({ trainer_name: '', trainer_phone: '' });
            fetchHistory(); // refresh the list
        } catch (error) {
            console.error('Error fulfilling job:', error);
            toast.error('Failed to mark job as fulfilled. Please try again.');
        }
        setFulfillLoading(false);
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const token = localStorage.getItem('venty_token');
            const res = await axios.get('/api/users/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPostedJobs(res.data.jobs || []);
            setAppliedJobs(res.data.interactions || []);
        } catch (error) {
            console.error("History fetch error:", error);
        }
        setHistoryLoading(false);
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdateLoading(true);
        setMessage('');

        // Phone changed? Require OTP
        if (profileData.phone !== user.phone && !showPhoneOtp) {
            try {
                await axios.post('/api/auth/send-otp', { phone: profileData.phone.replace(/\D/g, '') });
                setShowPhoneOtp(true);
                setMessage('OTP sent to new phone number. Please enter it to confirm.');
            } catch (error) {
                setMessage(error.response?.data?.error || 'Failed to send OTP to new number.');
            }
            setUpdateLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('venty_token');
            let final_resume_url = user.resume_link;
            let final_resume_public_id = user.resume_public_id;
            let final_photo_url = user.profile_photo || '';
            let final_photo_public_id = user.profile_photo_public_id || '';

            if (photoFile) {
                setMessage('Uploading profile photo...');
                const photoForm = new FormData();
                photoForm.append('resume', photoFile);
                const photoRes = await axios.post('/api/upload', photoForm, { 
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                final_photo_url = photoRes.data.url;
                final_photo_public_id = photoRes.data.public_id;
            }

            if (profileData.resume_file) {
                setMessage('Uploading new resume...');
                const formData = new FormData();
                formData.append('resume', profileData.resume_file);
                const uploadRes = await axios.post('/api/upload', formData, { 
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                final_resume_url = uploadRes.data.url;
                final_resume_public_id = uploadRes.data.public_id;
            }

            const payload = {
                name: profileData.name,
                email: profileData.email,
                phone: profileData.phone,
                otp: phoneOtp,
                location: profileData.location,
                skills: profileData.skills,
                experience_years: profileData.experience_years,
                resume_link: final_resume_url,
                resume_public_id: final_resume_public_id,
                profile_photo: final_photo_url,
                profile_photo_public_id: final_photo_public_id,
            };

            const res = await axios.put('/api/users/profile', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.success) {
                const storageUser = sessionStorage.getItem('venty_user') ? sessionStorage : localStorage;
                storageUser.setItem('venty_user', JSON.stringify(res.data.user));
                setUser(res.data.user);
                setShowPhoneOtp(false);
                setPhoneOtp('');
                setMessage('Profile updated successfully!');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage('Failed to update profile.');
        }
        setUpdateLoading(false);
    };

    if (!user) return null;

    const inputCls = "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all";

    return (
        <div className="max-w-4xl mx-auto mt-4 pb-16 px-4 sm:px-6">

            {/* TAB: PROFILE SETTINGS ONLY (Clean, no posted jobs) */}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">Profile settings</h2>
                        <button
                            onClick={handleUpdateProfile}
                            disabled={updateLoading}
                            className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                            {updateLoading ? 'SAVING...' : 'SAVE CHANGES'}
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                        {message && (
                            <div className={`m-4 p-4 rounded-lg text-sm font-bold ${message.includes('success') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                {message}
                            </div>
                        )}
                        <div className="p-6 sm:p-8 space-y-8">
                            {/* Profile Photo Section */}
                            <div className="flex items-center gap-5">
                                <div className="relative group flex-shrink-0">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center text-white text-3xl font-bold">
                                            {user.name?.trim().split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-start gap-1">
                                    <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
                                    <p className="text-xs text-slate-500 mb-2">JPG or PNG up to 3 MB</p>
                                    <label className="px-4 py-2 border border-slate-300 rounded-md text-xs font-bold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors uppercase">
                                        UPLOAD NEW PHOTO
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                    </label>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">CONTACT DETAILS</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Full name</label>
                                        <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone</label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-3 text-sm font-medium text-slate-500">+91</span>
                                            <input type="text" disabled={showPhoneOtp} value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value.replace(/\D/g, '')})} className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 disabled:bg-slate-50 disabled:text-slate-500" />
                                        </div>
                                    </div>
                                    {showPhoneOtp && (
                                        <div className="col-span-1 sm:col-span-2 mt-2 p-4 bg-red-50 border border-red-100 rounded-lg animate-in fade-in zoom-in-95 duration-200">
                                            <label className="block text-xs font-bold text-red-900 mb-2">Enter the 6-digit OTP sent to +91 {profileData.phone}</label>
                                            <input type="text" value={phoneOtp} onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="------" className="w-full px-3.5 py-2.5 bg-white border border-red-200 rounded-md text-lg font-black text-slate-900 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 text-center tracking-[0.5em]" />
                                            <div className="mt-3 text-right">
                                                <button type="button" onClick={() => setShowPhoneOtp(false)} className="text-xs text-red-600 hover:text-red-800 font-bold underline">Cancel phone change</button>
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                                        <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Location</label>
                                        <input type="text" value={profileData.location} onChange={e => setProfileData({...profileData, location: e.target.value})} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Experience and Expertise (Trainer Only) */}
                            {user.role === 'trainer' && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">EXPERIENCE AND EXPERTISE</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Years of experience</label>
                                            <div className="relative flex items-center">
                                                <input type="number" min="0" max="30" value={profileData.experience_years} onChange={(e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = '';
    else if (val < 0) val = 0;
    else if (val > 30) val = 30;
    setProfileData({...profileData, experience_years: val});
}} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Skills</label>
                                        <div className="flex gap-2 mb-2">
                                            <input 
                                                type="text" 
                                                value={skillInput} 
                                                onChange={e => setSkillInput(e.target.value)} 
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (skillInput.trim() && !profileData.skills.includes(skillInput.trim())) {
                                                            setProfileData({...profileData, skills: [...profileData.skills, skillInput.trim()]});
                                                            setSkillInput('');
                                                        }
                                                    }
                                                }}
                                                placeholder="Add a skill" 
                                                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400" 
                                            />
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (skillInput.trim() && !profileData.skills.includes(skillInput.trim())) {
                                                        setProfileData({...profileData, skills: [...profileData.skills, skillInput.trim()]});
                                                        setSkillInput('');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-bold uppercase"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {profileData.skills.map((skill, idx) => (
                                                <div key={idx} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                    {skill}
                                                    <button type="button" onClick={() => setProfileData({...profileData, skills: profileData.skills.filter((_, i) => i !== idx)})} className="text-slate-400 hover:text-slate-700">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {profileData.skills.length === 0 && <span className="text-xs text-slate-400 italic">No skills added yet</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Resume Section (Trainer Only) */}
                        {user.role === 'trainer' && (
                            <div className="bg-[#FAFAFA] border-t border-slate-200 p-6 sm:p-8 rounded-b-lg">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <p className="text-sm font-bold text-slate-900">
                                                {profileData.resume_file ? profileData.resume_file.name : (user.resume_link ? 'Current_Resume.pdf' : 'No resume uploaded')}
                                            </p>
                                        </div>
                                        {user.resume_link && <p className="text-xs text-slate-500">Uploaded previously</p>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {user.resume_link && !profileData.resume_file && (
                                            <a href={user.resume_link} target="_blank" rel="noreferrer" className="px-4 py-2 border border-slate-300 rounded-md text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 transition-colors uppercase">
                                                VIEW
                                            </a>
                                        )}
                                        <label className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-md text-xs font-bold cursor-pointer transition-colors uppercase">
                                            REPLACE
                                            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setProfileData({...profileData, resume_file: e.target.files[0]})} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* TAB: JOB POSTED (Dedicated Screen) */}
            {activeTab === 'posted' && (
                <div className="space-y-6">
                    <div>
                        <span className="text-[11px] font-black tracking-widest text-slate-500 uppercase">
                            Requirements Dashboard
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mt-1">
                            Job Posted.
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Review requirements posted by your account and their real-time fulfillment status.
                        </p>
                    </div>

                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs min-h-[320px]">
                        {historyLoading ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader />
                            </div>
                        ) : postedJobs.length === 0 ? (
                            <div className="text-center py-16">
                                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm font-medium">You haven't posted any requirements yet.</p>
                                <Link to="/vendor" className="inline-block mt-4 px-5 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all">
                                    Post a Requirement →
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {postedJobs.map(job => (
                                    <div key={job._id} className="border border-slate-200/80 p-5 rounded-xl flex justify-between items-center bg-[#F8F8F6] hover:bg-white hover:border-slate-300 transition-all gap-4 flex-wrap sm:flex-nowrap">
                                        <div className="w-full sm:w-auto min-w-0">
                                            <h3 className="font-black text-base text-slate-950 truncate" title={job.subject}>{job.subject}</h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                                                <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                                                {job.city && <span>• {job.city}</span>}
                                                {job.mode && <span className="capitalize">• {job.mode}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                            {job.status === 'open' && canFulfillJob(job) && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setShowFulfillForm(true); }}
                                                    className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:text-emerald-900 rounded-lg text-xs font-bold hover:border-emerald-400 transition-all mr-2"
                                                >
                                                    Fulfill
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => setSelectedJob(job)}
                                                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-950 rounded-lg text-xs font-bold hover:border-slate-400 transition-all"
                                            >
                                                View Details
                                            </button>
                                            <span className={`text-[10px] px-2.5 py-1 font-black rounded-lg uppercase tracking-wider border ${
                                                job.status === 'fulfilled'
                                                    ? 'bg-slate-200 text-slate-700 border-slate-300'
                                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            }`}>
                                                {job.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: JOB APPLIED (Dedicated Screen) */}
            {activeTab === 'applied' && (
                <div className="space-y-6">
                    <div>
                        <span className="text-[11px] font-black tracking-widest text-slate-500 uppercase">
                            Applications Dashboard
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mt-1">
                            Job Applied.
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Track the requirements you applied to and vendor connection status.
                        </p>
                    </div>

                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs min-h-[320px]">
                        {historyLoading ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader />
                            </div>
                        ) : appliedJobs.length === 0 ? (
                            <div className="text-center py-16">
                                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm font-medium">You haven't applied to any requirements yet.</p>
                                <Link to="/trainers" className="inline-block mt-4 px-5 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all">
                                    Browse Open Requirements →
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {appliedJobs.map(interaction => {
                                    const job = interaction.job_id;
                                    return (
                                        <div key={interaction._id} className="border border-slate-200/80 p-5 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#F8F8F6] hover:bg-white hover:border-slate-300 transition-all gap-4">
                                            <div className="min-w-0">
                                                <h3 className="font-black text-base text-slate-950 truncate" title={job?.subject || 'Job No Longer Available'}>
                                                    {job?.subject || 'Job No Longer Available'}
                                                </h3>
                                                {job ? (
                                                    <>
                                                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                                            <span>🏢 {job.vendor_id?.name || 'Vendor'}</span>
                                                            <span>📍 {job.city || 'Remote/TBD'}</span>
                                                            <span className="capitalize">💻 {job.mode || 'TBD'}</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                                                            Applied on: {new Date(interaction.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <p className="text-xs text-slate-400 mt-1">This post was permanently removed by the vendor.</p>
                                                )}
                                            </div>
                                            
                                            <div className="flex-shrink-0 flex gap-2 w-full sm:w-auto items-center justify-between sm:justify-end">
                                                {job ? (
                                                    <>
                                                        
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                                                            className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-950 rounded-lg text-xs font-bold hover:border-slate-400 transition-all"
                                                        >
                                                            View Details
                                                        </button>
                                                        <span className={`text-[10px] px-2.5 py-1 font-black rounded-lg uppercase tracking-wider border ${
                                                            job.status === 'open' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                                            job.status === 'fulfilled' ? 'bg-slate-200 text-slate-700 border-slate-300' :
                                                            'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}>
                                                            {job.status}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg font-black uppercase tracking-wider">
                                                        Deleted
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Job Details Modal */}
            {selectedJob && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto border border-slate-200">
                        <button 
                            onClick={() => { setSelectedJob(null); setShowFulfillForm(false); setFulfillData({ trainer_name: '', trainer_phone: '' }); }}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        
                        <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">Requirement Info</span>
                        <h2 className="text-xl font-black text-slate-950 tracking-tight mt-0.5 mb-2 pr-8">{selectedJob.subject}</h2>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-md uppercase tracking-wider border border-slate-200">{selectedJob.status}</span>
                            <span className="px-2.5 py-0.5 bg-slate-50 text-slate-500 text-xs font-medium rounded-md border border-slate-200">{new Date(selectedJob.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="space-y-4 text-slate-700">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Requirement Specifications</h3>
                                <div className="grid grid-cols-2 gap-3 bg-[#F8F8F6] p-4 rounded-xl border border-slate-100 text-xs">
                                    <div><span className="text-slate-400 block mb-0.5">Location</span> <span className="font-bold text-slate-900">{selectedJob.city || 'TBD'}</span></div>
                                    <div><span className="text-slate-400 block mb-0.5">Mode</span> <span className="font-bold text-slate-900 capitalize">{selectedJob.mode || 'TBD'}</span></div>
                                    <div><span className="text-slate-400 block mb-0.5">Duration</span> <span className="font-bold text-slate-900">{selectedJob.duration || 'TBD'}</span></div>
                                    <div><span className="text-slate-400 block mb-0.5">TFA</span> <span className="font-bold text-slate-900">{selectedJob.tfa || 'N/A'}</span></div>
                                    <div><span className="text-slate-400 block mb-0.5">Budget</span> <span className="font-bold text-slate-900">{selectedJob.pay_disclosed || 'Negotiable'}</span></div>
                                </div>
                            </div>

                            {selectedJob.cleaned_text && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                                    <div className="bg-[#F8F8F6] p-4 rounded-xl text-xs leading-relaxed whitespace-pre-wrap border border-slate-100 text-slate-700">{selectedJob.cleaned_text}</div>
                                </div>
                            )}

                            {selectedJob.status === 'fulfilled' && selectedJob.trainer_name && (
                                <div>
                                    <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Fulfillment Details</h3>
                                    <div className="grid grid-cols-2 gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-xs">
                                        <div><span className="text-emerald-700/70 block mb-0.5">Trainer Name</span> <span className="font-bold text-emerald-900">{selectedJob.trainer_name}</span></div>
                                        <div><span className="text-emerald-700/70 block mb-0.5">Phone Number</span> <span className="font-bold text-emerald-900">{selectedJob.trainer_phone}</span></div>
                                        {selectedJob.fulfilled_date && (
                                            <div><span className="text-emerald-700/70 block mb-0.5">Fulfilled Date</span> <span className="font-bold text-emerald-900">{new Date(selectedJob.fulfilled_date).toLocaleDateString()}</span></div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                            {selectedJob.status === 'open' && canFulfillJob(selectedJob) && (
                                <button
                                    onClick={() => setShowFulfillForm(true)}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all mr-3"
                                >
                                    Mark as Fulfilled
                                </button>
                            )}

                            <button 
                                onClick={() => { setSelectedJob(null); setShowFulfillForm(false); setFulfillData({ trainer_name: '', trainer_phone: '' }); }}
                                className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal: Mark as Fulfilled */}
            {showFulfillForm && selectedJob && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="bg-white rounded-xl shadow-sm max-w-md w-full p-6 relative border border-slate-200">
                        <h2 className="text-lg font-black text-slate-900 mb-1">Mark Requirement as Fulfilled</h2>
                        <p className="text-xs font-semibold text-slate-600 mb-5">
                            Record the details of the trainer who fulfilled this training engagement.
                        </p>
                        
                        <div className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-black text-slate-900 mb-1">Trainer Name <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                                    placeholder="E.g., Rajesh Kumar"
                                    value={fulfillData.trainer_name}
                                    onChange={(e) => setFulfillData({...fulfillData, trainer_name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-900 mb-1">Trainer Phone <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                                    placeholder="E.g., 9876543210"
                                    value={fulfillData.trainer_phone}
                                    onChange={(e) => setFulfillData({...fulfillData, trainer_phone: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2.5">
                            <button 
                                onClick={() => setShowFulfillForm(false)}
                                className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-900 rounded-xl text-xs font-black hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleFulfillSubmit}
                                disabled={!fulfillData.trainer_name || !fulfillData.trainer_phone || fulfillLoading}
                                className="px-5 py-2 bg-black border border-slate-200 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                {fulfillLoading ? 'Saving...' : 'Confirm & Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

