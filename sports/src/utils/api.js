import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '') + '/api'
  : `http://${window.location.hostname}:5000/api`;

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add this interceptor to inject the token into every request
api.interceptors.request.use(
  (config) => {
    // Assuming you saved the token to localStorage during login
    const token = localStorage.getItem('token'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;