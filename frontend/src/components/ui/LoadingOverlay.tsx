import React from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
  blur?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Memuat...',
  fullScreen = false,
  blur = true
}) => {
  if (!isLoading) return null;

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50'
    : 'absolute inset-0 z-10';

  return (
    <div className={`${containerClass} flex items-center justify-center`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-white/80 dark:bg-slate-900/80 ${blur ? 'backdrop-blur-sm' : ''}`}
      />
      
      {/* Spinner */}
      <div className="relative flex flex-col items-center">
        <div className="relative">
          {/* Outer ring */}
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700" />
          {/* Spinning ring */}
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
        </div>
        
        {/* Message */}
        {message && (
          <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

// Button loading spinner
export const ButtonSpinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`animate-spin h-4 w-4 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// Page loading
export const PageLoading: React.FC<{ message?: string }> = ({ message = 'Memuat halaman...' }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <div className="relative inline-block">
        <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700" />
        <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
      </div>
      <p className="mt-4 text-slate-600 dark:text-slate-400">{message}</p>
    </div>
  </div>
);

// Inline loading for buttons/inputs
export const InlineLoading: React.FC = () => (
  <span className="inline-flex items-center">
    <ButtonSpinner className="mr-2" />
    <span>Loading...</span>
  </span>
);

export default LoadingOverlay;
