import axios from 'axios';

// Set the base URL for all API requests
const api = axios.create({
  // If environment has a base URL, use it, otherwise use the default domain
  baseURL: process.env.REACT_APP_API_URL || 'https://node21.cs.colman.ac.il',
  withCredentials: true, // This is crucial for sending cookies
});

// Request interceptor to handle content type
api.interceptors.request.use(
  (config) => {
    // Only set JSON content type if not a multipart/form-data
    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // If it's FormData, let Axios set the content type with boundary
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Try to refresh the token
        const refreshResponse = await axios.post('/auth/refresh', {}, { 
          withCredentials: true // Important for cookies
        });
        
        // Only proceed if refresh was successful
        if (refreshResponse.status === 200) {
          // Retry the original request
          return api(originalRequest);
        } else {
          // If refresh doesn't return 200, clear user data and redirect
          localStorage.removeItem('user_id');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('Refresh token error:', refreshError);
        // If refresh fails, clear user data and redirect
        localStorage.removeItem('user_id');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api; 