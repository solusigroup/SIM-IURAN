import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load user dari localStorage saat init
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('auth_token');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            setError(null);
            const response = await authApi.login(username, password);

            if (response.success) {
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setUser(response.data.user);
                return { success: true };
            } else {
                setError(response.message);
                return { success: false, message: response.message };
            }
        } catch (err) {
            const message = err.message || 'Login gagal';
            setError(message);
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (e) {
            // Ignore logout errors
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const isAdmin = user?.role === 'admin';
    const isLoggedIn = !!user;

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            error,
            login,
            logout,
            isAdmin,
            isLoggedIn,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
