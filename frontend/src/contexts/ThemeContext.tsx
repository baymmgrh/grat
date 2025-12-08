import React, { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  theme: 'light' | 'dark' | 'auto'
  actualTheme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [theme, setThemeState] = useState<'light' | 'dark' | 'auto'>('light')
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')

  // Get system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Apply theme to document
  const applyTheme = (themeToApply: 'light' | 'dark') => {
    const root = document.documentElement
    if (themeToApply === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    setActualTheme(themeToApply)
  }

  // Set theme and persist to localStorage
  const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    
    let themeToApply: 'light' | 'dark'
    if (newTheme === 'auto') {
      themeToApply = getSystemTheme()
    } else {
      themeToApply = newTheme
    }
    
    applyTheme(themeToApply)
  }

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null
    const initialTheme = savedTheme || 'light'
    
    setThemeState(initialTheme)
    
    let themeToApply: 'light' | 'dark'
    if (initialTheme === 'auto') {
      themeToApply = getSystemTheme()
    } else {
      themeToApply = initialTheme
    }
    
    applyTheme(themeToApply)
  }, [])

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme === 'auto') {
        applyTheme(getSystemTheme())
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Listen for theme updates from settings
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { theme: newTheme } = event.detail
      if (newTheme) {
        setTheme(newTheme)
      }
    }

    window.addEventListener('themeSettingsUpdated', handleSettingsUpdate as EventListener)
    return () => window.removeEventListener('themeSettingsUpdated', handleSettingsUpdate as EventListener)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
