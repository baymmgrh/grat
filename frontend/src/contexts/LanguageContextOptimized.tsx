import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'

interface LanguageContextType {
  language: 'id' | 'en'
  setLanguage: (language: 'id' | 'en') => void
  t: (key: string, params?: Record<string, string | number>) => string
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Lazy loading for translation chunks
const loadTranslations = async (language: 'id' | 'en') => {
  try {
    // In a real implementation, these would be separate JSON files
    // For now, we'll use dynamic imports with the existing translations
    const { translations } = await import('./LanguageContext')
    return translations[language]
  } catch (error) {
    console.error(`Failed to load translations for ${language}:`, error)
    return {}
  }
}

// Translation cache
const translationCache = new Map<string, Record<string, string>>()

// Memoized translation function with parameter interpolation
const createTranslationFunction = (translations: Record<string, string>) => {
  return (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[key] || key
    
    // Parameter interpolation
    if (params && typeof translation === 'string') {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(
          new RegExp(`{${paramKey}}`, 'g'), 
          String(paramValue)
        )
      })
    }
    
    return translation
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'id' | 'en'>('id')
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Memoized translation function
  const t = useMemo(() => {
    return createTranslationFunction(translations)
  }, [translations])

  // Optimized language setter with caching
  const setLanguage = useCallback(async (newLanguage: 'id' | 'en') => {
    if (newLanguage === language) return

    setIsLoading(true)
    
    try {
      // Check cache first
      let languageTranslations = translationCache.get(newLanguage)
      
      if (!languageTranslations) {
        // Load translations if not cached
        languageTranslations = await loadTranslations(newLanguage)
        translationCache.set(newLanguage, languageTranslations)
      }
      
      setTranslations(languageTranslations)
      setLanguageState(newLanguage)
      localStorage.setItem('language', newLanguage)
      
      // Update document lang attribute for accessibility
      document.documentElement.lang = newLanguage === 'id' ? 'id-ID' : 'en-US'
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: newLanguage }
      }))
      
    } catch (error) {
      console.error('Failed to set language:', error)
    } finally {
      setIsLoading(false)
    }
  }, [language])

  // Initialize language from localStorage
  useEffect(() => {
    const initializeLanguage = async () => {
      const savedLanguage = localStorage.getItem('language') as 'id' | 'en' | null
      const initialLanguage = savedLanguage || 'id'
      
      try {
        // Load initial translations
        let languageTranslations = translationCache.get(initialLanguage)
        
        if (!languageTranslations) {
          languageTranslations = await loadTranslations(initialLanguage)
          translationCache.set(initialLanguage, languageTranslations)
        }
        
        setTranslations(languageTranslations)
        setLanguageState(initialLanguage)
        document.documentElement.lang = initialLanguage === 'id' ? 'id-ID' : 'en-US'
        
      } catch (error) {
        console.error('Failed to initialize language:', error)
        // Fallback to basic translations
        setTranslations({})
      } finally {
        setIsLoading(false)
      }
    }

    initializeLanguage()
  }, [])

  // Listen for language updates from settings
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { language: newLanguage } = event.detail
      if (newLanguage && newLanguage !== language) {
        setLanguage(newLanguage)
      }
    }

    window.addEventListener('languageSettingsUpdated', handleSettingsUpdate as EventListener)
    return () => window.removeEventListener('languageSettingsUpdated', handleSettingsUpdate as EventListener)
  }, [language, setLanguage])

  // Preload the other language for faster switching
  useEffect(() => {
    const preloadOtherLanguage = async () => {
      const otherLanguage = language === 'id' ? 'en' : 'id'
      
      if (!translationCache.has(otherLanguage)) {
        try {
          const otherTranslations = await loadTranslations(otherLanguage)
          translationCache.set(otherLanguage, otherTranslations)
        } catch (error) {
          console.error(`Failed to preload ${otherLanguage} translations:`, error)
        }
      }
    }

    // Preload after a short delay to not block initial render
    const timeoutId = setTimeout(preloadOtherLanguage, 1000)
    return () => clearTimeout(timeoutId)
  }, [language])

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    isLoading
  }), [language, setLanguage, t, isLoading])

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

// Hook for getting specific module translations with memoization
export const useModuleTranslations = (module: string) => {
  const { t, language } = useTranslation()
  
  return useMemo(() => {
    const moduleTranslations: Record<string, string> = {}
    
    // This would be optimized to only load module-specific translations
    // For now, we'll filter from the main translations
    Object.keys(translationCache.get(language) || {}).forEach(key => {
      if (key.startsWith(`${module}.`)) {
        const shortKey = key.replace(`${module}.`, '')
        moduleTranslations[shortKey] = t(key)
      }
    })
    
    return moduleTranslations
  }, [module, t, language])
}

// Performance monitoring hook
export const useTranslationPerformance = () => {
  const [metrics, setMetrics] = useState({
    cacheHits: 0,
    cacheMisses: 0,
    loadTime: 0
  })

  useEffect(() => {
    // Monitor translation performance
    const originalT = LanguageContext._currentValue?.t
    
    if (originalT) {
      const monitoredT = (key: string, params?: Record<string, string | number>) => {
        const start = performance.now()
        const result = originalT(key, params)
        const end = performance.now()
        
        setMetrics(prev => ({
          ...prev,
          loadTime: prev.loadTime + (end - start)
        }))
        
        return result
      }
      
      // Replace the translation function with monitored version
      // This is for development/debugging purposes
    }
  }, [])

  return metrics
}

export default LanguageProvider
