import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-[#f5f5f5] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-zinc-200 p-8 sm:p-12 relative z-10">
                <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-black transition-colors uppercase tracking-widest mb-8">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                </Link>
                <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight mb-4">Terms of Service</h1>
                <p className="text-xs text-zinc-500 mb-8 font-medium uppercase tracking-widest">Last updated: October 1, 2026</p>
                
                <div className="space-y-8 text-zinc-600 text-[13px] leading-relaxed font-medium">
                    <section>
                        <h2 className="text-base font-black text-zinc-900 mb-3 uppercase tracking-wider">1. Agreement to Terms</h2>
                        <p>By accessing or using Trainer Firm, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not access our platform or use our services.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-black text-zinc-900 mb-3 uppercase tracking-wider">2. User Accounts</h2>
                        <ul className="list-disc pl-5 space-y-2 text-zinc-500">
                            <li><strong className="text-zinc-800">Responsibility:</strong> You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</li>
                            <li><strong className="text-zinc-800">Accuracy:</strong> You must provide accurate, complete, and updated information when registering for an account.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-black text-zinc-900 mb-3 uppercase tracking-wider">3. Platform Rules</h2>
                        <p>When using our platform as either a Vendor or a Trainer, you agree not to:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2 text-zinc-500">
                            <li>Post false, inaccurate, or misleading information.</li>
                            <li>Use the service for any illegal or unauthorized purpose.</li>
                            <li>Attempt to bypass our platform to arrange training engagements outside the agreed terms.</li>
                            <li>Spam, harass, or abuse other users of the platform.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-black text-zinc-900 mb-3 uppercase tracking-wider">4. Service Modifications</h2>
                        <p>We reserve the right to modify or discontinue, temporarily or permanently, the service (or any part thereof) with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-black text-zinc-900 mb-3 uppercase tracking-wider">5. Contact</h2>
                        <p>If you have any questions about these Terms, please contact us at support@trainerfirm.com.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
