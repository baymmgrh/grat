import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/redux';
import { setCredentials } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error
      const error = searchParams.get('error');
      if (error) {
        setStatus('error');
        toast.error(`Login failed: ${error}`);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Get tokens from URL
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const userId = searchParams.get('user_id');
      const username = searchParams.get('username');
      const email = searchParams.get('email');
      const fullName = searchParams.get('full_name');
      const isNew = searchParams.get('is_new') === 'true';

      if (!accessToken || !refreshToken) {
        setStatus('error');
        toast.error('Invalid OAuth response');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Store tokens
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      setStatus('success');

      // If new user, redirect to complete profile page
      if (isNew) {
        toast.success(`Akun berhasil dibuat! Silakan lengkapi profil Anda.`);
        // Pass all params to complete profile page
        const params = new URLSearchParams({
          access_token: accessToken,
          refresh_token: refreshToken,
          user_id: userId || '',
          username: username || '',
          email: email || '',
          full_name: fullName || ''
        });
        setTimeout(() => navigate(`/complete-profile?${params.toString()}`), 1000);
        return;
      }

      // Existing user - update Redux and go to dashboard
      dispatch(setCredentials({
        user: {
          id: parseInt(userId || '0'),
          username: username || '',
          email: email || '',
          full_name: fullName || '',
          is_admin: false,
          is_super_admin: false,
          roles: []
        },
        token: accessToken
      }));

      // Reset session tracking for new login
      localStorage.setItem('session_start_time', Date.now().toString());
      localStorage.setItem('last_activity_time', Date.now().toString());

      toast.success(`Selamat datang kembali, ${fullName}!`);
      setTimeout(() => navigate('/app'), 1000);
    };

    handleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Signing you in...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-green-400 text-6xl mb-4">✓</div>
            <p className="text-white text-lg">Login successful! Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-400 text-6xl mb-4">✗</div>
            <p className="text-white text-lg">Login failed. Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
}
