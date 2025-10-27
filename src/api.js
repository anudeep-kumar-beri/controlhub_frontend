import axios from 'axios';
import API_BASE_URL from './config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ...interceptors if any...

export default api;
