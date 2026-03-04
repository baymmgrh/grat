import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { ButtonSpinner } from './LoadingOverlay';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  // Accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-pressed'?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-blue-600 text-white 
    hover:bg-blue-700 
    focus:ring-blue-500/50
    active:bg-blue-800
    disabled:bg-blue-400
  `,
  secondary: `
    bg-slate-200 text-slate-800 
    hover:bg-slate-300 
    focus:ring-slate-500/50
    active:bg-slate-400
    disabled:bg-slate-100 disabled:text-slate-400
    dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600
  `,
  danger: `
    bg-red-600 text-white 
    hover:bg-red-700 
    focus:ring-red-500/50
    active:bg-red-800
    disabled:bg-red-400
  `,
  success: `
    bg-green-600 text-white 
    hover:bg-green-700 
    focus:ring-green-500/50
    active:bg-green-800
    disabled:bg-green-400
  `,
  warning: `
    bg-yellow-500 text-white 
    hover:bg-yellow-600 
    focus:ring-yellow-500/50
    active:bg-yellow-700
    disabled:bg-yellow-400
  `,
  ghost: `
    bg-transparent text-slate-700 
    hover:bg-slate-100 
    focus:ring-slate-500/50
    active:bg-slate-200
    dark:text-slate-300 dark:hover:bg-slate-800
  `,
  link: `
    bg-transparent text-blue-600 
    hover:text-blue-700 hover:underline
    focus:ring-blue-500/50
    dark:text-blue-400
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs rounded',
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-lg',
  xl: 'px-6 py-3 text-lg rounded-xl',
};

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={`
          inline-flex items-center justify-center gap-2
          font-medium
          transition-all duration-200
          focus:outline-none focus:ring-4
          disabled:cursor-not-allowed disabled:opacity-70
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <>
            <ButtonSpinner className="h-4 w-4" />
            <span>{loadingText || 'Loading...'}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

// Icon Button with proper accessibility
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  'aria-label': string; // Required for icon-only buttons
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = 'ghost', size = 'md', loading, className = '', ...props }, ref) => {
    const iconSizeStyles: Record<ButtonSize, string> = {
      xs: 'p-1',
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-2.5',
      xl: 'p-3',
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-busy={loading}
        className={`
          inline-flex items-center justify-center
          rounded-lg
          transition-all duration-200
          focus:outline-none focus:ring-4
          disabled:cursor-not-allowed disabled:opacity-70
          ${variantStyles[variant]}
          ${iconSizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? <ButtonSpinner className="h-5 w-5" /> : icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default AccessibleButton;
