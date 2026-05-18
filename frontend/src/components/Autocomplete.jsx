import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const Autocomplete = ({
  label,
  name,
  value,
  options = [],
  onChange,
  getOptionValue = (option) => option.value,
  getOptionLabel = (option) => option.label,
  getOptionDescription,
  placeholder = 'Escriba para buscar...',
  emptyMessage = 'Sin coincidencias',
  required = false,
  disabled = false,
  allowCustom = false,
  className = '',
  maxLength,
}) => {
  const containerRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => String(getOptionValue(option)) === String(value)),
    [getOptionValue, options, value]
  );

  useEffect(() => {
    if (allowCustom) {
      setInputValue(value || '');
      return;
    }

    if (selectedOption) {
      setInputValue(getOptionLabel(selectedOption));
      return;
    }

    if (!value && !isOpen) {
      setInputValue('');
    }
  }, [allowCustom, getOptionLabel, isOpen, selectedOption, value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const term = normalizeText(inputValue.trim());
    const visibleOptions = term
      ? options.filter((option) => {
          const labelText = getOptionLabel(option);
          const descriptionText = getOptionDescription?.(option) || '';
          return normalizeText(`${labelText} ${descriptionText}`).includes(term);
        })
      : options;

    return visibleOptions.slice(0, 12);
  }, [getOptionDescription, getOptionLabel, inputValue, options]);

  const emitChange = (nextValue) => {
    onChange?.({ target: { name, value: nextValue } });
  };

  const handleInputChange = (event) => {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    setIsOpen(true);

    if (allowCustom) {
      emitChange(nextValue);
      return;
    }

    if (!nextValue) {
      emitChange('');
      return;
    }

    if (selectedOption && nextValue !== getOptionLabel(selectedOption)) {
      emitChange('');
    }
  };

  const selectOption = (option) => {
    const nextValue = getOptionValue(option);
    setInputValue(getOptionLabel(option));
    emitChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        <input
          type="text"
          name={`${name}_search`}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          required={required && !value}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete="off"
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 outline-none transition-all"
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen((open) => !open)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
          title="Mostrar opciones"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const optionValue = getOptionValue(option);
              const description = getOptionDescription?.(option);

              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => selectOption(option)}
                  className="flex w-full flex-col px-3 py-2 text-left hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
                >
                  <span className="text-sm font-medium text-gray-800">{getOptionLabel(option)}</span>
                  {description && <span className="text-xs text-gray-500">{description}</span>}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-3 text-sm text-gray-400">{emptyMessage}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Autocomplete;
