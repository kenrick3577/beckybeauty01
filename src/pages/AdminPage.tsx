import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Moon, Sun } from 'lucide-react';
import AppointmentManager from '../components/admin/AppointmentManager';
import MemberManager from '../components/admin/MemberManager';
import FinancialDashboard from '../components/admin/FinancialDashboard';
import DailyFinancialReport from '../components/admin/DailyFinancialReport';
import MonthlyFinancialReport from '../components/admin/MonthlyFinancialReport';
import ServiceManager from '../components/admin/ServiceManager';
import { useAppointmentStore } from '../store/appointmentStore';
import { useAdminSettingsStore } from '../store/adminSettingsStore';
import { formatDate, formatTime } from '../lib/utils';
import AdminSettings from '../components/admin/AdminSettings';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import AdminSidebar from '../components/layout/AdminSidebar';
import toast from 'react-hot-toast';

type Tab = 'appointments' | 'members' | 'finances' | 'settings' | 'services';

export default function AdminPage() {
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as Tab) || 'appointments';
  const view = searchParams.get('view');
  const { appointments, fetchAppointments, getNextAppointment } = useAppointmentStore();
  const { settings, updateSettings } = useAdminSettingsStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointments().catch(error => {
        toast.error('Failed to load appointments');
        console.error('Error loading appointments:', error);
      });
    }
  }, [activeTab, fetchAppointments]);

  const toggleDarkMode = () => {
    const newDarkMode = !settings.darkMode;
    updateSettings({ darkMode: newDarkMode });
    localStorage.setItem('adminDarkMode', newDarkMode.toString());
    toast.success(`${newDarkMode ? 'Dark' : 'Light'} mode activated`);
  };

  const renderTabContent = () => {
    if (activeTab === 'finances' && view === 'daily') {
      return <DailyFinancialReport />;
    }
    if (activeTab === 'finances' && view === 'monthly') {
      return <MonthlyFinancialReport />;
    }
    
    switch (activeTab) {
      case 'appointments':
        return <AppointmentManager />;
      case 'members':
        return <MemberManager />;
      case 'finances':
        return <FinancialDashboard />;
      case 'services':
        return <ServiceManager />;
      case 'settings':
        return <AdminSettings />;
      default:
        return null;
    }
  };

  const nextAppointment = getNextAppointment();

  return (
    <div className={`min-h-screen ${settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'} transition-colors duration-200 flex`}>
      <div className="fixed inset-0 z-50 md:hidden bg-black bg-opacity-50" 
           style={{display: isSidebarOpen ? 'block' : 'none'}}
           onClick={() => setIsSidebarOpen(false)}></div>

      {/* Sidebar - conditionally rendered for mobile, always visible for desktop */}
      {(isSidebarOpen || window.innerWidth >= 768) && (
        <AdminSidebar isMobile={window.innerWidth < 768} />
      )}
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto pt-4">
        <div className="max-w-7xl mx-auto px-3 animate-fade-in">
          <div className="pb-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center justify-between w-full">
              {/* Mobile menu button */}
              <div className="flex items-center">
                <button
                  className="mr-3 p-2 rounded-md md:hidden"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className={`text-xl font-extrabold tracking-tight ${settings.darkMode ? 'text-white' : 'text-gray-900'} truncate max-w-[200px]`}>
                  Admin Dashboard
                </h1>
              </div>
              
              {/* Dark Mode Toggle */}
              <div className="flex items-center">
                <Sun className={`h-3 w-3 mr-1 ${settings.darkMode ? 'text-gray-400' : 'text-yellow-500'}`} />
                <ToggleSwitch
                  checked={settings.darkMode}
                  onChange={toggleDarkMode}
                  color="primary"
                />
                <Moon className={`h-3 w-3 ml-1 ${settings.darkMode ? 'text-white' : 'text-gray-400'}`} />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-1 gap-3">
            <>
              {nextAppointment && (
                <div className={`${
                  settings.darkMode ? 'bg-gray-800' : 'bg-white'
                } overflow-hidden shadow rounded-lg`}>
                  <div className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Clock className={`h-5 w-5 ${settings.darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className={`text-xs font-medium ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                            Next Appointment
                          </dt>
                          <dd className="flex items-center mt-1">
                            <div className={`text-sm font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatDate(nextAppointment.date)} at {formatTime(nextAppointment.time)}
                            </div>
                          </dd>
                          <dd className={`mt-1 text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'} line-clamp-1`}>
                            {nextAppointment.service?.name} - {nextAppointment.user?.name || nextAppointment.user?.email}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          </div>

          <div className="mt-4">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}