import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL || CONFIG.serverUrl,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || error.message || 'Erro na requisição')
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, Record<string, unknown>]) => {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await axiosInstance.get(url, { ...config });
  return res.data;
};

// ----------------------------------------------------------------------

export const endpoints = {
  platform: {
    treasury: {
      root: '/api/treasury',
      analytics: '/api/treasury/analytics',
      transactions: '/api/treasury/transactions',
    },
    identity: {
      citizens: '/api/identity/citizens',
    },
  },
};
