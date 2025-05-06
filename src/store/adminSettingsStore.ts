import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminSettings {
  darkMode: boolean;
  appointmentNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

interface AdminSettingsStore {
  settings: AdminSettings;
  updateSettings: (settings: Partial<AdminSettings>) => void;
}

export const useAdminSettingsStore = create<AdminSettingsStore>()(
  persist(
    (set) => ({
      settings: {
        darkMode: false,
        appointmentNotifications: true,
        emailNotifications: true,
        smsNotifications: true,
      },
      updateSettings: (newSettings) => {
        set((state) => {
          const updatedSettings = { ...state.settings, ...newSettings };
          
          // Sync with localStorage for components that use it directly
          if (newSettings.darkMode !== undefined) {
            localStorage.setItem('adminDarkMode', newSettings.darkMode.toString());
          }
          
          return { settings: updatedSettings };
        });
      },
    }),
    {
      name: 'admin-settings',
    }
  )
);