import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, Eye, EyeOff, X } from 'lucide-react';

export default function AuthPage() {
    const { login, register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const mode = searchParams.get('mode');
    const [isLogin, setIsLogin] = useState(mode !== 'register' && mode !== 'signup');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [forgotNewPassword, setForgotNewPassword] = useState('');

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpChannel, setOtpChannel] = useState('sms'); // 'sms' | 'email'
    const [resendingEmail, setResendingEmail] = useState(false);

    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '',
        whatsapp_number: '', same_as_phone: false,
        personal_email: '',
        role: 'trainer', experience_years: '', resume_file: null,
        location: ''
    });

    const [passStrength, setPassStrength] = useState({ message: '', color: '', valid: false });
    const [emailValid, setEmailValid] = useState(true);
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        const currentMode = searchParams.get('mode');
        if (currentMode === 'register' || currentMode === 'signup') setIsLogin(false);
        else if (currentMode === 'login') setIsLogin(true);
    }, [searchParams]);

    useEffect(() => {
        if (isLogin) return;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setEmailValid(formData.email === '' || formData.email === undefined || emailRegex.test(formData.email));

        const pass = formData.password;
        if (!pass) {
            setPassStrength({ message: '', color: '', valid: false });
            return;
        }

        const hasLetters = /[a-zA-Z]/.test(pass);
        const hasNumbers = /[0-9]/.test(pass);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

        if (pass.length < 8) {
            setPassStrength({ message: 'Weak - must be at least 8 characters', color: 'text-red-500', valid: false });
        } else if (hasLetters && hasNumbers && hasSpecial) {
            setPassStrength({ message: 'Strong', color: 'text-emerald-600', valid: true });
        } else if (hasLetters && hasNumbers) {
            setPassStrength({ message: 'Medium', color: 'text-amber-500', valid: true });
        } else {
            setPassStrength({ message: 'Weak - requires letter and number', color: 'text-red-500', valid: false });
        }
    }, [formData.password, formData.email, isLogin]);

    
    const handleForgotSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await axios.post('/api/auth/forgot-password', { email: forgotEmail });
            setSuccessMsg(res.data.message);
            setForgotStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP');
        } finally { setLoading(false); }
    };

    const handleForgotReset = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await axios.post('/api/auth/reset-password', { email: forgotEmail, otp: forgotOtp, newPassword: forgotNewPassword });
            setSuccessMsg(res.data.message);
            setForgotPasswordMode(false);
            setForgotStep(1);
            setIsLogin(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally { setLoading(false); }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setFieldErrors({});
        let currentErrors = {};

        if (isLogin) {
            if (!formData.email) currentErrors.email = true;
            if (!formData.password) currentErrors.password = true;
            
            if (Object.keys(currentErrors).length > 0) {
                setFieldErrors(currentErrors);
                return setError('Please fill out the highlighted fields correctly.');
            }

            setLoading(true);
            try {
                const res = await login(formData.email, formData.password);
                if (res?.success) navigate(res.role === 'vendor' ? '/vendor' : '/trainers');
            } catch (err) {
                setFieldErrors({ email: true, password: true });
                setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
            }
            setLoading(false);
            return;
        }

        if (!formData.name || !formData.name.trim()) currentErrors.name = true;
        
        if (formData.email && !emailValid) {
            currentErrors.email = true;
        }
        
        if (!formData.password || !passStrength.valid) currentErrors.password = true;
        if (!formData.phone || formData.phone.length !== 10) currentErrors.phone = true;
        if (formData.role === 'trainer' && !formData.resume_file) currentErrors.resume_file = true;

        if (Object.keys(currentErrors).length > 0) {
            setFieldErrors(currentErrors);
            let errMsg = 'Please fill out all highlighted fields correctly.';
            if (currentErrors.email && formData.email) errMsg = 'Please enter a valid email address (e.g., name@example.com).';
            else if (currentErrors.password) errMsg = 'Password must be at least 8 characters and include a letter and number.';
            else if (currentErrors.phone) errMsg = 'Please enter a valid 10-digit phone number.';
            else if (currentErrors.resume_file) errMsg = 'Please upload your resume to continue.';
            return setError(errMsg);
        }

        setLoading(true);
        try {
            const res = await axios.post('/api/auth/send-otp', { email: formData.email, phone: formData.phone.replace(/\D/g, '') });
            if (res.data.success) {
                if (res.data.smsFailed) {
                    setError('SMS failed to send. Please click "Send to email instead" below.');
                    setOtpChannel('sms');
                } else {
                    setSuccessMsg('');
                    setOtpChannel(res.data.smsSent ? 'sms' : 'email');
                }
                setShowOtpInput(true);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP.');
        }
        setLoading(false);
    };

    const handleResendEmail = async () => {
        setResendingEmail(true);
        try {
            await axios.post('/api/auth/resend-otp-email', { 
                email: formData.email, 
                phone: formData.phone.replace(/\D/g, '') 
            });
            setOtpChannel('email');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send email.');
        }
        setResendingEmail(false);
    };

    const handleVerifyAndRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('Preparing account...');

        try {
            let final_resume_url = '';
            let final_resume_public_id = '';

            if (formData.role === 'trainer' && formData.resume_file) {
                setSuccessMsg('Uploading resume...');
                const uploadData = new FormData();
                uploadData.append('resume', formData.resume_file);
                const uploadRes = await axios.post('/api/upload', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                final_resume_url = uploadRes.data.url;
                final_resume_public_id = uploadRes.data.public_id;
            }

            const payload = { ...formData, otp, resume_link: final_resume_url, resume_public_id: final_resume_public_id };
            const res = await register(payload);

            if (res?.success) {
                setIsLogin(true);
                setShowOtpInput(false);
                setOtp('');
                setSuccessMsg('');
                setFormData({ ...formData, password: '', resume_file: null });

                const loginRes = await login(formData.email, formData.password);
                if (loginRes?.success) navigate(loginRes.role === 'vendor' ? '/vendor' : '/trainers');
            }
        } catch (err) {
            setSuccessMsg('');
            setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
        }
        setLoading(false);
    };

    const switchMode = (mode) => {
        setIsLogin(mode === 'login');
        setError('');
        setSuccessMsg('');
        setShowOtpInput(false);
        setOtp('');
        setFormData({ ...formData, password: '', resume_file: null });
    };

    const getInputCls = (name) => `w-full px-3 py-2.5 bg-white border rounded-lg text-[13px] font-medium placeholder-zinc-400 focus:outline-none focus:ring-1 transition-all ${fieldErrors[name] ? 'border-red-500 ring-red-500 text-red-900' : 'border-zinc-200 focus:border-black focus:ring-black'}`;
    const labelCls = "block text-[11px] font-bold text-zinc-800 mb-1.5";
    return (
        <div className="flex min-h-screen bg-transparent font-sans overflow-hidden">
            
            {/* Left Black Section */}
            <div className="hidden lg:flex lg:w-[480px] xl:w-[500px] bg-[#0b0b0b] flex-col justify-between p-10 relative z-[100] border-r border-zinc-800">
                <div>
                    <Link to="/" className="relative z-[100] block w-fit pointer-events-auto cursor-pointer"><img src="/logo-white.png" alt="Trainer Firm" className="h-14 sm:h-18 w-auto object-contain max-w-[300px]" /></Link>
                </div>
                
                <div className="max-w-[360px]">
                    <p className="text-[9px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-5">
                        Professional Training Network
                    </p>
                    <h2 className="text-[2.25rem] font-semibold tracking-tight leading-[1.1] mb-5 text-white">
                        Work and<br />requirements,<br />structured from<br />day one.
                    </h2>
                    <p className="text-zinc-400 text-[13px] leading-relaxed">
                        A trusted operating layer for technical trainers and vendors.
                    </p>
                </div>

                <div className="text-[10px] text-zinc-600 font-medium">
                    {showOtpInput ? 'Email verification' : (isLogin ? 'Authentication login' : 'Authentication signup')} - TRAINER FIRM
                </div>
            </div>

            {/* Right White Section */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 relative z-50">
                {/* Back to Home Button placed near top left of white area */}
                <div className="absolute top-6 left-6 lg:top-8 lg:left-8 z-[100]">
                    <Link to="/" className="flex items-center gap-1.5 text-[11px] font-black text-black hover:opacity-70 transition-opacity uppercase tracking-widest cursor-pointer pointer-events-auto">
                        <ArrowLeft className="w-3.5 h-3.5" /> Home
                    </Link>
                </div>

                <div className="w-full max-w-[400px]">
                    <div 
                        key={isLogin ? 'login' : 'signup'} 
                        className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 border border-zinc-100 animate-fade-slide"
                    >
                        
                        {/* Headers */}
                        <div className="mb-5 text-center">
                            <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                                {showOtpInput ? 'Verify your account.' : (isLogin ? 'Welcome back.' : 'Create your profile.')}
                            </h2>
                            <p className="text-xs text-zinc-500 mt-1">
                                {showOtpInput 
                                    ? (otpChannel === 'sms' ? `Code sent to +91${formData.phone}.` : `Code sent to ${formData.email || 'your email'}.`)
                                    : (isLogin ? 'Log in or create a new Trainer Firm account.' : 'A complete profile helps vendors select your fit.')}
                            </p>
                        </div>

                        {/* Log in / Sign up Toggle */}
                        {!showOtpInput && (
                            <div className="flex bg-zinc-100/80 rounded-lg p-1 mb-6">
                                <button 
                                    type="button"
                                    onClick={() => switchMode('login')}
                                    className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all ${isLogin ? 'bg-black text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                                >
                                    Log in
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => switchMode('signup')}
                                    className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all ${!isLogin ? 'bg-black text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                                >
                                    Sign up
                                </button>
                            </div>
                        )}

                        {/* Alerts */}
                        {error && (
                            <div className="flex items-center gap-2 p-2 mb-4 bg-red-50 border border-red-100 rounded-lg text-[11px] text-red-700 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                                <span>{error}</span>
                            </div>
                        )}
                        {successMsg && (
                            <div className="flex items-center gap-2 p-2 mb-4 bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] text-emerald-800 font-medium">
                                {successMsg.toLowerCase().includes('uploading') || successMsg.toLowerCase().includes('preparing')
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0 text-emerald-600" />
                                    : <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />}
                                <span>{successMsg}</span>
                            </div>
                        )}

                        {showOtpInput ? (
                            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
                                <div>
                                    <input
                                        type="text" required maxLength="6"
                                        placeholder="0 0 0 0 0 0"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-center tracking-[0.75em] text-lg font-bold bg-white border border-zinc-200 rounded-lg py-2 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="w-full bg-black hover:bg-zinc-800 text-white py-2.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                                >
                                    {loading ? 'VERIFYING...' : 'VERIFY CODE'}
                                </button>

                                {/* SMS ? Email fallback option */}
                                <div className="text-center space-y-1.5">
                                    {otpChannel === 'sms' && (
                                        <div className="text-center">
                                            <span className="text-[10px] text-zinc-400">Didn't receive SMS? </span>
                                            <button
                                                type="button"
                                                onClick={handleResendEmail}
                                                disabled={resendingEmail}
                                                className="text-[10px] font-bold text-black hover:underline disabled:opacity-50"
                                            >
                                                {resendingEmail ? 'Sending...' : 'Send to email instead ?'}
                                            </button>
                                        </div>
                                    )}
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setShowOtpInput(false)}
                                            disabled={loading}
                                            className="text-[9px] font-semibold text-zinc-400 hover:text-black transition-colors uppercase tracking-wider"
                                        >
                                            Use a different number / email
                                        </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSendOtp} className="space-y-3">
                                
                                {/* Role Selector */}
                                {!isLogin && (
                                    <div className="space-y-1.5">
                                        <label className={labelCls}>Continue as:</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { value: 'trainer', title: 'Trainer', desc: 'Find work' },
                                                { value: 'vendor', title: 'Vendor', desc: 'Post work' }
                                            ].map(({ value, title, desc }) => (
                                                <label
                                                    key={value}
                                                    className={`relative flex flex-col p-2.5 rounded-lg border cursor-pointer transition-all ${
                                                        formData.role === value
                                                            ? 'border-black bg-black'
                                                            : 'border-zinc-200 bg-white hover:border-zinc-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio" name="role" value={value}
                                                        checked={formData.role === value}
                                                        onChange={handleChange}
                                                        className="hidden"
                                                    />
                                                    <span className={`text-xs font-semibold ${formData.role === value ? 'text-white' : 'text-zinc-900'}`}>{title}</span>
                                                    <span className={`text-[9px] font-medium mt-0.5 leading-tight ${formData.role === value ? 'text-zinc-300' : 'text-zinc-500'}`}>{desc}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Form Fields */}
                                {!isLogin ? (
                                    <>
                                        {/* Register Fields */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelCls}>First name</label>
                                                <input
                                                    type="text" name="firstName" required
                                                    placeholder="First name"
                                                    value={formData.name.split(' ')[0] || ''}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value + (formData.name.split(' ').slice(1).join(' ') ? ' ' + formData.name.split(' ').slice(1).join(' ') : '') })}
                                                    className={getInputCls('name')}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Last name</label>
                                                <input
                                                    type="text" name="lastName"
                                                    placeholder="Last name"
                                                    value={formData.name.split(' ').slice(1).join(' ') || ''}
                                                    onChange={(e) => setFormData({ ...formData, name: (formData.name.split(' ')[0] || '') + ' ' + e.target.value })}
                                                    className={getInputCls('name')}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelCls}>Email (Optional)</label>
                                                <input
                                                    type="email" name="email"
                                                    placeholder="name@company.com"
                                                    value={formData.email} onChange={handleChange}
                                                    className={getInputCls('unknown')}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Phone</label>
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[11px] text-zinc-500 pointer-events-none">+91</span>
                                                    <input
                                                        type="text" required maxLength="10" pattern="\d{10}"
                                                        placeholder="9876543210"
                                                        value={formData.phone}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            setFormData({ ...formData, phone: val, whatsapp_number: formData.same_as_phone ? val : formData.whatsapp_number });
                                                        }}
                                                        className={`${getInputCls('unknown')} pl-8`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {formData.role === 'trainer' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className={labelCls}>Experience (yrs)</label>
                                                    <input
                                                        type="number" name="experience_years" min="0" max="30"
                                                        placeholder="e.g. 5"
                                                        value={formData.experience_years} onChange={(e) => {
                                                            let val = parseInt(e.target.value, 10);
                                                            if (isNaN(val)) val = '';
                                                            else if (val < 0) val = 0;
                                                            else if (val > 30) val = 30;
                                                            setFormData({ ...formData, experience_years: val });
                                                        }}
                                                        className={getInputCls('unknown')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Location</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Remote"
                                                        className={getInputCls('location')}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className={labelCls}>Password</label>
                                            <div className="relative">
                                                <input
                                                type={showPassword ? "text" : "password"} name="password" required
                                                placeholder="••••••••"
                                                value={formData.password} onChange={handleChange}
                                                className={getInputCls('unknown')}
                                            />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                            {!isLogin && passStrength.message && (
                                                <div className={`text-[10px] font-bold mt-1.5 ${passStrength.color}`}>
                                                    {passStrength.message}
                                                </div>
                                            )}

                                        {formData.role === 'trainer' && (
                                            <div className="pt-1">
                                                {formData.resume_file ? (
                                                    <div className="flex items-center justify-between w-full py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                        <span className="text-[10px] font-semibold text-emerald-700 truncate mr-2">
                                                            {formData.resume_file.name}
                                                        </span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setFormData({ ...formData, resume_file: null })}
                                                            className="text-emerald-700 hover:text-emerald-900 focus:outline-none p-0.5 rounded-md hover:bg-emerald-100 transition-colors shrink-0"
                                                            title="Remove resume"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className={`flex flex-col items-center justify-center w-full py-2.5 bg-zinc-50 border border-dashed rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors ${fieldErrors.resume_file ? 'border-red-500 bg-red-50/50' : 'border-zinc-300'}`}>
                                                        <span className="text-[10px] font-bold text-zinc-900">Upload Resume</span>
                                                        <input
                                                            type="file" accept=".pdf,.doc,.docx"
                                                            onChange={(e) => setFormData({ ...formData, resume_file: e.target.files[0] })}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-start gap-2 pt-2">
                                            <input type="checkbox" id="terms-check" required className="mt-0.5 w-3 h-3 rounded border-zinc-300 text-black focus:ring-black cursor-pointer" />
                                            <label htmlFor="terms-check" className="text-[10px] text-zinc-500 cursor-pointer leading-tight">
                                                I agree to the <Link to="/terms" target="_blank" className="text-black font-semibold hover:underline">Terms of Service</Link> and <Link to="/privacy" target="_blank" className="text-black font-semibold hover:underline">Privacy Policy</Link>.
                                            </label>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Login Fields */}
                                        <div>
                                            <label className={labelCls}>Email or Phone</label>
                                            <input
                                                type="text" name="email" required
                                                placeholder="email@example.com or 9876543210"
                                                value={formData.email} onChange={handleChange}
                                                className={getInputCls('unknown')}
                                            />
                                        </div>
                                        <div className="mt-4">
                                            <label className={labelCls}>Password</label>
                                            <div className="relative">
                                                <input
                                                type={showPassword ? "text" : "password"} name="password" required
                                                placeholder="••••••••"
                                                value={formData.password} onChange={handleChange}
                                                className={getInputCls('unknown')}
                                            />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-1">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input type="checkbox" className="w-3 h-3 rounded border-zinc-300 text-black focus:ring-black" />
                                                <span className="text-[10px] font-medium text-zinc-600">Remember me</span>
                                            </label>
                                            <button type="button" onClick={() => setForgotPasswordMode(true)} className="text-[10px] font-semibold text-black hover:underline">Forgot password?</button>
                                        </div>
                                    </>
                                )}

                                <div className="pt-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-black hover:bg-zinc-800 text-white py-2.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'PLEASE WAIT...' : (isLogin ? 'LOG IN' : 'CREATE ACCOUNT')}
                                    </button>
                                </div>
                            </form>
                        )}
                        
                    </div>
                    
                    {/* Bottom Disclaimer */}
                    <div className="mt-4 text-center text-[9px] text-zinc-400">
                        By continuing, you agree to Trainer Firm's <Link to="/terms" className="hover:text-zinc-600 underline decoration-zinc-300">Terms of Service</Link> and <Link to="/privacy" className="hover:text-zinc-600 underline decoration-zinc-300">Privacy Policy</Link>.
                    </div>
                </div>
            </div>
        </div>
    );
}



