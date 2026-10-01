import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar'; // NEW: Import the Navbar
// ... your other imports (AuthPage, ProfilePage, AdminDashboard, etc.)

function App() {
    return (
        <Router>
            {/* The Navbar goes inside the Router, but OUTSIDE the Routes! */}
            <Navbar /> 
            
            <Routes>
                <Route path="/" element={<HomePage />} /> {/* Assuming you have a home page */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
        </Router>
    );
}

export default App;