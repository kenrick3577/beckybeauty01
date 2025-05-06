import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Menu
} from 'lucide-react';
import { useAdminSettingsStore } from '../../store/adminSettingsStore';

interface AdminSidebarProps {
  isMobile?: boolean;
}

export default function AdminSidebar({ isMobile = false }: AdminSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const { settings } = useAdminSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'appointments';

  const handleNavigation = (tab: string) => {
    navigate(`/admin?tab=${tab}`);
  };

  const navItems = [
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'finances', label: 'Finances', icon: DollarSign },
    { id: 'services', label: 'Services', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div 
      className={`${settings.darkMode ? 'bg-gray-900' : 'bg-white'} h-full shadow-md transition-all duration-300 flex flex-col ${
        isExpanded ? 'w-56' : 'w-16'
      } ${isMobile ? 'fixed z-40 left-0 top-0 bottom-0' : ''}`}
    >
      {/* Mobile Menu Toggle */}
      {isMobile && (
        <div className={`absolute top-4 right-0 transform translate-x-full`}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-r-md shadow-md ${
              settings.darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'
            }`}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Sidebar Header */}
      <div className={`p-4 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} border-b ${
        settings.darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {isExpanded && (
          <h2 className={`font-bold text-lg ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>
            Admin Panel
          </h2>
        )}
        {!isMobile && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded-full ${
              settings.darkMode 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            {isExpanded ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 pt-4 overflow-y-auto">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.id)}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                    isActive
                      ? settings.darkMode
                        ? 'bg-primary-900/30 text-primary-400'
                        : 'bg-primary-50 text-primary-700'
                      : settings.darkMode
                        ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                  } ${isExpanded ? 'justify-start' : 'justify-center'}`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary-500' : ''}`} />
                  {isExpanded && (
                    <span className="ml-3 text-sm font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className={`p-4 border-t ${
        settings.darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {isExpanded ? (
          <div className={`text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Becky Beauty Admin
          </div>
        ) : (
          <div className="flex justify-center">
            <Settings className={`h-5 w-5 ${
              settings.darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </div>
        )}
      </div>
    </div>
  );
}