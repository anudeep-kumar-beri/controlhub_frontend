// Centralized API configuration
const API_CONFIG = {
  development: 'http://localhost:5000/api',
  production: 'https://controlhub-backend.onrender.com/api'
};

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? API_CONFIG.production 
  : API_CONFIG.development;

export default API_BASE_URL;