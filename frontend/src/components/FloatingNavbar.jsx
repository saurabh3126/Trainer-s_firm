import { useContext, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, Briefcase, FileText, User, Settings, LogOut, CheckCircle2, Clock, ListChecks, Shield, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FloatingNavbar() {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const pathname = location.pathname;

    // Determine current active tab based on route
    const getActiveTab = () => {
        if (pathname === '/') return 'home';
        if (pathname.startsWith('/trainers') || pathname.startsWith('/trainer') || pathname.startsWith('/job')) return 'jobs';
        if (pathname.startsWith('/vendor')) return 'post-job';
        if (pathname.startsWith('/admin')) return 'admin';
        if (pathname.startsWith('/profile')) {
            if (location.search.includes('tab=posted')) return 'my-jobs';
            return 'account';
        }
        if (pathname.startsWith('/auth')) return 'auth';
        return 'home';
    };

    const activeTab = getActiveTab();

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setAccountMenuOpen(false);
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        setAccountMenuOpen(false);
        setMobileMenuOpen(false);
        logout();
        navigate('/');
    };

    // Define items based on user auth & role:
    // 1. Guest: Home, Jobs, Post a Job
    // 2. Trainer: Home, Jobs
    // 3. Vendor: Home, Post a Job, My Jobs
    const getNavItems = () => {
        if (!user) {
            return [
                { id: 'home', label: 'Home', path: '/', icon: Home },
                { id: 'jobs', label: 'Jobs', path: '/trainers', icon: Briefcase },
                { id: 'post-job', label: 'Post a Job', path: '/vendor', icon: FileText }
            ];
        }
        if (user.role === 'admin') {
            return [
                { id: 'home', label: 'Home', path: '/', icon: Home },
                { id: 'admin', label: 'Admin Dashboard', path: '/admin', icon: Shield }
            ];
        }
        if (user.role === 'vendor') {
            return [
                { id: 'home', label: 'Home', path: '/', icon: Home },
                { id: 'post-job', label: 'Post a Job', path: '/vendor', icon: FileText },
                { id: 'my-jobs', label: 'Posted Jobs', path: '/profile?tab=posted', icon: ListChecks }
            ];
        }
        // Trainer or default
        return [
            { id: 'home', label: 'Home', path: '/', icon: Home },
            { id: 'jobs', label: 'Jobs', path: '/trainers', icon: Briefcase }
        ];
    };

    const navItems = getNavItems();

    return (
        <header className="sticky top-0 z-[100] w-full px-2 sm:px-4 pointer-events-none">
            <div 
                className="w-full pointer-events-auto rounded-full bg-black/65 backdrop-blur-2xl backdrop-saturate-150 border border-white/30 shadow-[0_16px_36px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.15),inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(255,255,255,0.25),inset_0_12px_24px_rgba(255,255,255,0.08)] flex items-center justify-between px-3 sm:px-6 h-16 sm:h-20 transition-all duration-300 relative" 
                ref={menuRef}
            >
                {/* iOS Glass Curved Sheen / Specular Light Reflection */}
                <div className="absolute -top-1 left-4 right-4 h-1/2 bg-gradient-to-b from-white/25 via-white/8 to-transparent rounded-t-full pointer-events-none blur-[0.5px]" />

                {/* Brand / Logo */}
                <Link 
                    to="/" 
                    className="relative z-10 flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/40 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6),inset_0_-1px_1px_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.3)] group transition-all duration-200 select-none flex-shrink-0"
                >
                    <img 
                        src="/logo-mark-white.png" 
                        alt="TF" 
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain group-hover:scale-105 transition-transform flex-shrink-0 drop-shadow" 
                    />
                    <div className="w-[1px] sm:w-[1.5px] h-4.5 sm:h-5 bg-white/40 rounded-full flex-shrink-0" />
                    <div className="flex items-baseline pr-1 drop-shadow-sm whitespace-nowrap">
                        <span className="text-[15px] sm:text-[17.5px] font-black tracking-tight text-white leading-none">TRAINER</span>
                        <span className="text-[10px] sm:text-[11.5px] font-bold tracking-normal text-white/85 ml-[2.5px]">FIRM</span>
                    </div>
                </Link>

                {/* Right Side: Navigation Items + Button */}
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                    
                    {/* Mobile Menu Button */}
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Primary Tabs with sliding pill - Desktop Only */}
                    <nav className="hidden md:flex items-center gap-1 md:gap-1.5 p-1 rounded-full bg-black/30 border border-white/25 backdrop-blur-xl shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.4)] relative">
                        {navItems.map((item) => {
                            const isActive = activeTab === item.id;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm transition-colors duration-200 select-none group ${
                                        isActive
                                            ? 'text-black font-bold'
                                            : 'text-neutral-300 hover:text-white font-medium'
                                    }`}
                                >
                                    {/* Sliding white pill background */}
                                    {isActive && (
                                        <motion.span
                                            layoutId="nav-pill"
                                            className="absolute inset-0 rounded-full bg-white shadow-[0_4px_20px_rgba(255,255,255,0.4),inset_0_1px_2px_rgba(255,255,255,1)] border border-white"
                                            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                        />
                                    )}
                                    <Icon className={`relative z-10 w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-black' : 'text-neutral-300 group-hover:text-white'}`} />
                                    <span className="relative z-10 tracking-tight">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Hard Turkey 58 Button: Login for guest, Dropdown trigger for Logged In User — Desktop only */}
                    <div className="hidden md:block">
                    {!user ? (
                        <Link
                            to="/auth?mode=login"
                            className="styled-button"
                            title="Login"
                        >
                            <span>Login</span>
                            <div className="inner-button">
                                <svg
                                    id="Arrow"
                                    viewBox="0 0 32 32"
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="18px"
                                    width="18px"
                                    className="icon"
                                >
                                    <defs>
                                        <linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="iconGradientGuest">
                                            <stop style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} offset="0%" />
                                            <stop style={{ stopColor: '#AAAAAA', stopOpacity: 1 }} offset="100%" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        fill="url(#iconGradientGuest)"
                                        d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z"
                                    />
                                </svg>
                            </div>
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setAccountMenuOpen((prev) => !prev)}
                            className="styled-button"
                            aria-expanded={accountMenuOpen}
                            title="Account Menu"
                        >
                            {user.profile_photo ? (
                                <img
                                    src={user.profile_photo}
                                    alt={user.name}
                                    className="w-5 h-5 rounded-full object-cover mr-1.5 ring-1 ring-white/50"
                                />
                            ) : null}
                            <span className="max-w-[70px] sm:max-w-[110px] truncate">
                                {user.name ? user.name.split(' ')[0] : 'Account'}
                            </span>
                            <div className="inner-button">
                                <svg
                                    id="Arrow"
                                    viewBox="0 0 32 32"
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="18px"
                                    width="18px"
                                    className={`icon transition-transform duration-300 ${accountMenuOpen ? 'rotate-90' : ''}`}
                                >
                                    <defs>
                                        <linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="iconGradientUser">
                                            <stop style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} offset="0%" />
                                            <stop style={{ stopColor: '#AAAAAA', stopOpacity: 1 }} offset="100%" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        fill="url(#iconGradientUser)"
                                        d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z"
                                    />
                                </svg>
                            </div>
                        </button>
                    )}
                    </div>
                </div>

                {/* ACCOUNT FLYOUT MENU: Only for logged-in users */}
                {accountMenuOpen && user && (
                    <div className="absolute right-3 sm:right-6 top-[calc(100%+0.65rem)] w-72 bg-neutral-950/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.15)] border border-white/20 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 text-white">
                        {/* User Header Info */}
                        <div className="px-4 py-3.5 bg-white/5 border-b border-white/10 flex items-center gap-3">
                            {user.profile_photo ? (
                                <img
                                    src={user.profile_photo}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-sm font-black shadow-xs">
                                    {user.name ? user.name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U'}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                                <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                                <span className="inline-block mt-0.5 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/20">
                                    {user.role}
                                </span>
                            </div>
                        </div>

                        {/* Floating menu: Profile + Logout only */}
                        <div className="p-2 space-y-1">
                            <Link
                                to="/profile?tab=profile"
                                onClick={() => setAccountMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 hover:text-white transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-neutral-300 group-hover:text-white group-hover:bg-white/20 transition-all flex-shrink-0">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-xs font-bold text-white">Profile</p>
                                    <p className="text-[10px] text-neutral-400">View and edit personal details</p>
                                </div>
                            </Link>

                            <div className="border-t border-white/10 my-1" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all font-semibold text-left group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-red-950/40 flex items-center justify-center text-red-400 group-hover:bg-red-900/50 transition-all flex-shrink-0">
                                    <LogOut className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-red-400">Logout</p>
                                    <p className="text-[10px] text-red-400/70">Sign out of your account</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* MOBILE FLYOUT MENU */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute left-3 right-3 top-[calc(100%+0.65rem)] bg-neutral-950/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.15)] border border-white/20 overflow-hidden z-[110] animate-in fade-in zoom-in-95 duration-150 p-2 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-white text-black shadow-sm' : 'text-neutral-300 hover:bg-white/10 hover:text-white'}`}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-bold text-sm tracking-wide">{item.label}</span>
                                </Link>
                            );
                        })}

                        <div className="border-t border-white/10 my-1" />

                        {!user ? (
                            <Link
                                to="/auth?mode=login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-all"
                            >
                                <User className="w-5 h-5 flex-shrink-0" />
                                <span className="font-bold text-sm tracking-wide">Login / Register</span>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/profile?tab=profile"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-300 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    <User className="w-5 h-5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm">{user.name?.split(' ')[0] || 'My Account'}</p>
                                        <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                                    </div>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all text-left"
                                >
                                    <LogOut className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-bold text-sm">Logout</span>
                                </button>
                            </>
                        )}

                    </div>
                )}

            </div>
        </header>
    );
}
