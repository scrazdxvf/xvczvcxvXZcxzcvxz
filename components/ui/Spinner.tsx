
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Tailwind color class e.g. text-sky-500
  className?: string;
  fullPage?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color, className = '', fullPage = false }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const spinnerColor = color || 'text-sky-500 dark:text-dark-accent';

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-light-primary dark:bg-dark-primary bg-opacity-75 dark:bg-opacity-75 z-50">
        <div
          className={`animate-spin rounded-full border-4 border-t-transparent ${sizeClasses[size]} ${spinnerColor} ${className}`}
          style={{ borderTopColor: 'transparent' }}
        ></div>
      </div>
    );
  }

  return (
    <div
      className={`animate-spin rounded-full border-4 border-t-transparent ${sizeClasses[size]} ${spinnerColor} ${className}`}
      style={{ borderTopColor: 'transparent' }}
    ></div>
  );
};

export default Spinner;