// Custom event for session expiry
export const SESSION_EXPIRED_EVENT = 'session-expired';

// Get the current host for LAN access
const getBaseURL = () => {
  return `http://${window.location.hostname}:5000`;
};

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Fetch wrapper that handles authentication and session expiry
 * Use this instead of native fetch for API calls
 */
export async function fetchWithAuth(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, headers: customHeaders, ...restOptions } = options;
  
  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  
  // Add auth token if not skipped
  if (!skipAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }
  
  // Make the request
  const response = await fetch(url, {
    ...restOptions,
    headers,
  });
  
  // Handle 401 - Session expired
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
  
  return response;
}

/**
 * Helper to build full API URL
 */
export function apiUrl(path: string): string {
  const base = getBaseURL();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export default fetchWithAuth;
