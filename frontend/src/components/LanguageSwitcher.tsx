import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  GlobeAltIcon
} from '@heroicons/react/24/outline';
interface LanguageSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const handleLanguageChange = (langCode: 'id' | 'en') => {
    setLanguage(langCode);
    
    // Trigger custom event for other components to react
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: langCode }
    }));
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <GlobeAltIcon className="h-4 w-4" />
          <span>{t('settings.language')}:</span>
        </div>
      )}
      
      <div className="flex items-center space-x-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code as 'id' | 'en')}
            className={`
              px-2 py-1 rounded-md text-sm font-medium transition-colors duration-200
              ${language === lang.code
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
            title={lang.name}
          >
            <span className="mr-1">{lang.flag}</span>
            <span className="hidden sm:inline">{lang.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
