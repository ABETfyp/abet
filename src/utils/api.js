const rawApiBase = import.meta.env.VITE_API_BASE_URL || '/api';
export const API_BASE = rawApiBase.replace(/\/$/, '');

export const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem('accessToken');
  const { headers: customHeaders = {}, ...restOptions } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...customHeaders,
    },
    ...restOptions,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return;
    }

    let message = data?.detail || data?.message;
    if (!message && data && typeof data === 'object') {
      const firstField = Object.keys(data)[0];
      const firstError = firstField ? data[firstField] : null;
      if (Array.isArray(firstError) && firstError.length > 0) {
        message = `${firstField}: ${firstError[0]}`;
      } else if (typeof firstError === 'string') {
        message = `${firstField}: ${firstError}`;
      }
    }

    if (!message) {
      message = `Request failed (${response.status})`;
    }

    throw new Error(message);
  }

  return data;
};
