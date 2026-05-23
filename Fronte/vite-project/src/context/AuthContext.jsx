import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuthStatus = async () => {
        try {
            const response = await api.get('/auth/me');

            if (response.status === 200) {
                const userData = response.data;
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Lỗi kiểm tra trạng thái đăng nhập:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = async (userData) => {
        // Backend handles cookie setting, we just need to re-fetch the user details
        // Or directly set it if the login response returns user info
        await checkAuthStatus();
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
            localStorage.removeItem('token'); // Xóa token khi đăng xuất
            setUser(null);
        } catch (error) {
            console.error("Lỗi khi đăng xuất:", error);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuthStatus }}>
            {children}
        </AuthContext.Provider>
    );
};
