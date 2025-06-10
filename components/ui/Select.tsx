
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string; // Added placeholder prop
}

const Select: React.FC<SelectProps> = ({ 
  label, 
  id, 
  error, 
  options, 
  placeholder, // Destructured placeholder
  className = '', 
  wrapperClassName = '', 
  ...props 
}) => {
  const baseInputClasses = "block w-full pl-3 pr-10 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm";
  const lightModeClasses = "bg-white border-slate-300 text-slate-900 focus:ring-sky-500 focus:border-sky-500";
  const darkModeClasses = "dark:bg-dark-secondary dark:border-slate-600 dark:text-dark-text-primary dark:focus:ring-dark-accent dark:focus:border-dark-accent";
  const errorClasses = error ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500" : "";

  return (
    <div className={`mb-4 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-dark-text-secondary mb-1">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`${baseInputClasses} ${lightModeClasses} ${darkModeClasses} ${errorClasses} ${className}`}
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>} {/* Use destructured placeholder */}
        {options.map(option => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Select;