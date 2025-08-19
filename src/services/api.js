import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for auth tokens
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized API endpoints
export const CombatAPI = {
  // Character endpoints
  createCharacter: (data) => api.post('/characters', data),
  getCharacter: (id) => api.get(`/characters/${id}`),
  updateCharacter: (id, data) => api.put(`/characters/${id}`, data),

  // Combat endpoints
  initiateCombat: (data) => api.post('/combat', data),
  resolveClash: (data) => api.post('/combat/resolve', data),
  
  // Image upload
  uploadImage: (formData) => api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
};

// Error handling middleware
export const handleApiError = (error) => {
  if (error.response) {
    console.error('API Error:', error.response.data);
    throw new Error(error.response.data.message || 'API request failed');
  } else {
    console.error('Network Error:', error.message);
    throw new Error('Network connection failed');
  }
};