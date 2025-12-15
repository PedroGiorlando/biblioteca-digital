// frontend/src/services/api.ts
import axios from 'axios';

// Creamos una instancia de Axios
const api = axios.create({
  // Esta es la URL de tu backend
  baseURL: 'http://localhost:3000/api',
});

export default api;