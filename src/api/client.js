import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Base URL untuk HRIS backend
// Ganti dengan URL production jika sudah di-deploy
const API_BASE_URL = 'http://10.228.145.235:3000'; // USB tethering IP

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token storage key
const TOKEN_KEY = 'session_token';

// Store token
export const storeToken = async (token) => {
    try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
        console.error('Error storing token:', error);
    }
};

// Get token
export const getToken = async () => {
    try {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};

// Remove token
export const removeToken = async () => {
    try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('Error removing token:', error);
    }
};

// Request interceptor - add token to headers
api.interceptors.request.use(
    async (config) => {
        const token = await getToken();
        if (token) {
            config.headers.Cookie = `session=${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle session token from cookies
api.interceptors.response.use(
    (response) => {
        // Extract session cookie from response if present
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
            const sessionCookie = setCookie.find(cookie => cookie.startsWith('session='));
            if (sessionCookie) {
                const token = sessionCookie.split(';')[0].replace('session=', '');
                storeToken(token);
            }
        }
        return response;
    },
    (error) => {
        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401) {
            removeToken();
        }
        return Promise.reject(error);
    }
);

// API functions
export const authAPI = {
    login: (identifier, password) =>
        api.post('/api/auth/login', { identifier, password }),

    getMe: () =>
        api.get('/api/auth/me'),

    logout: () =>
        api.post('/api/auth/logout'),
};

export const attendanceAPI = {
    clockIn: (formData) =>
        api.post('/api/attendance/clock-in', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    clockOut: (formData) =>
        api.post('/api/attendance/clock-out', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    getToday: (date) =>
        api.get('/api/attendance/today', { params: { date } }),

    getStatus: () =>
        api.get('/api/attendance/status'),
};

export const employeeAPI = {
    getMySchedule: (date) =>
        api.get('/api/employee/my-schedule', { params: { date } }),

    getMonthlyStats: () =>
        api.get('/api/employee/monthly-stats'),
};

export const shiftAPI = {
    getAll: () =>
        api.get('/api/shifts'),
};

export { API_BASE_URL };
export default api;
