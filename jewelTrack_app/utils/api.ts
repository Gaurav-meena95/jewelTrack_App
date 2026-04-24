import axios from 'axios';
import { getToken, saveToken, clearTokens } from './auth';
import { router } from 'expo-router';

// export const BASE_URL = 'http://10.7.30.220:3000/api';
export const BASE_URL = 'http://192.168.1.31:3000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const { accessToken, refreshToken } = await getToken();
    if (accessToken) config.headers['Authorization'] = `JWT ${accessToken}`;
    if (refreshToken) config.headers['x-refresh-token'] = refreshToken;
    return config;
}, (error: any) => {
    return Promise.reject(error);
});

let sessionExpired = false;
let isRefreshing = false;

api.interceptors.response.use(async (response) => {
    const newAccessToken = response.headers['x-access-token'];
    const newRefreshToken = response.headers['x-refresh-token'];
    if (newAccessToken || newRefreshToken) {
        await saveToken(newAccessToken, newRefreshToken);
    }
    return response;
}, async (error: any) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !sessionExpired) {
        originalRequest._retry = true;

        if (isRefreshing) return Promise.reject(error);
        isRefreshing = true;

        try {
            const { refreshToken } = await getToken();
            if (!refreshToken) throw new Error('No refresh token');

            const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
                headers: { 'x-refresh-token': refreshToken }
            });

            const newAccess = refreshRes.headers['x-access-token'];
            const newRefresh = refreshRes.headers['x-refresh-token'];
            await saveToken(newAccess, newRefresh);

            originalRequest.headers['Authorization'] = `JWT ${newAccess}`;
            isRefreshing = false;
            return api(originalRequest);
        } catch (refreshError) {
            isRefreshing = false;
            sessionExpired = true;
            console.log('Session fully expired — clearing tokens, go to login');
            await clearTokens();
            router.replace('/login');
            setTimeout(() => { sessionExpired = false; }, 5000);
            return Promise.reject(refreshError);
        }
    }

    return Promise.reject(error);
});

export default api;


