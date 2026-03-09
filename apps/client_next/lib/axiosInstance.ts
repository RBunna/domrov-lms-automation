import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: process.env.BACKEND_API_URL || 'http://localhost:3000',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        // Server-side: Token should be passed from API route headers
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const message =
            error?.response?.data?.message || error?.message || 'Unknown API error';
        return Promise.reject(new Error(message));
    }
);

export default axiosInstance;

/**
 * Helper to create axios instance with authorization header
 */
export function createAuthorizedAxios(token?: string) {
    const instance = axios.create({
        baseURL: process.env.BACKEND_API_URL || 'http://localhost:3000',
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    });

    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            const message =
                error?.response?.data?.message || error?.message || 'Unknown API error';
            return Promise.reject(new Error(message));
        }
    );

    return instance;
}
