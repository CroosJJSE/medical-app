// src/components/common/AutocompleteInput.tsx
// Autocomplete input component for searchable dropdowns

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AutocompleteInputProps<T> {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: T) => void;
  searchResults: T[];
  getItemLabel: (item: T) => string;
  getItemKey: (item: T, index: number) => string;
  placeholder?: string;
  disabled?: boolean;
  maxResults?: number;
  debounceMs?: number;
  className?: string;
  icon?: string;
  emptyMessage?: string;
  renderItem?: (item: T, isHighlighted: boolean) => React.ReactNode;
}

function AutocompleteInput<T>({
  value,
  onChange,
  onSelect,
  searchResults,
  getItemLabel,
  getItemKey,
  placeholder = 'Search...',
  disabled = false,
  maxResults = 20,
  debounceMs = 300,
  className = '',
  icon,
  emptyMessage = 'No results found',
  renderItem,
}: AutocompleteInputProps<T>) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce input value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  // Update debounced value when it changes (triggers search)
  useEffect(() => {
    if (debouncedValue.trim() && searchResults.length > 0) {
      setShowDropdown(true);
    } else if (!debouncedValue.trim()) {
      setShowDropdown(false);
    }
  }, [debouncedValue, searchResults.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || searchResults.length === 0) {
      if (e.key === 'Enter') {
        setShowDropdown(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
          handleSelect(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = useCallback(
    (item: T) => {
      onSelect(item);
      onChange('');
      setShowDropdown(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    },
    [onSelect, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setHighlightedIndex(-1);
    if (e.target.value.trim()) {
      setShowDropdown(true);
    }
  };

  const handleFocus = () => {
    if (value.trim() && searchResults.length > 0) {
      setShowDropdown(true);
    }
  };

  const displayResults = searchResults.slice(0, maxResults);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[20px] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-[#dbdfe6] ${
            icon ? 'pl-10' : 'pl-3'
          } pr-3 py-2 text-sm bg-white text-[#111418] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed`}
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-[#dbdfe6] rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {displayResults.length > 0 ? (
            <ul className="py-1">
              {displayResults.map((item, index) => {
                const isHighlighted = index === highlightedIndex;
                return (
                  <li
                    key={getItemKey(item, index)}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-4 py-2 cursor-pointer text-sm ${
                      isHighlighted
                        ? 'bg-primary/10 text-primary'
                        : 'text-[#111418] hover:bg-gray-50'
                    } transition-colors`}
                  >
                    {renderItem ? (
                      renderItem(item, isHighlighted)
                    ) : (
                      <span>{getItemLabel(item)}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : debouncedValue.trim() ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              {emptyMessage}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default AutocompleteInput;
