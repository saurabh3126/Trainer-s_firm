import re

with open('frontend/src/components/AuthPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add states
states = '''
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [forgotNewPassword, setForgotNewPassword] = useState('');
'''
content = content.replace('const [loading, setLoading] = useState(false);', 'const [loading, setLoading] = useState(false);' + states)

# Add Handlers
handlers = '''
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
'''
content = content.replace('const handleChange = (e) => {', handlers + '\\n    const handleChange = (e) => {')

# Render block
forgot_block = '''
        if (forgotPasswordMode) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                        <button onClick={() => setForgotPasswordMode(false)} className="flex items-center text-sm text-gray-500 mb-6 hover:text-black">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                        </button>
                        <h2 className="text-2xl font-black mb-6 text-center">Reset Password</h2>
                        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded mb-4">{error}</div>}
                        {successMsg && <div className="p-3 bg-green-50 text-green-600 text-sm rounded mb-4">{successMsg}</div>}
                        
                        {forgotStep === 1 ? (
                            <form onSubmit={handleForgotSendOtp} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Email</label>
                                    <input type="email" required className="w-full border p-3 rounded" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-black text-white p-3 rounded font-bold hover:bg-gray-800 flex justify-center">
                                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Send OTP'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleForgotReset} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Enter OTP</label>
                                    <input type="text" required className="w-full border p-3 rounded text-center tracking-widest text-xl" value={forgotOtp} onChange={e => setForgotOtp(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">New Password</label>
                                    <input type="password" required minLength={6} className="w-full border p-3 rounded" value={forgotNewPassword} onChange={e => setForgotNewPassword(e.target.value)} />
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-black text-white p-3 rounded font-bold hover:bg-gray-800 flex justify-center">
                                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Reset Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            );
        }
'''
content = content.replace('return (', forgot_block + '\\n    return (', 1)

# Hook up the link
content = content.replace('<Link to="#" \\nclassName="text-[10px] font-semibold text-black hover:underline">\\n                                                Forgot password?\\n                                            </Link>', '<button type="button" onClick={() => setForgotPasswordMode(true)} className="text-[10px] font-semibold text-black hover:underline">Forgot password?</button>')

content = content.replace('<Link to="#" className="text-[10px] font-semibold text-black hover:underline">\\n                                                Forgot password?\\n                                            </Link>', '<button type="button" onClick={() => setForgotPasswordMode(true)} className="text-[10px] font-semibold text-black hover:underline">Forgot password?</button>')

with open('frontend/src/components/AuthPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

