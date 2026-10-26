import axios from 'axios';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL || '',
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Erro na requisição')
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, Record<string, unknown>]) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];
    const res = await axiosInstance.get(url, { ...config });
    return res.data;
  } catch {
    // Se a chamada falhar ou API não estiver online localmente, retorna null para ativar o fallback gracioso
    return null;
  }
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
