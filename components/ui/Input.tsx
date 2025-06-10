
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, id, error, className = '', wrapperClassName = '', ...props }) => {
  const baseInputClasses = "block w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm";
  const lightModeClasses = "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-sky-500 focus:border-sky-500";
  const darkModeClasses = "dark:bg-dark-secondary dark:border-slate-600 dark:text-dark-text-primary dark:placeholder-slate-500 dark:focus:ring-dark-accent dark:focus:border-dark-accent";
  const errorClasses = error ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500" : "";


  return (
    <div className={`mb-4 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-dark-text-secondary mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${baseInputClasses} ${lightModeClasses} ${darkModeClasses} ${errorClasses} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Input;