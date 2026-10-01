import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Guidelines() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-100">
                <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-black mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <h1 className="text-3xl font-black tracking-tight mb-2">Community Guidelines</h1>
                <p className="text-slate-500 mb-8 text-sm">Last updated: October 2, 2026</p>

                <div className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-600 space-y-6">
                    <p>TrainerFirm works because the people on it are real and the postings are honest. A few simple expectations:</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">Post it straight</h2>
                    <p>If you're a vendor, give the real subject, real duration, real location, and whatever you know about pay or TFA. Vague or misleading postings waste everyone's time, including yours.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">Respond like a person</h2>
                    <p>If you're a trainer reaching out, do it the same way you'd want to be approached, clear and direct. No spam, no mass-messaging vendors with unrelated pitches.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">Keep contact details for what they're meant for</h2>
                    <p>Numbers and emails shared through TrainerFirm are for the opportunity at hand. Don't use them for anything else.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">Flag what's off</h2>
                    <p>See a posting that looks fake, outdated, or wrong? Let us know and we'll look into it. We're a small team, so your flag genuinely helps keep things clean.</p>

                    <h2 className="text-lg font-bold text-black mt-8 mb-4">We're here to help, not police</h2>
                    <p>TrainerFirm isn't trying to control how you work, just to keep the space usable and trustworthy for the people relying on it. If something's not working for you, tell us.</p>
                </div>
            </div>
        </div>
    );
}
