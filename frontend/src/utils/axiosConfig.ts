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

// Sliding session - extend token when user is active
const SESSION_EXTEND_INTERVAL = 30 * 60 * 1000; // 30 minutes
let lastExtendTime = Date.now();
let isExtending = false;

const extendSession = async () => {
  if (isExtending) return;
  
  const token = localStorage.getItem('token');
  if (!token) return;
  
  const now = Date.now();
  // Only extend if 30 minutes have passed since last extend
  if (now - lastExtendTime < SESSION_EXTEND_INTERVAL) return;
  
  try {
    isExtending = true;
    const response = await axios.post(
      `${getBaseURL()}/api/auth/extend-session`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      lastExtendTime = now;
      console.log('Session extended successfully');
    }
  } catch (error) {
    // If extend fails, don't worry - user will be prompted to login when token expires
    console.log('Session extend failed, will retry on next activity');
  } finally {
    isExtending = false;
  }
};

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Try to extend session on each request (throttled)
      extendSession();
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
