import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = '/login';
      }
      return Promise.reject(error.response.data);
    } else if (error.request) {
      return Promise.reject({
        message: 'No response from server. Please check your internet connection.'
      });
    } else {
      return Promise.reject({
        message: 'Error setting up request. Please try again.'
      });
    }
  }
);

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (username, email, password, isAdmin = false) => 
    api.post('/api/auth/register', { username, email, password, isAdmin }),
  getCurrentUser: () => api.get('/api/auth/me'),
};

export const missionsAPI = {
  getAll: (page = 1) => api.get(`/api/missions?page=${page}`),
  getOne: (id) => api.get(`/api/missions/${id}`),
  create: (data) => api.post('/api/missions', data),
  update: (id, data) => api.put(`/api/missions/${id}`, data),
  delete: (id) => api.delete(`/api/missions/${id}`),
  complete: (id) => api.post(`/api/missions/${id}/complete`),
  addLog: (id, data) => api.post(`/api/missions/${id}/logs`, data),
  join: (id) => api.post(`/api/missions/${id}/join`),
  leave: (id) => api.post(`/api/missions/${id}/leave`),
  startTimer: (id) => api.post(`/api/missions/${id}/timer/start`),
  stopTimer: (id) => api.post(`/api/missions/${id}/timer/stop`),
  getTimer: (id) => api.get(`/api/missions/${id}/timer`),
  updateTimer: (id, seconds) => api.post(`/api/missions/${id}/timer`, { seconds }),
};

export default api; 