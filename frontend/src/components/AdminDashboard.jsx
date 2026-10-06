import toast from 'react-hot-toast';
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Loader2, Lock, KeyRound, CheckCircle, XCircle, Eye, BadgeCheck, X } from 'lucide-react';
import Loader from './Loader.jsx';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useContext(AuthContext);
    const [jobs, setJobs] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Login state
    const [adminPass, setAdminPass] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    const [activeTab, setActiveTab] = useState('open_jobs');
    const [selectedJob, setSelectedJob] = useState(null);
    const [editJobData, setEditJobData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user and all their jobs?')) return;
        try {
            await axios.delete(`/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('venty_token')}` } });
            fetchData();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const handleEditJobSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await axios.put(`/api/admin/jobs/${editJobData._id}/edit`, {
                subject: editJobData.subject,
                raw_text: editJobData.raw_text,
                cleaned_text: editJobData.cleaned_text
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('venty_token')}` } });
            setEditJobData(null);
            setSelectedJob(null);
            fetchData();

        } catch (error) {
            toast.error('Failed to update job');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [jobsRes, vendorsRes] = await Promise.all([
                axios.get('/api/admin/jobs', { headers: { Authorization: `Bearer ${localStorage.getItem('venty_token')}` } }),
                axios.get('/api/admin/vendors', { headers: { Authorization: `Bearer ${localStorage.getItem('venty_token')}` } })
            ]);
            setJobs(jobsRes.data.jobs || []);
            setVendors(vendorsRes.data.vendors || []);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        }
        setLoading(false);
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');
        try {
            const res = await axios.post('/api/auth/admin-login', { password: adminPass });
            if (res.data.success) {
                localStorage.setItem('venty_token', res.data.token);
                localStorage.setItem('venty_user', JSON.stringify(res.data.user));
                window.location.reload();
            }
        } catch (error) {
            setLoginError(error.response?.data?.error || 'Invalid password');
        }
        setLoginLoading(false);
    };

    const handleToggleFulfill = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'open' ? 'fulfilled' : 'open';
            await axios.put(`/api/admin/jobs/${id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${localStorage.getItem('venty_token')}` } });
            fetchData();
        } catch (e) {
            toast.error('Failed to update job status');
        }
    };

    const handleToggleVerify = async (id) => {
        try {
            await axios.put(`/api/admin/vendors/${id}/verify`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('venty_token')}` } });
            fetchData();
        } catch (e) {
            toast.error('Failed to verify vendor');
        }
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6]"><Loader /></div>;
    }

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-zinc-200 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <img src="/logo.png" alt="Trainer Firm" className="h-10 w-auto object-contain max-w-[200px]" />
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-md">
                            <Lock className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-black tracking-tight mb-2">Platform Access</h2>
                    <p className="text-sm text-zinc-500 mb-8 font-medium">Enter the master administrative password to securely access platform operations.</p>
                    
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                        <div>
                            <div className="relative">
                                <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input 
                                    type="password" 
                                    placeholder="Enter Admin Password"
                                    value={adminPass}
                                    onChange={(e) => setAdminPass(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                                    autoFocus
                                />
                            </div>
                            {loginError && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{loginError}</p>}
                        </div>
                        <button 
                            type="submit" 
                            disabled={loginLoading || !adminPass}
                            className="w-full py-3 bg-black text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-zinc-800 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                        >
                            {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authenticate'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const openJobs = jobs.filter(j => j.status === 'open');
    const fulfilledJobs = jobs.filter(j => j.status === 'fulfilled');
    const verifiedVendors = vendors.filter(v => v.isVerified).length;

    const JobRow = ({ job }) => (
        <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between group border-b border-zinc-200/60 last:border-0">
            <div className="flex items-center gap-6 mb-2 sm:mb-0">
                <span className="text-[10px] text-zinc-400 font-bold tracking-wider w-16">{new Date(job.createdAt).toLocaleDateString()}</span>
                <div>
                    <p className="text-xs font-black text-black">{job.subject || 'Untitled Requirement'}</p>
                    <p className="text-[10px] font-medium text-zinc-500">{job.vendor_id?.name || job.vendor_name || 'Unknown Vendor'} {job.posted_by_user?.isVerified && <BadgeCheck className="inline w-3 h-3 text-blue-500 ml-1"/>}</p>
                </div>
            </div>
            <div className="flex items-center gap-4 self-start sm:self-auto ml-22 sm:ml-0">
                <button 
                    onClick={() => setSelectedJob(job)}
                    className="text-[10px] font-black flex items-center gap-1 hover:underline text-zinc-700"
                >
                    <Eye className="w-3 h-3" /> Review
                </button>
                <button 
                    onClick={() => handleToggleFulfill(job._id, job.status)}
                    className={`text-[10px] font-black flex items-center gap-1 px-3 py-1.5 rounded-full ${job.status === 'open' ? 'bg-black text-white hover:bg-zinc-800' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'} transition-colors`}
                >
                    {job.status === 'open' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {job.status === 'open' ? 'Mark as Fulfilled' : 'Reopen Job'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F6F5F3] font-sans text-black pb-20">
            <div className="max-w-[1400px] mx-auto px-6 sm:px-10 pt-16">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-black pb-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                            <img src="/logo-mark.png" alt="Trainer Firm" className="h-7 w-auto object-contain" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-black">Platform Operations</p>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none">Admin overview.</h1>
                    </div>
                    <a href="/vendor" className="px-5 py-2.5 bg-black text-white text-xs font-black rounded-full hover:bg-zinc-800 transition-colors whitespace-nowrap self-end mb-1">
                        + Add New Post
                    </a>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-5 border border-zinc-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Open Jobs</p>
                        <p className="text-3xl font-normal tracking-tight mb-1">{openJobs.length}</p>
                    </div>
                    <div className="bg-white p-5 border border-zinc-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Fulfilled Jobs</p>
                        <p className="text-3xl font-normal tracking-tight mb-1">{fulfilledJobs.length}</p>
                    </div>
                    <div className="bg-white p-5 border border-zinc-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Verified Vendors</p>
                        <p className="text-3xl font-normal tracking-tight mb-1">{verifiedVendors} <span className="text-xl text-zinc-400">/ {vendors.length}</span></p>
                    </div>
                </div>

                {/* Main Content Tabs */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden mb-8">
                    <div className="flex border-b border-zinc-200">
                        <button 
                            onClick={() => setActiveTab('open_jobs')}
                            className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-colors ${activeTab === 'open_jobs' ? 'bg-black text-white' : 'hover:bg-zinc-50'}`}
                        >
                            Open Jobs ({openJobs.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('fulfilled_jobs')}
                            className={`flex-1 py-4 text-xs font-black uppercase tracking-wider border-l border-zinc-200 transition-colors ${activeTab === 'fulfilled_jobs' ? 'bg-black text-white' : 'hover:bg-zinc-50'}`}
                        >
                            Fulfilled Jobs ({fulfilledJobs.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('vendors')}
                            className={`flex-1 py-4 text-xs font-black uppercase tracking-wider border-l border-zinc-200 transition-colors ${activeTab === 'vendors' ? 'bg-black text-white' : 'hover:bg-zinc-50'}`}
                        >
                            Vendors ({vendors.length})
                        </button>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-300" /></div>
                        ) : (
                            <>
                                {activeTab === 'open_jobs' && (
                                    <div className="space-y-0">
                                        {openJobs.length === 0 ? <p className="text-sm text-zinc-500 py-4 text-center font-medium">No open jobs currently.</p> : openJobs.map(job => <JobRow key={job._id} job={job} />)}
                                    </div>
                                )}

                                {activeTab === 'fulfilled_jobs' && (
                                    <div className="space-y-0">
                                        {fulfilledJobs.length === 0 ? <p className="text-sm text-zinc-500 py-4 text-center font-medium">No fulfilled jobs yet.</p> : fulfilledJobs.map(job => <JobRow key={job._id} job={job} />)}
                                    </div>
                                )}

                                {activeTab === 'vendors' && (
                                    <div className="space-y-0 divide-y divide-zinc-200/60">
                                        {vendors.length === 0 ? <p className="text-sm text-zinc-500 py-4 text-center font-medium">No vendors registered.</p> : vendors.map(vendor => (
                                            <div key={vendor._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between group">
                                                <div className="flex items-center gap-6 mb-2 sm:mb-0">
                                                    <span className="text-[10px] text-zinc-400 font-bold tracking-wider w-16">{new Date(vendor.createdAt).toLocaleDateString()}</span>
                                                    <div>
                                                        <p className="text-xs font-black text-black flex items-center gap-1">
                                                            {vendor.name} {vendor.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                                                        </p>
                                                        <p className="text-[10px] font-medium text-zinc-500">{vendor.email} ? {vendor.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 self-start sm:self-auto ml-22 sm:ml-0">
                                                    <button 
                                                        onClick={() => handleToggleVerify(vendor._id)}
                                                        className={`text-[10px] font-black flex items-center gap-1 px-3 py-1.5 rounded-full ${vendor.isVerified ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'} transition-colors`}
                                                    >
                                                        {vendor.isVerified ? 'Revoke Verification' : 'Verify Vendor'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteUser(vendor._id)}
                                                        className="text-[10px] font-black flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                                                    >
                                                        Delete User
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Job Details Modal */}
            {selectedJob && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex justify-between items-center z-10">
                            <h2 className="text-lg font-black tracking-tight">Job Review</h2>
                            <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-zinc-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {editJobData ? (
                                <form onSubmit={handleEditJobSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2 block">Subject</label>
                                        <input type="text" value={editJobData.subject || ''} onChange={e => setEditJobData({...editJobData, subject: e.target.value})} className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm font-bold focus:border-black focus:outline-none focus:ring-1 focus:ring-black" required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2 block">Parsed Message (Description)</label>
                                        <textarea value={editJobData.cleaned_text || editJobData.raw_text || ''} onChange={e => setEditJobData({...editJobData, cleaned_text: e.target.value})} className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium focus:border-black focus:outline-none focus:ring-1 focus:ring-black h-40 resize-none" required />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-black text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-2">{isSaving ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</> : "Save Changes"}</button>
                                        <button type="button" onClick={() => setEditJobData(null)} className="px-6 py-2.5 border border-zinc-200 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-zinc-50 transition-colors">Cancel</button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">Subject / Requirement</h3>
                                        <p className="text-sm font-bold text-zinc-900">{selectedJob.subject || 'Not specified'}</p>
                                    </div>
                                    <button onClick={() => setEditJobData({...selectedJob})} className="px-4 py-1.5 bg-zinc-100 text-zinc-900 text-[10px] font-black rounded-full hover:bg-zinc-200 transition-colors border border-zinc-200">
                                        Edit Post
                                    </button>
                                </div>
                            
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">Vendor Name</h3>
                                        <p className="text-sm font-bold text-zinc-900 flex items-center gap-1">
                                            {selectedJob.vendor_id?.name || selectedJob.vendor_name || 'N/A'}
                                            {selectedJob.posted_by_user?.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">Contact Number</h3>
                                        <p className="text-sm font-bold text-zinc-900">{selectedJob.vendor_id?.phone || selectedJob.contact_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">Location</h3>
                                        <p className="text-sm font-bold text-zinc-900">{selectedJob.city || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">Mode</h3>
                                        <p className="text-sm font-bold text-zinc-900">{selectedJob.mode || 'N/A'}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">Parsed Message (Description)</h3>
                                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                                        <p className="text-sm font-medium text-zinc-800 whitespace-pre-wrap">{selectedJob.cleaned_text || selectedJob.raw_text}</p>
                                    </div>
                                </div>
                            
                                <div className="pt-4 flex justify-end gap-3">
                                    <button 
                                        onClick={() => setSelectedJob(null)}
                                        className="px-6 py-2 border border-zinc-200 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-zinc-50"
                                    >
                                        Close
                                    </button>
                                    <button 
                                        onClick={() => {
                                            handleToggleFulfill(selectedJob._id, selectedJob.status);
                                            setSelectedJob(null);
                                        }}
                                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-white transition-colors ${selectedJob.status === 'open' ? 'bg-black hover:bg-zinc-800' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                    >
                                        {selectedJob.status === 'open' ? 'Mark as Fulfilled' : 'Reopen Job'}
                                    </button>
                                </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
