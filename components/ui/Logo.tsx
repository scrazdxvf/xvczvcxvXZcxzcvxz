
import React from 'react';
import { APP_NAME } from '../../constants';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`font-bold text-2xl tracking-tight ${className}`}>
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 dark:from-sky-300 dark:via-blue-400 dark:to-indigo-500 animate-logo-float inline-block">
        {APP_NAME.split(' ')[0]}
      </span>
      <span className="ml-1 text-slate-700 dark:text-slate-300">
        {APP_NAME.split(' ').slice(1).join(' ')}
      </span>
    </div>
  );
};

export default Logo;