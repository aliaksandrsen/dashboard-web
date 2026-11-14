import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.headers.post['Content-Type'] = 'application/json';

axios.interceptors.request.use((config) => {
  const authToken = localStorage.getItem('dashboard_web_auth');
  if (authToken) {
    config.headers.Authorization = authToken;
  }
  return config;
});
