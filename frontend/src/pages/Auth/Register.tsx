import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react'
import { publicApi } from '../../utils/axiosConfig'
import toast from 'react-hot-toast'

interface RoleOption {
  id: number;
  name: string;
  description: string;
}

interface RoleCategories {
  Management: RoleOption[];
  Supervisor: RoleOption[];
  Staff: RoleOption[];
  Operator: RoleOption[];
}

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    employee_number: '',
    department: '',
    position: '',
    phone: '',
    role_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [companyName, setCompanyName] = useState('Your Company')
  const [roleCategories, setRoleCategories] = useState<RoleCategories>({
    Management: [],
    Supervisor: [],
    Staff: [],
    Operator: []
  })
  const [loadingRoles, setLoadingRoles] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadCompanySettings()
    loadRoles()
  }, [])

  const loadCompanySettings = async () => {
    try {
      const response = await publicApi.get('/api/settings/company/public')
      if (response.data && response.data.name) {
        setCompanyName(response.data.name)
      }
    } catch (error) {
      console.error('Error loading company settings:', error)
      setCompanyName('Your Company')
    }
  }

  const loadRoles = async () => {
    try {
      setLoadingRoles(true)
      const response = await publicApi.get('/api/settings/roles/public')
      if (response.data && response.data.categories) {
        setRoleCategories(response.data.categories)
      }
    } catch (error) {
      console.error('Error loading roles:', error)
    } finally {
      setLoadingRoles(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (!formData.role_id) {
      toast.error('Please select your role/position')
      return
    }

    setLoading(true)

    try {
      const registrationData = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        employee_number: formData.employee_number,
        department: formData.department,
        position: formData.position,
        phone: formData.phone,
        role_id: parseInt(formData.role_id)
      }

      await publicApi.post('/api/auth/register', registrationData)
      toast.success('Registration successful! You can now login.')
      navigate('/login')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Registration failed'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Get selected role info
  const getSelectedRoleInfo = () => {
    if (!formData.role_id) return null
    const roleId = parseInt(formData.role_id)
    for (const category of Object.values(roleCategories)) {
      const role = category.find(r => r.id === roleId)
      if (role) return role
    }
    return null
  }

  const selectedRole = getSelectedRoleInfo()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-600">
            <UserIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-blue-200">
            Register for {companyName} ERP System
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-blue-200">
                  Full Name *
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="employee_number" className="block text-sm font-medium text-blue-200">
                  Employee Number
                </label>
                <input
                  id="employee_number"
                  name="employee_number"
                  type="text"
                  value={formData.employee_number}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Employee ID (optional)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-blue-200">
                Username *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blue-200">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-blue-200">
                  Department
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Your department"
                />
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-blue-200">
                  Position
                </label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  value={formData.position}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Your job position"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-blue-200">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Your phone number"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role_id" className="block text-sm font-medium text-blue-200">
                Role / Position *
              </label>
              <div className="mt-1 relative">
                <select
                  id="role_id"
                  name="role_id"
                  required
                  value={formData.role_id}
                  onChange={handleChange}
                  disabled={loadingRoles}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-600 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                >
                  <option value="">
                    {loadingRoles ? 'Loading roles...' : 'Select your role'}
                  </option>
                  
                  {roleCategories.Management.length > 0 && (
                    <optgroup label="📊 Management">
                      {roleCategories.Management.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {roleCategories.Supervisor.length > 0 && (
                    <optgroup label="👔 Supervisor / Team Lead">
                      {roleCategories.Supervisor.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {roleCategories.Staff.length > 0 && (
                    <optgroup label="💼 Staff">
                      {roleCategories.Staff.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {roleCategories.Operator.length > 0 && (
                    <optgroup label="🔧 Operator / Worker">
                      {roleCategories.Operator.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              {selectedRole && (
                <p className="mt-1 text-xs text-blue-300">
                  {selectedRole.description}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-blue-200">
                Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-200">
                Confirm Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-blue-300">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:text-blue-200 font-medium transition-colors inline-flex items-center gap-1">
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
