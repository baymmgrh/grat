import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { logout } from '../../store/slices/authSlice'
import {
  Bars3Icon
} from '@heroicons/react/24/outline'
import axiosInstance from '../../utils/axiosConfig'
import NotificationBell from '../NotificationBell'
interface HeaderProps {
  toggleSidebar: () => void
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [companyName, setCompanyName] = useState('PT. Gratia Makmur Sentosa - ERP System')

  useEffect(() => {
    loadCompanySettings()
    
    // Listen for company settings update event
    const handleCompanyUpdate = () => {
      loadCompanySettings()
    }
    
    window.addEventListener('companySettingsUpdated', handleCompanyUpdate)
    
    return () => {
      window.removeEventListener('companySettingsUpdated', handleCompanyUpdate)
    }
  }, [])

  const loadCompanySettings = async () => {
    try {
      const response = await axiosInstance.get('/api/settings/company')
      if (response.data && response.data.name) {
        setCompanyName(`${response.data.name} - ERP System`)
      }
    } catch (error) {
      console.error('Error loading company settings:', error)
      // Keep default if API fails
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleSidebar();
        }}
      >
        <span className="sr-only">Toggle sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="h-6 w-px bg-gray-200" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <h1 className="text-lg font-semibold text-gray-900">
            {companyName}
          </h1>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <NotificationBell />

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          <div className="flex items-center gap-x-4">
            <button
              onClick={() => navigate('/app/profile')}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              title="Lihat Profil"
            >
              {user?.full_name}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
