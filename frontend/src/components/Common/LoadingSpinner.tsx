import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
const LoadingSpinner: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="flex justify-center items-center min-h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default LoadingSpinner;
