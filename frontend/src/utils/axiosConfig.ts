import axios from 'axios';

// Custom event for session expiry - same as in store/api.ts
export const SESSION_EXPIRED_EVENT = 'session-expired';

// Get the current host for LAN access - always use the same hostname as frontend
const getBaseURL = () => {
  // Use the same hostname that the user is accessing the frontend from
  // This ensures LAN users connect to the correct server
  return `http://${window.location.hostname}:5000`;
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
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

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Dispatch session expired event so SessionTimeoutModal can handle it
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
