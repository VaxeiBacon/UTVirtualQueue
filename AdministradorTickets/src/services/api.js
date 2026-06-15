import axios from 'axios';

// Detecta automáticamente si estás en local o en producción en el VPS
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003/api';
console.log("URL de la API configurada:", import.meta.env.VITE_API_URL);

const api = axios.create({
    baseURL: API_URL,
});

// Este interceptor inyecta el token en CADA petición que haga cualquier interfaz
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;