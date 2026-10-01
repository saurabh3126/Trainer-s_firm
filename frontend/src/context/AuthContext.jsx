import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for an existing session on page load
        const storedUser = localStorage.getItem('venty_user');
        const token = localStorage.getItem('venty_token');
        
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
            // Automatically attach the token to all future Axios requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await axios.post('/api/auth/login', { email, password });
        if (res.data.success) {
            localStorage.setItem('venty_token', res.data.token);
            localStorage.setItem('venty_user', JSON.stringify(res.data.user));
            setUser(res.data.user);
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            return { success: true, role: res.data.user.role };
        }
    };

    const register = async (userData) => {
        const res = await axios.post('/api/auth/register', userData);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('venty_token');
        localStorage.removeItem('venty_user');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};