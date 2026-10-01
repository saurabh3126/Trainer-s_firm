import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PolicyPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-100">
                <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-black mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <h1 className="text-3xl font-black tracking-tight mb-2">Privacy Policy</h1>
                <p className="text-slate-500 mb-8 text-sm">Last updated: October 2, 2026</p>

                <div className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-600 space-y-6">
                    <p>We keep this simple, because we only collect what we actually need to run TrainerFirm.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">What we collect</h2>
                    <p>Your name, phone number, and email if you give it to us. If you set a password, we store it securely to let you log in. If you post a requirement, we store what you write and the cleaned-up version TrainerFirm generates from it.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">What it's used for</h2>
                    <p>To create and verify your account, to let you log back in, and to send you updates relevant to your postings or activity on TrainerFirm, like an OTP or a notice about your listing. That's it.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">What's public</h2>
                    <p>Job postings are public by design, that's the whole point of TrainerFirm, so trainers can see and respond to them. Your name as given may show up alongside your posting. Your phone number isn't shown directly on the page, it's only shared through the contact flow when a trainer reaches out, or when you choose to share it.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">What we don't do</h2>
                    <p>We don't sell your data. We don't send it off to third parties for marketing or any purpose outside running TrainerFirm itself.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">Your control</h2>
                    <p>You can ask us to update or delete your account and data at any time, just reach out to us directly and we'll take care of it.</p>
                </div>
            </div>
        </div>
    );
}
