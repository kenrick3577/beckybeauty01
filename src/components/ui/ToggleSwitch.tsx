import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  color?: 'green' | 'primary' | 'purple' | 'gray';
}

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  id,
  color = 'primary'
}: ToggleSwitchProps) {
  const getColorClass = () => {
    switch (color) {
      case 'primary':
        return 'bg-primary-600';
      case 'purple':
        return 'bg-purple-600';
      case 'gray':
        return 'bg-gray-500';
      case 'green':
      default:
        return 'bg-[#4CAF50]';
    }
  };

  return (
    <label className={`relative inline-flex items-center cursor-pointer h-6 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        id={id}
      />
      <div className={`w-10 h-5 bg-[#E5E5E5] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all transition-colors duration-300 dark:border-gray-600 peer-checked:${getColorClass()}`} aria-hidden="true"></div>
      {label && <span className="ml-3 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-300">{label}</span>}
    </label>
  );
}