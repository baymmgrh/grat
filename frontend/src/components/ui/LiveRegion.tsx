import React, { useState, useEffect, useCallback } from 'react';

/**
 * LiveRegion - Announces dynamic content changes to screen readers
 * 
 * Usage:
 * const { announce } = useLiveRegion();
 * announce('Data berhasil disimpan');
 */

interface LiveRegionProps {
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  className?: string;
}

// Hook for announcing messages
export const useLiveRegion = () => {
  const [message, setMessage] = useState('');

  const announce = useCallback((text: string, clearAfter = 1000) => {
    setMessage(text);
    if (clearAfter > 0) {
      setTimeout(() => setMessage(''), clearAfter);
    }
  }, []);

  const clear = useCallback(() => {
    setMessage('');
  }, []);

  return { message, announce, clear };
};

// Component for rendering live region
const LiveRegion: React.FC<LiveRegionProps & { message: string }> = ({
  message,
  'aria-live': ariaLive = 'polite',
  'aria-atomic': ariaAtomic = true,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  );
};

// Provider component that includes the live region
interface LiveRegionProviderProps {
  children: React.ReactNode;
}

export const LiveRegionProvider: React.FC<LiveRegionProviderProps> = ({ children }) => {
  const { message, announce, clear } = useLiveRegion();

  return (
    <LiveRegionContext.Provider value={{ announce, clear }}>
      {children}
      <LiveRegion message={message} />
    </LiveRegionContext.Provider>
  );
};

// Context for using live region anywhere in the app
interface LiveRegionContextType {
  announce: (text: string, clearAfter?: number) => void;
  clear: () => void;
}

const LiveRegionContext = React.createContext<LiveRegionContextType | undefined>(undefined);

export const useLiveAnnounce = () => {
  const context = React.useContext(LiveRegionContext);
  if (!context) {
    throw new Error('useLiveAnnounce must be used within LiveRegionProvider');
  }
  return context;
};

export default LiveRegion;
