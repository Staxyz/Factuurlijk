const DEFAULT_API_BASE_URL = 'http://localhost:3001';

const sanitizeUrl = (url: string) => url.replace(/\/$/, '');

const inferApiBaseUrl = () => {
  const envUrl = (import.meta as any)?.env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return sanitizeUrl(envUrl.trim());
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const { origin, hostname } = window.location;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocalhost) {
      return sanitizeUrl(origin);
    }
  }

  return DEFAULT_API_BASE_URL;
};

export const API_BASE_URL = inferApiBaseUrl();

export const buildApiUrl = (path: string) => {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }
  return `${API_BASE_URL}${path}`;
};








