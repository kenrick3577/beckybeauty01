import React, { useEffect } from 'react';
import { Moon, Bell, Mail, MessageSquare } from 'lucide-react';
import { useAdminSettingsStore } from '../../store/adminSettingsStore';
import toast from 'react-hot-toast';
import ToggleSwitch from '../ui/ToggleSwitch';

export default function AdminSettings() {
  const { settings, updateSettings } = useAdminSettingsStore(); 

  useEffect(() => {
    // Set default mode when component loads
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.darkMode]);

  const toggleSetting = (key: keyof typeof settings) => {
    const newValue = !settings[key];
    updateSettings({ [key]: newValue });
    
    // Show message for setting change
    let message = '';
    switch (key) {
      case 'darkMode':
        message = `${newValue ? 'Dark' : 'Light'} mode activated`;
        break;
      case 'appointmentNotifications':
        message = `Appointment notifications ${newValue ? 'enabled' : 'disabled'}`;
        break;
      case 'emailNotifications':
        message = `Email notifications ${newValue ? 'enabled' : 'disabled'}`;
        break;
      case 'smsNotifications':
        message = `SMS notifications ${newValue ? 'enabled' : 'disabled'}`;
        break;
    }
    
    toast.success(message);
  };

  return (
    <div className={`animate-fade-in ${settings.darkMode ? 'text-white' : 'text-gray-900'} text-xs sm:text-sm`}>
      <div className={`${settings.darkMode ? 'bg-gray-800' : 'bg-white'} shadow overflow-hidden rounded-lg`}>
        <div className="px-3 sm:px-6 py-4 sm:py-5">
          <h3 className={`text-base sm:text-lg leading-6 font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>
            Admin Settings
          </h3>
          <p className={`mt-1 max-w-2xl ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
            Manage your admin preferences and notifications
          </p>
        </div>
        
        <div className="border-t border-gray-200">
          <dl>
            {/* Theme Toggle */}
            <div className={`${settings.darkMode ? 'bg-gray-700' : 'bg-gray-50'} px-3 sm:px-6 py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4`}>
              <dt className="font-medium flex items-center">
                <Moon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Dark Mode
              </dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2">
                <ToggleSwitch
                  checked={settings.darkMode}
                  onChange={() => toggleSetting('darkMode')}
                  color="primary"
                />
              </dd>
            </div>

            {/* Appointment Notifications */}
            <div className={`${settings.darkMode ? 'bg-gray-800' : 'bg-white'} px-3 sm:px-6 py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4`}>
              <dt className="font-medium flex items-center">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Appointment Notifications
              </dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2">
                <ToggleSwitch
                  checked={settings.appointmentNotifications}
                  onChange={() => toggleSetting('appointmentNotifications')}
                  color="green"
                />
              </dd>
            </div>

            {/* Email Notifications */}
            <div className={`${settings.darkMode ? 'bg-gray-700' : 'bg-gray-50'} px-3 sm:px-6 py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4`}>
              <dt className="font-medium flex items-center">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Email Notifications
              </dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2">
                <ToggleSwitch
                  checked={settings.emailNotifications}
                  onChange={() => toggleSetting('emailNotifications')}
                  color="green"
                />
              </dd>
            </div>

            {/* SMS Notifications */}
            <div className={`${settings.darkMode ? 'bg-gray-800' : 'bg-white'} px-3 sm:px-6 py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4`}>
              <dt className="font-medium flex items-center">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                SMS Notifications
              </dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2">
                <ToggleSwitch
                  checked={settings.smsNotifications}
                  onChange={() => toggleSetting('smsNotifications')}
                  color="green"
                />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}