import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
// Auto-detect the correct API base URL
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // Production domain - use HTTPS API subdomain
  if (hostname === 'erp.graterp.my.id' || hostname.endsWith('.graterp.my.id')) {
    return 'https://api.graterp.my.id';
  }
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // LAN access - use same IP but port 5000
  return `http://${hostname}:5000`;
};

const API_BASE_URL = getApiBaseUrl()

interface User {
  id: number
  username: string
  email: string
  full_name: string
  is_admin: boolean
  is_super_admin: boolean
  roles: string[]
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const token = localStorage.getItem('token')

const initialState: AuthState = {
  user: null,
  token: token,
  isAuthenticated: !!token, // Set true if token exists, will be validated by checkAuth
  loading: !!token, // Loading if token exists (waiting for validation)
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials)
      localStorage.setItem('token', response.data.access_token)
      // Store user info for quick access
      if (response.data.user) {
        localStorage.setItem('userId', response.data.user.id?.toString() || '')
        localStorage.setItem('username', response.data.user.username || '')
        localStorage.setItem('fullName', response.data.user.full_name || response.data.user.username || '')
      }
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Login failed')
    }
  }
)

export const checkAuth = createAsyncThunk('auth/check', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      return rejectWithValue('No token found')
    }
    const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // Update localStorage with latest user info
    if (response.data) {
      localStorage.setItem('userId', response.data.id?.toString() || '')
      localStorage.setItem('username', response.data.username || '')
      localStorage.setItem('fullName', response.data.full_name || response.data.username || '')
    }
    return response.data
  } catch (error) {
    localStorage.removeItem('token')
    return rejectWithValue('Authentication failed')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      state.loading = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.access_token
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
      })
  },
})

export const { logout, setCredentials } = authSlice.actions
export default authSlice.reducer
