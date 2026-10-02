import { useRef, useState } from 'react';
import Preloader from './components/Preloader.jsx';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';
import LandingPage from './components/LandingPage.jsx';
import MoltenMetal from './components/MoltenMetal.jsx';
import FloatingNavbar from './components/FloatingNavbar.jsx';
import VendorDashboard from './components/VendorDashboard.jsx';
import TrainerBoard from './components/TrainerBoard.jsx';
import AuthPage from './components/AuthPage.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import GradualBlur from './components/GradualBlur.jsx';
import PolicyPage from './components/PolicyPage.jsx';
import TermsOfService from './components/TermsOfService.jsx';
import Guidelines from './components/Guidelines.jsx';

// Page wrapper with fade + slight upward slide on enter
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
    style={{ width: '100%' }}
    className="flex-1 flex flex-col min-h-0"
  >
    {children}
  </motion.div>
);

// Shared footer used on all pages except /auth
function SiteFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 pt-5 sm:pt-12 pb-4 sm:pb-6 text-slate-600 relative z-[100] flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8 mb-5 sm:mb-8">

          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1 flex flex-col">
            <div className="flex items-center gap-2.5 mb-2 sm:mb-3">
              <img src="/logo-mark.png" alt="TF" className="w-6 sm:w-7 h-auto object-contain flex-shrink-0" />
              <div className="w-[1px] h-5 bg-slate-300 rounded-full flex-shrink-0" />
              <div className="flex items-baseline pr-1 whitespace-nowrap">
                <span className="text-[15px] sm:text-[16px] font-black tracking-tight text-slate-900 leading-none">TRAINER</span>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-normal text-slate-600 ml-[2.5px]">FIRM</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 hidden sm:block">
              The reliable operating system for connecting corporate vendors with verified technical trainers.
            </p>
          </div>

          <div>
            <h4 className="text-black font-bold mb-2 sm:mb-3 uppercase tracking-wider text-[10px] sm:text-xs">Platform</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs">
              <li><Link to="/trainers" className="hover:text-black transition-colors">Find Trainer Jobs</Link></li>
              <li><Link to="/vendor" className="hover:text-black transition-colors">Vendor Dashboard</Link></li>
              <li><Link to="/auth?mode=register" className="hover:text-black transition-colors">Create Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-black font-bold mb-2 sm:mb-3 uppercase tracking-wider text-[10px] sm:text-xs">Legal</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs">
              <li><Link to="/terms" className="hover:text-black transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link></li>
              <li><Link to="/guidelines" className="hover:text-black transition-colors">Guidelines</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-black font-bold mb-2 sm:mb-3 uppercase tracking-wider text-[10px] sm:text-xs">Contact</h4>
            <ul className="space-y-1.5 sm:space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 mt-0.5 text-slate-800 flex-shrink-0" />
                <a href="mailto:trainerfirm@outlook.com" className="hover:text-black transition-colors break-all">trainerfirm@outlook.com</a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 mt-0.5 text-slate-800 flex-shrink-0" />
                <span className="text-slate-500">+91 70816 68450</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-4 sm:pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] sm:text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Trainer Firm. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function AppLayout() {
  const location = useLocation();
  const isAuth = location.pathname === '/auth';

  return (
    <div className="min-h-screen bg-transparent font-sans text-zinc-900 flex flex-col relative">
            {!isAuth && <FloatingNavbar />}
      <main className="flex-grow overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Landing Page */}
            <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />

            {/* Trainer Routes */}
            <Route path="/trainers"   element={<PageTransition><TrainerBoard /></PageTransition>} />
            <Route path="/trainer"    element={<PageTransition><TrainerBoard /></PageTransition>} />
            <Route path="/jobs"       element={<PageTransition><TrainerBoard /></PageTransition>} />
            <Route path="/job/:jobId" element={<PageTransition><TrainerBoard /></PageTransition>} />

            {/* Vendor Routes */}
            <Route path="/vendor"  element={<PageTransition><VendorDashboard /></PageTransition>} />
            <Route path="/vendors" element={<PageTransition><VendorDashboard /></PageTransition>} />

            {/* Account & Administration Routes */}
            <Route path="/auth"    element={<PageTransition><AuthPage /></PageTransition>} />
            <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
            <Route path="/admin"   element={<PageTransition><AdminDashboard /></PageTransition>} />
            
            {/* Legal Routes */}
            <Route path="/privacy" element={<PageTransition><PolicyPage /></PageTransition>} />
            <Route path="/terms"   element={<PageTransition><TermsOfService /></PageTransition>} />
          <Route path="/guidelines" element={<PageTransition><Guidelines /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Global footer (all pages except /auth) */}
      {!isAuth && (
        <>
          {location.pathname === '/' && (
            <GradualBlur 
              preset="page-footer" 
              zIndex={-50}
            />
          )}
          <div>
            <SiteFooter />
          </div>
        </>
      )}
    </div>
  );
}

function App() {
  const [ready, setReady] = useState(false);

  return (
    <BrowserRouter>
      {/* Always-on background — visible even during preloader */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <MoltenMetal
          color1="#ffffff"
          color2="#e4e4e7"
          color3="#d4d4d8"
          backgroundColor="#f5f5f5"
          lightMode={true}
          opacity={0.8}
        />
      </div>
      {!ready && <Preloader onComplete={() => setReady(true)} />}
      <div style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <AppLayout />
      </div>
    </BrowserRouter>
  );
}

export default App;