// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

const GET_CACHE_TTL_MS = 10_000;
const getCache = new Map();
const pendingGets = new Map();

const buildRequestKey = (url, config = {}) => {
  const params = config.params ? JSON.stringify(config.params) : '';
  const token = localStorage.getItem('token') || '';
  return `${token}:${url}?${params}`;
};

const canCacheGet = (config = {}) =>
  config.cache !== false && !config.responseType && !config.signal;

const clearGetCache = () => {
  getCache.clear();
  pendingGets.clear();
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    if (status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('cte_user');
      clearGetCache();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

const originalGet = api.get.bind(api);

api.get = (url, config = {}) => {
  if (!canCacheGet(config)) {
    return originalGet(url, config);
  }

  const key = buildRequestKey(url, config);
  const cached = getCache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < GET_CACHE_TTL_MS) {
    return Promise.resolve(cached.response);
  }

  if (pendingGets.has(key)) {
    return pendingGets.get(key);
  }

  const request = originalGet(url, config)
    .then((response) => {
      getCache.set(key, { response, timestamp: Date.now() });
      return response;
    })
    .finally(() => {
      pendingGets.delete(key);
    });

  pendingGets.set(key, request);
  return request;
};

['post', 'put', 'patch', 'delete'].forEach((method) => {
  const originalMethod = api[method].bind(api);
  api[method] = (...args) =>
    originalMethod(...args).then((response) => {
      clearGetCache();
      return response;
    });
});

export default api;
