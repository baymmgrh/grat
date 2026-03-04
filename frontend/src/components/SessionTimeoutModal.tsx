import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import { RootState } from '../store';
import { SESSION_EXPIRED_EVENT } from '../store/api';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

// Public routes that should NOT trigger session handling
const PUBLIC_ROUTES = ['/absensi', '/', '/login', '/register'];

// Check if current path is public (no hooks needed)
const isPublicPath = () => {
  const path = window.location.pathname;
  return PUBLIC_ROUTES.some(route => path === route || path.startsWith('/tv/'));
};

// Session timeout configuration (in milliseconds)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000; // Show warning 5 minutes before timeout
const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds
const SESSION_START_KEY = 'session_start_time'; // Key for storing session start time

interface SessionTimeoutModalProps {
  onExtendSession?: () => void;
}

export default function SessionTimeoutModal({ onExtendSession }: SessionTimeoutModalProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  
  const [showWarning, setShowWarning] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [remainingTime, setRemainingTime] = useState(WARNING_BEFORE_TIMEOUT);
  const [isExtending, setIsExtending] = useState(false);
  const [isSessionInitialized, setIsSessionInitialized] = useState(false);
  
  const lastActivityRef = useRef<number>(Date.now());
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session tracking
  // IMPORTANT: Never show expired modal on initial page load
  // Session tracking only starts AFTER user has been active for a while
  useEffect(() => {
    if (isAuthenticated && token) {
      // Always reset everything on page load/refresh
      // This ensures modal NEVER shows on first access
      const now = Date.now();
      localStorage.setItem(SESSION_START_KEY, now.toString());
      localStorage.setItem('last_activity_time', now.toString());
      lastActivityRef.current = now;
      
      // Clear any expired/warning state
      setShowExpired(false);
      setShowWarning(false);
      
      // Delay session initialization to prevent immediate checks
      // This gives time for the page to fully load
      const initTimer = setTimeout(() => {
        setIsSessionInitialized(true);
      }, 5000); // Wait 5 seconds before starting session monitoring
      
      return () => clearTimeout(initTimer);
    } else {
      // Not authenticated - clear session data
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem('last_activity_time');
      setIsSessionInitialized(false);
      setShowExpired(false);
      setShowWarning(false);
    }
  }, [isAuthenticated, token]);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    // Store in localStorage for persistence across page refreshes
    localStorage.setItem('last_activity_time', now.toString());
    // If warning is showing and user is active, hide it
    if (showWarning && !showExpired) {
      setShowWarning(false);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    }
  }, [showWarning, showExpired]);

  // Listen for user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [isAuthenticated, updateActivity]);

  // Listen for 401 errors from API calls
  // Show notification and redirect to login
  useEffect(() => {
    const handleSessionExpired = () => {
      // Skip session handling on public routes
      if (isPublicPath()) {
        console.log('On public route, skipping session expired handling');
        return;
      }
      
      if (isSessionInitialized) {
        // User was active - show modal
        setShowWarning(false);
        setShowExpired(true);
      } else {
        // Initial load with expired token - clear auth and redirect to login
        console.log('Session expired on initial load, redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem(SESSION_START_KEY);
        localStorage.removeItem('last_activity_time');
        
        // Dispatch logout and redirect to login (session expired)
        dispatch(logout());
        navigate('/login', { 
          replace: true,
          state: { message: 'Sesi Anda telah berakhir. Silakan login kembali.' }
        });
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [isSessionInitialized, dispatch, navigate]);

  // Check session timeout - only after session is initialized
  useEffect(() => {
    // Don't check until session is properly initialized
    // Also skip on public routes
    if (!isAuthenticated || !token || !isSessionInitialized || isPublicPath()) return;

    const checkSession = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      const timeUntilTimeout = SESSION_TIMEOUT - timeSinceActivity;

      if (timeUntilTimeout <= 0) {
        // Session expired due to inactivity
        setShowWarning(false);
        setShowExpired(true);
      } else if (timeUntilTimeout <= WARNING_BEFORE_TIMEOUT && !showWarning && !showExpired) {
        // Show warning
        setShowWarning(true);
        setRemainingTime(timeUntilTimeout);
        
        // Start countdown
        countdownRef.current = setInterval(() => {
          setRemainingTime(prev => {
            const newTime = prev - 1000;
            if (newTime <= 0) {
              setShowWarning(false);
              setShowExpired(true);
              if (countdownRef.current) {
                clearInterval(countdownRef.current);
              }
              return 0;
            }
            return newTime;
          });
        }, 1000);
      }
    };

    // Don't do initial check immediately - wait a bit to allow activity tracking to start
    const initialCheckTimeout = setTimeout(checkSession, 1000);

    // Set up interval
    warningTimerRef.current = setInterval(checkSession, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialCheckTimeout);
      if (warningTimerRef.current) {
        clearInterval(warningTimerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isAuthenticated, token, isSessionInitialized, showWarning, showExpired]);

  // Handle extend session
  const handleExtendSession = async () => {
    setIsExtending(true);
    
    try {
      // Call extend-session endpoint
      const response = await fetch(`http://${window.location.hostname}:5000/api/auth/extend-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update token in localStorage
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
        }
        
        // Reset activity and hide modal
        const now = Date.now();
        lastActivityRef.current = now;
        localStorage.setItem('last_activity_time', now.toString());
        setShowWarning(false);
        setShowExpired(false);
        setRemainingTime(WARNING_BEFORE_TIMEOUT);
        
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
        
        if (onExtendSession) {
          onExtendSession();
        }
      } else {
        // Token refresh failed, show expired
        setShowWarning(false);
        setShowExpired(true);
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
      // On error, just reset the timer (user is still active)
      const now = Date.now();
      lastActivityRef.current = now;
      localStorage.setItem('last_activity_time', now.toString());
      setShowWarning(false);
      setRemainingTime(WARNING_BEFORE_TIMEOUT);
    } finally {
      setIsExtending(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    // Clear session tracking data
    localStorage.removeItem(SESSION_START_KEY);
    localStorage.removeItem('last_activity_time');
    dispatch(logout());
    setShowWarning(false);
    setShowExpired(false);
    setIsSessionInitialized(false);
    navigate('/login');
  };

  // Format remaining time
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Don't render anything on public routes
  if (isPublicPath()) return null;
  
  if (!showWarning && !showExpired) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className={`px-6 py-4 ${showExpired ? 'bg-red-500' : 'bg-orange-500'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              {showExpired ? (
                <ExclamationTriangleIcon className="h-6 w-6 text-white" />
              ) : (
                <ClockIcon className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {showExpired ? 'Sesi Login Berakhir' : 'Sesi Akan Berakhir'}
              </h3>
              <p className="text-sm text-white/80">
                {showExpired ? 'Silakan login kembali' : 'Aktivitas tidak terdeteksi'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {showExpired ? (
            <>
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExclamationTriangleIcon className="h-10 w-10 text-red-500" />
                </div>
                <p className="text-gray-600">
                  Sesi login Anda telah berakhir karena tidak ada aktivitas dalam waktu yang lama.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Untuk keamanan, silakan login kembali untuk melanjutkan.
                </p>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Login Kembali
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <ClockIcon className="h-10 w-10 text-orange-500" />
                  <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {formatTime(remainingTime)}
                  </div>
                </div>
                <p className="text-gray-600">
                  Sesi login Anda akan berakhir dalam <span className="font-bold text-orange-600">{formatTime(remainingTime)}</span>
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Apakah Anda ingin tetap login?
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(remainingTime / WARNING_BEFORE_TIMEOUT) * 100}%` }}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  Logout
                </button>
                <button
                  onClick={handleExtendSession}
                  disabled={isExtending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                >
                  {isExtending ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-5 w-5" />
                      Ya, Tetap Login
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-gray-50 border-t">
          <p className="text-xs text-gray-500 text-center">
            💡 Tips: Sesi akan otomatis diperpanjang selama ada aktivitas di aplikasi
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook to detect 401 errors and show session expired
export function useSessionExpiredHandler() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sessionExpired, setSessionExpired] = useState(false);

  const handleSessionExpired = useCallback(() => {
    setSessionExpired(true);
  }, []);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    setSessionExpired(false);
    navigate('/login');
  }, [dispatch, navigate]);

  return { sessionExpired, handleSessionExpired, handleLogout, setSessionExpired };
}
