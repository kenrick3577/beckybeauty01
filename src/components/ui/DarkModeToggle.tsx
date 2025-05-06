import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAdminSettingsStore } from '../../store/adminSettingsStore';
import toast from 'react-hot-toast';

interface DarkModeToggleProps {
  className?: string;
}

export default function DarkModeToggle({ className = '' }: DarkModeToggleProps) {
  const { settings, updateSettings } = useAdminSettingsStore();

  const toggleDarkMode = () => {
    const newDarkMode = !settings.darkMode;
    updateSettings({ darkMode: newDarkMode });
    document.documentElement.classList.toggle('dark', newDarkMode);
    toast.success(`${newDarkMode ? 'Dark' : 'Light'} mode activated`);
  };

  return (
    <div className={`flex items-center ${className}`}>
      <Sun className={`h-4 w-4 mr-2 ${settings.darkMode ? 'text-gray-400' : 'text-yellow-500'}`} aria-hidden="true" />
      <button
        onClick={toggleDarkMode}
        className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          settings.darkMode ? 'bg-primary-600' : 'bg-gray-200'
        }`}
        role="switch"
        aria-checked={settings.darkMode}
        aria-label="Toggle dark mode"
      >
        <span className="sr-only">Toggle dark mode</span>
        <span
          className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            settings.darkMode ? 'translate-x-6' : 'translate-x-0'
          }`}
        >
          <span
            className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${
              settings.darkMode ? 'opacity-0 duration-0 ease-out' : 'opacity-100 duration-200 ease-in'
            }`}
            aria-hidden="true"
          >
            <Sun className="h-3 w-3 text-yellow-500" />
          </span>
          <span
            className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${
              settings.darkMode ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-0 ease-out'
            }`}
            aria-hidden="true"
          >
            <Moon className="h-3 w-3 text-primary-200" />
          </span>
        </span>
      </button>
      <Moon className={`h-4 w-4 ml-2 ${settings.darkMode ? 'text-primary-200' : 'text-gray-400'}`} aria-hidden="true" />
    </div>
  );
}