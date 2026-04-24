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

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token!);
    });
    failedQueue = [];
};

api.interceptors.response.use(async (response) => {
    // Persist any rotated tokens the backend sends back
    const newAccessToken = response.headers['x-access-token'];
    const newRefreshToken = response.headers['x-refresh-token'];
    if (newAccessToken || newRefreshToken) {
        await saveToken(newAccessToken, newRefreshToken);
    }
    return response;
}, async (error: any) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
            // Queue this request until the in-progress refresh completes
            return new Promise<string>((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(token => {
                originalRequest.headers['Authorization'] = `JWT ${token}`;
                return api(originalRequest);
            }).catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const { refreshToken } = await getToken();
            if (!refreshToken) throw new Error('No refresh token available');

            const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
                headers: { 'x-refresh-token': refreshToken }
            });

            const newAccess = refreshRes.headers['x-access-token'];
            const newRefresh = refreshRes.headers['x-refresh-token'];
            await saveToken(newAccess, newRefresh);

            originalRequest.headers['Authorization'] = `JWT ${newAccess}`;
            processQueue(null, newAccess);
            isRefreshing = false;
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;
            console.log('[API] Session expired — clearing tokens, redirecting to login');
            await clearTokens();
            router.replace('/login');
            return Promise.reject(refreshError);
        }
    }

    return Promise.reject(error);
});

export default api;
