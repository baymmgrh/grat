import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/redux'
import { login } from '../../store/slices/authSlice'
import axiosInstance from '../../utils/axiosConfig'
import toast from 'react-hot-toast'
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  LockClosedIcon,
  ArrowRightIcon,
  CubeIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [companyName, setCompanyName] = useState('ERP System')
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [sessionMessage, setSessionMessage] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  // Check for session expired message from redirect
  useEffect(() => {
    const state = location.state as { message?: string } | null
    if (state?.message) {
      setSessionMessage(state.message)
      toast.error(state.message, { duration: 5000 })
      // Clear the state so message doesn't show again on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location])

  useEffect(() => {
    loadCompanySettings()
    checkGoogleOAuth()
  }, [])

  const loadCompanySettings = async () => {
    try {
      const response = await axiosInstance.get('/api/settings/company/public')
      if (response.data && response.data.name) {
        setCompanyName(response.data.name)
      }
    } catch (error) {
      console.error('Error loading company settings:', error)
    }
  }

  const checkGoogleOAuth = async () => {
    try {
      const response = await axiosInstance.get('/api/auth/google/url')
      setGoogleEnabled(!!response.data.url)
    } catch (error) {
      console.error('Error checking Google OAuth:', error)
      setGoogleEnabled(false)
    }
  }

  const handleGoogleLogin = async () => {
    const hostname = window.location.hostname
    const isPrivateIP = hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')
    
    // Google OAuth tidak mendukung private IP
    if (isPrivateIP) {
      toast.error('Login Google hanya tersedia di production. Silakan login dengan username/password.')
      return
    }
    
    setGoogleLoading(true)
    
    try {
      // Get Google OAuth URL from backend
      const response = await axiosInstance.get('/api/auth/google/url')
      if (response.data.url) {
        window.location.href = response.data.url
      } else {
        toast.error('Google OAuth not configured')
        setGoogleLoading(false)
      }
    } catch (error: any) {
      console.error('Error getting Google OAuth URL:', error)
      toast.error(error.response?.data?.error || 'Failed to connect to Google')
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await dispatch(login({ username, password })).unwrap()
      // Reset session tracking for new login
      localStorage.setItem('session_start_time', Date.now().toString())
      localStorage.setItem('last_activity_time', Date.now().toString())
      toast.success('Login successful!')
      navigate('/app')
    } catch (error: any) {
      toast.error(error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: ChartBarIcon, text: 'Real-time Analytics' },
    { icon: CogIcon, text: 'Production Management' },
    { icon: CubeIcon, text: 'Inventory Control' },
    { icon: ShieldCheckIcon, text: 'Quality Assurance' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <CubeIcon className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">{companyName}</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Enterprise Resource
              <br />
              <span className="text-blue-200">Planning System</span>
            </h1>
            <p className="text-lg text-blue-100/80 max-w-md">
              Streamline your business operations with our comprehensive ERP solution. 
              Manage everything from inventory to finance in one place.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/20 transition-all duration-300"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-12 pt-8 border-t border-white/20">
            <div>
              <p className="text-3xl font-bold text-white">99.9%</p>
              <p className="text-blue-200 text-sm">Uptime</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">24/7</p>
              <p className="text-blue-200 text-sm">Support</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">100+</p>
              <p className="text-blue-200 text-sm">Features</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <CubeIcon className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{companyName}</span>
            </div>
          </div>

          {/* Session Expired Banner */}
          {sessionMessage && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {sessionMessage}
                </p>
              </div>
            </div>
          )}

          {/* Welcome Text */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome back! 👋
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Please enter your credentials to access your account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-50 dark:bg-slate-900 text-slate-500">or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={!googleEnabled || googleLoading}
              className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ${(!googleEnabled || googleLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {googleLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-400 border-t-transparent"></div>
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </>
              )}
            </button>
            
            {!googleEnabled && (
              <p className="text-xs text-center text-slate-400">
                Google login is not configured
              </p>
            )}
          </div>

          {/* Register Link */}
          <div className="text-center mt-6">
            <p className="text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                Create account
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  )
}
