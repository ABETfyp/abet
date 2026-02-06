export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(options.headers || {})
    },
    ...options
  });
  
  const data = await response.json().catch(() => null);
  
  if (!response.ok) {
    // Handle token expiration
    if (response.status === 401 && token) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return;
    }
    
    const message = data?.detail || data?.message || 'Request failed';
    throw new Error(message);
  }
  
  return data;
};
