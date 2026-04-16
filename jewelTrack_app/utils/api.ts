import axios from 'axios';
import { getToken, saveToken } from './auth';

export const BASE_URL = 'http://10.7.30.220:3000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',

    },
})




api.interceptors.request.use(async (config) => {
    const { accessToken, refreshToken } = await getToken();

    if (accessToken) {
        config.headers['Authorization'] = `JWT ${accessToken}`;
    }

    if (refreshToken) {
        config.headers['x-refresh-token'] = refreshToken;
    }

    return config;
}, (error: any) => {
    return Promise.reject(error);
});

api.interceptors.response.use(async (response) => {
    const newAccessToken = response.headers['x-access-token'];
    const newRefreshToken = response.headers['x-refresh-token'];
    if (newAccessToken && newRefreshToken) {
        await saveToken(newAccessToken, newRefreshToken);
    }
    return response;
}, (error: any) => {
    return Promise.reject(error);
});

export default api;
