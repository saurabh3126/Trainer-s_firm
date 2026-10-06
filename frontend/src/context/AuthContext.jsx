import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check both storages for an existing session on page load
        const storedUser = localStorage.getItem('venty_user') || sessionStorage.getItem('venty_user');
        const token = localStorage.getItem('venty_token') || sessionStorage.getItem('venty_token');
        
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (email, password, rememberMe = true) => {
        const res = await axios.post('/api/auth/login', { email, password });
        if (res.data.success) {
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('venty_token', res.data.token);
            storage.setItem('venty_user', JSON.stringify(res.data.user));
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
        sessionStorage.removeItem('venty_token');
        sessionStorage.removeItem('venty_user');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
