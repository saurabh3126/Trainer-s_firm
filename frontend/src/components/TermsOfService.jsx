import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-100">
                <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-black mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <h1 className="text-3xl font-black tracking-tight mb-2">Terms of Service</h1>
                <p className="text-slate-500 mb-8 text-sm">Last updated: October 2, 2026</p>

                <div className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-600 space-y-6">
                    <p>Welcome to TrainerFirm. By using this site, you agree to the following.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">What TrainerFirm is</h2>
                    <p>TrainerFirm connects vendors and trainers so you can find each other faster. What happens after that, the actual engagement, pay, and terms, is between you and the other person. We're not involved in that part, we just help you get there.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">Accounts</h2>
                    <p>When you post a requirement or sign up, you'll verify your phone number with an OTP. This keeps the postings on TrainerFirm tied to a real, reachable person. You're responsible for what you post, keep it accurate and keep it yours.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">Posting rules</h2>
                    <p>Postings should be genuine and accurate, real roles, real details. Don't post fake, duplicate, or misleading requirements. Don't use TrainerFirm to collect contact details for anything unrelated to a real training opportunity. Don't harass or misrepresent yourself to other users.</p>
                    <p>We can remove any posting or suspend any account that breaks these rules, no questions asked, since this keeps the platform usable for everyone else.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">Payments</h2>
                    <p>TrainerFirm doesn't handle, hold, or guarantee any payment between a vendor and a trainer. Any pay, timelines, or arrangement you agree to is strictly between the two of you.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">No guarantees</h2>
                    <p>We don't verify the accuracy of every posting or every claim a user makes. Use your own judgement before accepting any engagement, the same way you would with any opportunity you find elsewhere.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">Liability</h2>
                    <p>TrainerFirm isn't liable for any dispute, loss, or issue arising from an engagement you enter into through the platform. Use the platform at your own discretion.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">Changes</h2>
                    <p>We may update these terms as TrainerFirm grows. We'll keep this page current, so check back if anything seems to have changed.</p>
                </div>
            </div>
        </div>
    );
}
