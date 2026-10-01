import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="w-full bg-white border-t border-slate-200 pt-16 pb-8 text-slate-600 relative z-[2000] flex-shrink-0">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">

                    {/* Brand Column */}
                    <div className="md:col-span-1 flex flex-col">

                        <div className="flex items-center gap-2.5 mb-4">
                            <img src="/logo.png" alt="Trainer Firm" className="h-14 sm:h-20 w-auto object-contain max-w-[340px]" />
                        </div>

                        <p className="text-sm leading-relaxed text-slate-500">
                            The reliable operating system for connecting
                            corporate vendors with verified technical trainers.
                        </p>

                        <div className="flex items-center gap-4 mt-10">

                            {/* Twitter / X */}
                            <a
                                href="#"
                                className="text-slate-400 hover:text-black transition-colors"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-5 h-5"
                                >
                                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                                </svg>
                            </a>

                            {/* LinkedIn */}
                            <a
                                href="#"
                                className="text-slate-400 hover:text-black transition-colors"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-5 h-5"
                                >
                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                    <rect x="2" y="9" width="4" height="12" />
                                    <circle cx="4" cy="4" r="2" />
                                </svg>
                            </a>

                            {/* GitHub */}
                            <a
                                href="#"
                                className="text-slate-400 hover:text-black transition-colors"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-5 h-5"
                                >
                                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                    <path d="M9 18c-4.51 2-5-2-7-2" />
                                </svg>
                            </a>

                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="text-black font-bold mb-4 uppercase tracking-wider text-xs">
                            Platform
                        </h4>

                        <ul className="space-y-2.5 text-sm">

                            <li>
                                <Link
                                    to="/trainers"
                                    className="hover:text-black transition-colors"
                                >
                                    Find Trainer Jobs
                                </Link>
                            </li>

                            <li>
                                <Link
                                    to="/vendor"
                                    className="hover:text-black transition-colors"
                                >
                                    Vendor Dashboard
                                </Link>
                            </li>

                            <li>
                                <a
                                    href="/#how-it-works"
                                    className="hover:text-black transition-colors"
                                >
                                    How it Works
                                </a>
                            </li>

                            <li>
                                <Link
                                    to="/auth?mode=register"
                                    className="hover:text-black transition-colors"
                                >
                                    Create Account
                                </Link>
                            </li>

                        </ul>
                    </div>

                    {/* Legal & Policy */}
                    <div>
                        <h4 className="text-black font-bold mb-4 uppercase tracking-wider text-xs">
                            Legal & Policy
                        </h4>

                        <ul className="space-y-2.5 text-sm">

                            <li>
                                <Link
                                    to="/terms"
                                    className="hover:text-black transition-colors"
                                >
                                    Terms of Service
                                </Link>
                            </li>

                            <li>
                                <Link
                                    to="/privacy"
                                    className="hover:text-black transition-colors"
                                >
                                    Privacy Policy
                                </Link>
                            </li>

                            <li>
                                <Link
                                    to="/guidelines"
                                    className="hover:text-black transition-colors"
                                >
                                    Community Guidelines
                                </Link>
                            </li>

                        </ul>
                    </div>

                    {/* Contact Us */}
                    <div>
                        <h4 className="text-black font-bold mb-4 uppercase tracking-wider text-xs">
                            Contact Us
                        </h4>

                        <ul className="space-y-4 text-sm">

                            <li className="flex items-start gap-3">
                                <Mail className="w-4 h-4 mt-0.5 text-slate-800 flex-shrink-0" />

                                <a
                                    href="mailto:support@trainersdeck.com"
                                    className="hover:text-black transition-colors"
                                >
                                    support@trainersdeck.com
                                </a>
                            </li>

                            <li className="flex items-start gap-3">
                                <Phone className="w-4 h-4 mt-0.5 text-slate-800 flex-shrink-0" />

                                <span className="text-slate-500">
                                    +91 (800) 123-4567
                                </span>
                            </li>

                            <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 mt-0.5 text-slate-800 flex-shrink-0" />

                                <span className="text-slate-500">
                                    Tech Park, Bangalore
                                    <br />
                                    Karnataka, India 560001
                                </span>
                            </li>

                        </ul>
                    </div>

                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">

                    <p className="text-xs text-slate-500">
                        © {new Date().getFullYear()} Trainer Firm.
                        All rights reserved.
                    </p>

                    <div className="flex gap-6 text-xs font-medium text-slate-500">
                        <span className="hover:text-black cursor-pointer">
                            System Status: All systems operational
                        </span>
                    </div>

                </div>

            </div>
        </footer>
    );
}