import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Option {
  id: number | string;
  code?: string;
  name: string;
  label?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: number | string | null;
  onChange: (value: number | string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  className = '',
  disabled = false,
  required = false,
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [typeaheadBuffer, setTypeaheadBuffer] = useState('');
  const [typeaheadTimeout, setTypeaheadTimeout] = useState<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  // Get display text for option
  const getOptionDisplay = (option: Option) => {
    if (!option) return '';
    if (option.code) {
      return `${option.code} - ${option.name || ''}`;
    }
    return option.label || option.name || '';
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    if (!option) return false;
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = option.name?.toLowerCase().includes(searchLower) || false;
    const codeMatch = option.code?.toLowerCase().includes(searchLower) || false;
    const labelMatch = option.label?.toLowerCase().includes(searchLower) || false;
    return nameMatch || codeMatch || labelMatch;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Typeahead: ketik huruf langsung jump ke option yang dimulai dengan huruf tersebut
  const handleTypeahead = useCallback((char: string) => {
    if (typeaheadTimeout) {
      clearTimeout(typeaheadTimeout);
    }

    const newBuffer = typeaheadBuffer + char.toLowerCase();
    setTypeaheadBuffer(newBuffer);

    // Find matching option
    const matchIndex = filteredOptions.findIndex(option => {
      const displayText = (option.code || option.name).toLowerCase();
      return displayText.startsWith(newBuffer);
    });

    if (matchIndex >= 0) {
      setHighlightedIndex(matchIndex);
      if (!isOpen) {
        // If closed, directly select
        onChange(filteredOptions[matchIndex].id);
      }
    }

    // Clear buffer after 1 second of no typing
    const timeout = setTimeout(() => {
      setTypeaheadBuffer('');
    }, 1000);
    setTypeaheadTimeout(timeout);
  }, [typeaheadBuffer, typeaheadTimeout, filteredOptions, isOpen, onChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].id);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setSearchTerm('');
        }
        break;
      default:
        // Typeahead: single character typing
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          if (!isOpen) {
            // When closed, typeahead directly selects
            handleTypeahead(e.key);
          }
        }
        break;
    }
  }, [disabled, isOpen, highlightedIndex, filteredOptions, handleTypeahead]);

  const handleSelect = (optionId: number | string) => {
    console.log('SearchableSelect - Selected option id:', optionId, 'type:', typeof optionId);
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
  };

  return (
    <div 
      ref={dropdownRef} 
      className={`relative ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
    >
      {/* Hidden input for form compatibility */}
      {name && (
        <input type="hidden" name={name} value={value ?? ''} />
      )}
      
      {/* Selected Value Display */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg flex items-center justify-between transition-colors ${
          disabled 
            ? 'bg-gray-100 cursor-not-allowed border-gray-200' 
            : 'bg-white cursor-pointer border-gray-300 hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500'
        } ${className.includes('text-xs') ? 'text-xs py-1.5 px-2' : 'text-sm'}`}
      >
        <span className={selectedOption ? 'text-gray-900 truncate' : 'text-gray-400'}>
          {selectedOption ? getOptionDisplay(selectedOption) : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape') {
                    handleKeyDown(e);
                  }
                }}
                placeholder="Ketik untuk mencari..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div ref={listRef} className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.id}
                  data-option
                  onClick={() => handleSelect(option.id)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    index === highlightedIndex 
                      ? 'bg-blue-100 text-blue-900' 
                      : option.id === value 
                        ? 'bg-blue-50 text-blue-800' 
                        : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {option.code ? (
                    <>
                      <div className="font-medium text-sm">{option.code}</div>
                      <div className="text-xs text-gray-500 truncate">{option.name}</div>
                    </>
                  ) : (
                    <div className="text-sm">{option.label || option.name}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-6 text-sm text-gray-500 text-center">
                Tidak ada hasil ditemukan
              </div>
            )}
          </div>
          
          {/* Footer hint */}
          <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-400">
            ↑↓ navigasi • Enter pilih • Esc tutup
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
