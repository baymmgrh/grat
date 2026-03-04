import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface DropdownOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  description?: string;
}

interface AccessibleDropdownProps {
  options: DropdownOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
}

const AccessibleDropdown: React.FC<AccessibleDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  label,
  error,
  disabled = false,
  required = false,
  id,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const dropdownId = id || `dropdown-${Math.random().toString(36).substr(2, 9)}`;
  const labelId = `${dropdownId}-label`;
  const listboxId = `${dropdownId}-listbox`;

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const highlightedElement = listboxRef.current.children[highlightedIndex] as HTMLElement;
      highlightedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;

      const enabledOptions = options.filter((opt) => !opt.disabled);

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (isOpen && highlightedIndex >= 0) {
            const option = options[highlightedIndex];
            if (!option.disabled) {
              onChange(option.value);
              setIsOpen(false);
              buttonRef.current?.focus();
            }
          } else {
            setIsOpen(true);
          }
          break;

        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setHighlightedIndex(0);
          } else {
            setHighlightedIndex((prev) => {
              let next = prev + 1;
              while (next < options.length && options[next].disabled) {
                next++;
              }
              return next < options.length ? next : prev;
            });
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) => {
              let next = prev - 1;
              while (next >= 0 && options[next].disabled) {
                next--;
              }
              return next >= 0 ? next : prev;
            });
          }
          break;

        case 'Home':
          event.preventDefault();
          if (isOpen) {
            const firstEnabled = options.findIndex((opt) => !opt.disabled);
            setHighlightedIndex(firstEnabled);
          }
          break;

        case 'End':
          event.preventDefault();
          if (isOpen) {
            const lastEnabled = options.length - 1 - [...options].reverse().findIndex((opt) => !opt.disabled);
            setHighlightedIndex(lastEnabled);
          }
          break;

        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;

        case 'Tab':
          setIsOpen(false);
          break;

        default:
          // Type-ahead: find option starting with typed character
          if (event.key.length === 1 && isOpen) {
            const char = event.key.toLowerCase();
            const startIndex = highlightedIndex + 1;
            const matchIndex = options.findIndex(
              (opt, idx) =>
                idx >= startIndex &&
                !opt.disabled &&
                opt.label.toLowerCase().startsWith(char)
            );
            if (matchIndex >= 0) {
              setHighlightedIndex(matchIndex);
            } else {
              // Search from beginning
              const wrapIndex = options.findIndex(
                (opt) => !opt.disabled && opt.label.toLowerCase().startsWith(char)
              );
              if (wrapIndex >= 0) {
                setHighlightedIndex(wrapIndex);
              }
            }
          }
          break;
      }
    },
    [disabled, isOpen, highlightedIndex, options, onChange]
  );

  const handleOptionClick = (option: DropdownOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label
          id={labelId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        id={dropdownId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? labelId : undefined}
        aria-controls={isOpen ? listboxId : undefined}
        aria-invalid={!!error}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          w-full flex items-center justify-between
          px-4 py-2.5 rounded-lg border
          text-left text-sm
          transition-all duration-200
          focus:outline-none focus:ring-4
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            : 'border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20'
          }
          ${disabled
            ? 'bg-slate-100 cursor-not-allowed text-slate-400 dark:bg-slate-700'
            : 'bg-white dark:bg-slate-800 hover:border-slate-400'
          }
          dark:text-white
        `}
      >
        <span className={selectedOption ? '' : 'text-slate-400'}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDownIcon
          className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Error Message */}
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* Dropdown List */}
      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={label ? labelId : dropdownId}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${dropdownId}-option-${highlightedIndex}` : undefined
          }
          tabIndex={-1}
          className="
            absolute z-50 w-full mt-1
            bg-white dark:bg-slate-800
            border border-slate-200 dark:border-slate-700
            rounded-lg shadow-lg
            max-h-60 overflow-auto
            py-1
          "
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${dropdownId}-option-${index}`}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
              className={`
                px-4 py-2 cursor-pointer
                flex items-center gap-2
                ${option.disabled
                  ? 'text-slate-400 cursor-not-allowed'
                  : highlightedIndex === index
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : option.value === value
                      ? 'bg-blue-100 dark:bg-blue-900/50'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                }
              `}
            >
              {option.icon}
              <div className="flex-1">
                <div className="text-sm">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-slate-500">{option.description}</div>
                )}
              </div>
              {option.value === value && (
                <svg className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AccessibleDropdown;
