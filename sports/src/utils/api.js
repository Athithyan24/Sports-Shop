import axios from 'axios';

// Prefer explicit env variable `VITE_API_URL`, otherwise build a URL
// using the current host so the frontend works when opened from other devices.
const apiBase = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '') + '/api'
  : `http://${window.location.hostname}:5000/api`;

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;