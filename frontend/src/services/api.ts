import axios from 'axios';

const api = axios.create({
    baseURL: 'https://biblioteca-digital-fi5y.onrender.com/api',
});

export default api;