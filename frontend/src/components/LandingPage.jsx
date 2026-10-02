import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ArrowRight, Mail, Phone, MapPin, Briefcase, Clock , BadgeCheck} from 'lucide-react';
import GradualBlur from './GradualBlur'; 

export default function LandingPage() {
    const { user } = useContext(AuthContext);
    const [liveJobs, setLiveJobs] = useState([]);
    const [jobCount, setJobCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPreviewJobs = async () => {
            try {
                const res = await axios.get('/api/jobs');
                if (res.data?.jobs && res.data.jobs.length > 0) {
                    setLiveJobs(res.data.jobs.slice(0, 3));
                    setJobCount(res.data.jobs.length);
                }
            } catch (err) {
                // Fallback to static mock items if offline or empty
            } finally {
                setLoading(false);
            }
        };
        fetchPreviewJobs();
    }, []);

    const formatPostedDate = (dateVal) => {
        if (!dateVal) return 'Posted recently';
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return 'Posted recently';
            return `Posted on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } catch {
            return 'Posted recently';
        }
    };

    const defaultSampleJobs = [
        {
            _id: 'sample-1',
            mode: 'onsite',
            subject: 'Senior AWS Trainer',
            city: 'Bangalore',
            duration: '5 days',
            pay_disclosed: '45000/day',
            createdAt: new Date().toISOString()
        },
        {
            _id: 'sample-2',
            mode: 'hybrid',
            subject: 'React + TypeScript Instructor',
            city: 'Hyderabad',
            duration: '3 weeks',
            pay_disclosed: '90000/month',
            createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            _id: 'sample-3',
            mode: 'remote',
            subject: 'Azure Data Factory SME',
            city: 'Anywhere',
            duration: '10 days',
            pay_disclosed: '60000',
            createdAt: new Date(Date.now() - 172800000).toISOString()
        }
    ];

    const displayJobs = liveJobs.length > 0 ? liveJobs : defaultSampleJobs;

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-black selection:text-white relative">
            
            {/* HERO SECTION */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 md:pt-8 md:pb-16 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    
                    {/* Left Column */}
                    <div className="lg:col-span-7 space-y-6">
                        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-black tracking-tighter leading-[1.05] drop-shadow-sm">
                            The right trainer.<br />
                            The right brief. No<br />
                            noise.
                        </h1>

                        <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
                            Trainer Firm connects skilled technical trainers with corporate vendors who need reliable delivery—through structured jobs, direct contact, and transparent fulfillment.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            {user?.role === 'vendor' ? (
                                <Link 
                                    to="/vendor"
                                    className="px-6 py-3.5 bg-black hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                    Open Vendor Dashboard <ArrowRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <Link 
                                    to="/trainers"
                                    className="px-6 py-3.5 bg-black hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                    Find Trainer Jobs <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                            <Link 
                                to={user?.role === 'vendor' ? "/profile?tab=posted" : "/vendor"}
                                className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-semibold text-sm transition-all shadow-sm hover:border-slate-400"
                            >
                                {user?.role === 'vendor' ? 'My Posted Requirements' : 'Post a Requirement'}
                            </Link>
                        </div>
                    </div>

                    {/* Right Column - BLACK OUTER CARD */}
                    <div className="lg:col-span-5 relative z-20">
                        {user?.role === 'vendor' ? (
                            <div className="bg-black border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] transition-all duration-300 space-y-5">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-inner flex-shrink-0">
                                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M8 5V3.5C8 2.67157 8.67157 2 9.5 2H19.5C20.3284 2 21 2.67157 21 3.5V13.5C21 14.3284 20.3284 15 19.5 15H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
                                            <rect x="3.5" y="5.5" width="14" height="15" rx="2.5" fill="currentColor" stroke="currentColor" strokeWidth="1.8"/>
                                            <path d="M7 9.5H14" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
                                            <path d="M10.5 9.5V16" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Vendor Portal</span>
                                        <h3 className="text-base font-black text-white">TRAINER FIRM Workspace</h3>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-400 leading-relaxed">
                                    You are logged in as a <strong>Vendor</strong>. Create corporate training requirements, manage active postings, and connect with qualified trainers directly.
                                </p>

                                <div className="space-y-3 pt-2">
                                    <Link
                                        to="/vendor"
                                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-all shadow-[0_4px_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5"
                                    >
                                        Post New Requirement <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <Link
                                        to="/profile?tab=posted"
                                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all"
                                    >
                                        View My Posted Requirements
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-black border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden">
                                
                                <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
                                    <span className="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 text-white">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                        Live Requirements
                                    </span>
                                    <span className="text-xs font-semibold text-slate-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-700 shadow-inner">
                                        {jobCount} open
                                    </span>
                                </div>

                                <div className="space-y-4 mt-5 relative z-10">
                                    {/* WHITE INNER CARDS WITH ENHANCED DEPTH */}
                                    {loading ? (
                                        Array(3).fill(0).map((_, i) => (
                                            <div key={i} className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm animate-pulse">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="w-16 h-5 bg-slate-100 rounded-md"></div>
                                                    <div className="w-20 h-3 bg-slate-100 rounded"></div>
                                                </div>
                                                <div className="w-3/4 h-5 bg-slate-100 rounded mb-3"></div>
                                                <div className="flex gap-3">
                                                    <div className="w-20 h-4 bg-slate-50 rounded"></div>
                                                    <div className="w-20 h-4 bg-slate-50 rounded"></div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        displayJobs.map((job, idx) => (
                                            <Link 
                                                key={job._id || idx}
                                                to={`/trainers`}
                                                className="block group relative rounded-xl hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(255,255,255,0.12),inset_0_2px_4px_rgba(0,0,0,0.04)] transition-all duration-300 z-0 hover:z-10 shadow-[0_8px_20px_rgba(255,255,255,0.06),inset_0_2px_4px_rgba(0,0,0,0.04)]"
                                            >
                                                {/* Base White Background */}
                                                <div className="absolute inset-0 bg-white rounded-xl -z-10 pointer-events-none" />

                                                {/* Default Static Border */}
                                                <div className="absolute inset-0 border border-slate-200 rounded-xl group-hover:opacity-0 transition-opacity duration-300 -z-10 pointer-events-none" />

                                                {/* Revolving Border Layer */}
                                                <div className="absolute inset-[-1px] rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-20">
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] aspect-square bg-[conic-gradient(from_0deg,transparent_0_75%,#fff_100%)] animate-[spin_2.5s_linear_infinite]" />
                                                </div>

                                                {/* Content Container */}
                                                <div className="relative p-5 z-10">
                                                    <div className="flex items-center justify-between mb-2.5">
                                                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wide shadow-sm ${
                                                    job.mode === 'remote' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                                    job.mode === 'hybrid' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                                                    'bg-slate-50 text-slate-700 border border-slate-200'
                                                }`}>
                                                    {job.mode || 'Onsite'}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                                                    {formatPostedDate(job.createdAt)}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-black text-base sm:text-lg group-hover:text-blue-600 transition-colors leading-snug">
                                                {job.subject}
                                            </h3>

                                            <div className="flex flex-col gap-2 mt-2.5">
                                                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap font-medium">
                                                    <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> {job.experience_level === 'Flexible' ? 'TBD' : (job.experience_level || 'TBD')}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {job.employment_type === 'Flexible' ? 'TBD' : (job.employment_type || (job.duration === 'Flexible' ? 'TBD' : job.duration) || 'TBD')}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="flex items-center gap-1.5 capitalize"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.mode === 'remote' ? 'Work from Home' : (job.city === 'Flexible' ? 'TBD' : (job.city || (job.mode === 'Flexible' ? 'TBD' : job.mode) || 'TBD'))}</span>
                                                    {job.pay_disclosed && (
                                                        <>
                                                            <span className="text-slate-300">|</span>
                                                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                                                {/^[₹$€£]/.test(job.pay_disclosed.trim()) ? job.pay_disclosed : `₹${job.pay_disclosed}`}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-[12px] text-[#1a73e8] font-medium flex flex-wrap items-center gap-x-1.5 gap-y-1 truncate">
                                                    {(job.skills && job.skills.length > 0 ? job.skills : []).slice(0, 3).map((skill, i, arr) => (
                                                        <span key={i} className="flex items-center gap-1.5">
                                                            <span>{skill}</span>
                                                            {i < arr.length - 1 && <span className="text-slate-300">•</span>}
                                                        </span>
                                                    ))}
                                                    {job.skills && job.skills.length > 3 && <span className="text-slate-400 ml-1">+{job.skills.length - 3}</span>}
                                                </div>
                                            </div>
                                            </div>
                                        </Link>
                                        ))
                                    )}
                                </div>

                                <div className="mt-5 pt-4 border-t border-slate-800 text-center relative z-10">
                                    <Link 
                                        to="/trainers"
                                        className="text-xs font-bold text-slate-400 hover:text-white inline-flex items-center gap-1 transition-colors"
                                    >
                                        Browse all open requirements <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </section>

            {/* VALUE PROPOSITION */}
            <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-16 md:pb-28 border-t border-slate-100 relative z-10">
                <div className="max-w-3xl mb-12">
                    <span className="text-xs font-bold tracking-widest uppercase text-slate-500">
                        A Better Operating System
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight mt-2">
                        Training work deserves a better operating system.
                    </h2>
                    <p className="text-slate-600 mt-3 text-sm sm:text-base">
                        Trainer Firm replaces scattered WhatsApp screenshots and informal requirements with clear, structured, accountable workflows. Stop chasing responses and start managing your end-to-end training engagements with complete confidence and transparency.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { num: '01', title: 'Structured briefs', desc: 'Turn raw WhatsApp messages into complete, actionable training requirements with clear duration, budget, and scope.' },
                        { num: '02', title: 'Detailed profiles', desc: 'Review candidate profiles with self-described technical depth, resume links, and industry track records.' },
                        { num: '03', title: 'Direct coordination', desc: 'Immediate one-to-one WhatsApp coordination with pre-formatted requirements and direct candidate credentials.' },
                        { num: '04', title: 'Clear oversight', desc: 'Track open roles, applications, fulfillment, and responses in real time with transparent status logs.' }
                    ].map((feature, i) => (
                        <div key={i} className="card-revolve p-8 bg-white rounded-2xl shadow-sm cursor-pointer">
                            <div className="text-xs font-mono font-bold text-slate-400 mb-4">{feature.num}</div>
                            <h3 className="text-lg font-bold text-black mb-2">{feature.title}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* DUAL COMPARISON */}
            <section className="bg-[#FAFAFA] border-y border-slate-200 py-20 md:py-28 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
                        
                        <div id="for-trainers" className="space-y-6">
                            <div>
                                <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">For Trainers</span>
                                <h3 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight mt-1">Find work that fits your expertise.</h3>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { num: '01', text: 'Build an extensive technical profile' },
                                    { num: '02', text: 'Filter by tech, place, and daily rates' },
                                    { num: '03', text: 'Connect directly with vendors' },
                                    { num: '04', text: 'High delivery application acceptance rate' }
                                ].map((item) => (
                                    <div key={item.num} className="p-4 bg-white border border-slate-200 shadow-xs rounded-xl flex items-center gap-4 hover:border-slate-300 transition-all">
                                        <span className="text-xs font-mono font-bold text-slate-400">{item.num}</span>
                                        <span className="text-sm font-semibold text-slate-800">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2">
                                <Link to="/trainers" className="inline-flex items-center gap-2 px-5 py-3 bg-black hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                                    Explore Trainer Board <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                        <div id="for-vendors" className="space-y-6">
                            <div>
                                <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">For Vendors</span>
                                <h3 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight mt-1">Turn demand into a complete brief.</h3>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { num: '01', text: 'Paste raw client requirement message' },
                                    { num: '02', text: 'AI auto-detects missing fields & converts pay' },
                                    { num: '03', text: 'Review and publish clear requirements' },
                                    { num: '04', text: 'Fulfill directly with matched trainer credentials' }
                                ].map((item) => (
                                    <div key={item.num} className="p-4 bg-white border border-slate-200 shadow-xs rounded-xl flex items-center gap-4 hover:border-slate-300 transition-all">
                                        <span className="text-xs font-mono font-bold text-slate-400">{item.num}</span>
                                        <span className="text-sm font-semibold text-slate-800">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2">
                                <Link to="/vendor" className="inline-flex items-center gap-2 px-5 py-3 bg-black hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                                    Go to Vendor Dashboard <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* END-TO-END WORKFLOW (Thicker borders applied here) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
                <div className="max-w-3xl mb-12">
                    <span className="text-xs font-bold tracking-widest uppercase text-slate-500">End-to-End Workflow</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight mt-2">From an unstructured request to a confirmed trainer.</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { num: '01. PASTE', title: 'Raw Message', desc: 'Paste unformatted requirement text directly from WhatsApp or email.' },
                        { num: '02. PARSE', title: 'AI Structure', desc: 'Extracts duration, mode, technology, and normalizes salary amounts.' },
                        { num: '03. PUBLISH', title: 'Live Listing', desc: 'Appears immediately on the trainer board with clean, structured parameters.' },
                        { num: '04. TRAIN', title: 'Direct Match', desc: 'Trainers review criteria and apply with resumes and contact profiles.' }
                    ].map((step, i) => (
                        <div key={i} className="p-6 bg-white border-2 border-slate-300 rounded-2xl shadow-md hover:border-slate-400 hover:shadow-lg transition-all duration-300">
                            <div className="text-xs font-mono font-bold text-slate-400 mb-4">{step.num}</div>
                            <h4 className="text-sm font-bold text-black mb-1">{step.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                    <div className="p-6 bg-black text-white border-2 border-black rounded-2xl shadow-md hover:shadow-xl transition-all duration-300">
                        <div className="text-xs font-mono font-bold text-slate-400 mb-4">05. FULFILL</div>
                        <h4 className="text-sm font-bold text-white mb-1">Track & Close</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">Record trainer credentials, mark complete, and maintain full record.</p>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="bg-black text-white py-24 border-t border-slate-900 relative z-10">
                <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
                        Make your next training engagement<br className="hidden sm:inline" /> easier to trust.
                    </h2>
                    <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
                        Join the professional network built for technical training delivery.
                    </p>
                    <div className="pt-4">
                        <Link to="/auth?mode=register" className="inline-flex items-center gap-2.5 px-8 py-4 bg-white hover:bg-slate-100 text-black text-base font-bold rounded-full transition-all shadow-lg hover:shadow-white/10">
                            <span>Register Now</span>
                            <ArrowRight className="w-5 h-5 text-black" />
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
}