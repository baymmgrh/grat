import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Base Input Props
interface BaseInputProps {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Text Input
interface TextInputProps extends BaseInputProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, success, hint, required, leftIcon, rightIcon, size = 'md', className = '', ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5',
      lg: 'px-4 py-3 text-lg'
    };

    const inputClasses = `
      w-full rounded-lg border transition-all duration-200
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon || error || success ? 'pr-10' : ''}
      ${sizeClasses[size]}
      ${error 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-900/10' 
        : success
          ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
          : 'border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20'
      }
      focus:outline-none focus:ring-4
      dark:bg-slate-800 dark:text-white
      disabled:bg-slate-100 disabled:cursor-not-allowed dark:disabled:bg-slate-700
      placeholder:text-slate-400
      ${className}
    `;

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={inputClasses}
            {...props}
          />
          
          {(error || success || rightIcon) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {error ? (
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              ) : success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <ExclamationCircleIcon className="h-4 w-4" />
            {error}
          </p>
        )}
        
        {success && !error && (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <CheckCircleIcon className="h-4 w-4" />
            {success}
          </p>
        )}
        
        {hint && !error && !success && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{hint}</p>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';

// Textarea
interface TextareaProps extends BaseInputProps, TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, success, hint, required, className = '', ...props }, ref) => {
    const textareaClasses = `
      w-full px-4 py-2.5 rounded-lg border transition-all duration-200
      ${error 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-900/10' 
        : success
          ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
          : 'border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20'
      }
      focus:outline-none focus:ring-4
      dark:bg-slate-800 dark:text-white
      disabled:bg-slate-100 disabled:cursor-not-allowed dark:disabled:bg-slate-700
      placeholder:text-slate-400
      resize-none
      ${className}
    `;

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          className={textareaClasses}
          {...props}
        />
        
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <ExclamationCircleIcon className="h-4 w-4" />
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Select
interface SelectProps extends BaseInputProps, SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string | number; label: string; disabled?: boolean }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, success, hint, required, options, placeholder, className = '', ...props }, ref) => {
    const selectClasses = `
      w-full px-4 py-2.5 rounded-lg border transition-all duration-200 appearance-none
      ${error 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-900/10' 
        : success
          ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
          : 'border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20'
      }
      focus:outline-none focus:ring-4
      dark:bg-slate-800 dark:text-white
      disabled:bg-slate-100 disabled:cursor-not-allowed dark:disabled:bg-slate-700
      ${className}
    `;

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            className={selectClasses}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <ExclamationCircleIcon className="h-4 w-4" />
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Checkbox
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            className={`
              mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 
              focus:ring-blue-500 focus:ring-offset-0
              disabled:cursor-not-allowed disabled:opacity-50
              ${error ? 'border-red-500' : ''}
              ${className}
            `}
            {...props}
          />
          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {label}
            </span>
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
        </label>
        
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 ml-7">
            <ExclamationCircleIcon className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default { TextInput, Textarea, Select, Checkbox };
