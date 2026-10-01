import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PolicyPage() {
    return (
        <div className="min-h-screen bg-[#f5f5f5] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-zinc-200 p-8 sm:p-12 relative z-10">
                <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-black transition-colors uppercase tracking-widest mb-8">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                </Link>
                <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight mb-4">Privacy Policy</h1>
                <p className="text-xs text-zinc-500 mb-8 font-medium uppercase tracking-widest">Last updated: October 1, 2026</p>
                
                <div className="space-y-8 text-zinc-600 text-[13px] leading-relaxed font-medium">
                    <section>
                        <h2 className="text-base font-black text-zinc-900 mb-3 uppercase tracking-wider">1. Introduction</h2>
                        <p>Welcome to Trainer Firm. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and share information about you when you use our platform to connect with corporate vendors and technical trainers.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-black text-zinc-900 mb-3 uppercase tracking-wider">2. Information We Collect</h2>
                        <ul className="list-disc pl-5 space-y-2 text-zinc-500">
                            <li><strong className="text-zinc-800">Account Information:</strong> Name, email address, phone number, and professional details.</li>
                            <li><strong className="text-zinc-800">Professional Profiles:</strong> Resumes, skill sets, rates, and past job history.</li>
                            <li><strong className="text-zinc-800">Platform Activity:</strong> Jobs posted, applications, messages, and fulfillment records.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-black text-zinc-900 mb-3 uppercase tracking-wider">3. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2 text-zinc-500">
                            <li>Facilitate connections between vendors and trainers.</li>
                            <li>Communicate with you regarding job opportunities via WhatsApp, SMS, or email.</li>
                            <li>Improve our platform, maintain security, and prevent fraud.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-black text-zinc-900 mb-3 uppercase tracking-wider">4. Information Sharing</h2>
                        <p>We only share your information with relevant parties to facilitate training engagements. For example, a trainer's profile and contact details may be shared with a vendor when applying for a job, and a vendor's requirements are shared publicly on the Trainer Board.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-black text-zinc-900 mb-3 uppercase tracking-wider">5. Data Security</h2>
                        <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-black text-zinc-900 mb-3 uppercase tracking-wider">6. Contact Us</h2>
                        <p>If you have any questions about this Privacy Policy, please contact us at support@trainerfirm.com.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
