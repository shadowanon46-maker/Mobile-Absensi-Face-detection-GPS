import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getToken, removeToken } from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing session on app launch
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            setIsLoading(true);
            const token = await getToken();

            if (token) {
                // Try to get user data with existing token
                const response = await authAPI.getMe();
                if (response.data?.user) {
                    setUser(response.data.user);
                }
            }
        } catch (err) {
            console.log('No valid session found');
            await removeToken();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (identifier, password) => {
        try {
            setError(null);
            setIsLoading(true);

            const response = await authAPI.login(identifier, password);

            if (response.data?.user) {
                // Fetch complete user data including shift info
                const meResponse = await authAPI.getMe();
                setUser(meResponse.data?.user || response.data.user);
                return { success: true };
            }

            return { success: false, error: 'Login gagal' };
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Terjadi kesalahan saat login';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (err) {
            console.log('Logout error:', err);
        } finally {
            await removeToken();
            setUser(null);
        }
    };

    const refreshUser = async () => {
        try {
            const response = await authAPI.getMe();
            if (response.data?.user) {
                setUser(response.data.user);
            }
        } catch (err) {
            console.error('Error refreshing user:', err);
        }
    };

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        logout,
        refreshUser,
        checkAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
