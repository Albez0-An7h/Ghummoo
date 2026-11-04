import axios from 'axios';

const raw = import.meta.env.VITE_API_URL || '';
const baseURL = raw ? `${raw.replace(/\/+$/, '')}/api` : '/api';

const api = axios.create({ baseURL, withCredentials: true, timeout: 90000 });

api.interceptors.response.use(
  (res) => (res.data && typeof res.data === 'object' && 'data' in res.data ? res.data.data : res.data),
  (err) => {
    const e = new Error(err.response?.data?.message || (err.code === 'ECONNABORTED' ? 'The request timed out' : 'Could not reach the server'));
    e.status = err.response?.status;
    e.code = err.response?.data?.code || err.response?.data?.details?.code;
    e.details = err.response?.data?.details;
    return Promise.reject(e);
  }
);

export default api;
