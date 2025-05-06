import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar, Search, Activity, Shield } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { useAdminSettingsStore } from '../../store/adminSettingsStore';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatDate } from '../../lib/utils';
import ToggleSwitch from '../ui/ToggleSwitch';
import toast from 'react-hot-toast';

export default function MemberManager() {
  const { users, fetchUsers, toggleUserRole, updateUserStatus, isLoading } = useAdminStore();
  const { settings } = useAdminSettingsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    show: boolean;
    userId: string;
    action: 'role' | 'status';
    message: string;
    newValue: string;
  }>({ show: false, userId: '', action: 'role', message: '', newValue: '' });
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isInitialized) {
      fetchUsers();
      setIsInitialized(true);
    }
  }, [fetchUsers, isInitialized]);

  useEffect(() => {
    if (isInitialized && users.length === 0 && !isLoading && retryCount < 3) {
      const timer = setTimeout(() => {
        fetchUsers();
        setRetryCount(prev => prev + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized, users.length, isLoading, retryCount, fetchUsers]);

  const handleConfirmAction = async () => {
    if (!showConfirmDialog.show) return;

    try {
      let success = false;
      if (showConfirmDialog.action === 'role') {
        success = await toggleUserRole(
          showConfirmDialog.userId, 
          showConfirmDialog.newValue as 'user' | 'admin'
        );
      } else if (showConfirmDialog.action === 'status') {
        success = await updateUserStatus(
          showConfirmDialog.userId, 
          showConfirmDialog.newValue as 'active' | 'inactive'
        );
      }

      if (success) {
        setShowConfirmDialog({ show: false, userId: '', action: 'role', message: '', newValue: '' });
      }
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="py-10" />;
  }

  if (users.length === 0 && retryCount >= 3) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No members found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">There was a problem loading the member list.</p>
        <button
          onClick={() => {
            setRetryCount(0);
            fetchUsers();
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredMembers = users.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="mb-6">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className={`block w-full pl-8 pr-3 py-3 border rounded-lg leading-5 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm ${
              settings.darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={`shadow overflow-hidden border rounded-lg ${
        settings.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={`${settings.darkMode ? 'bg-gray-700' : 'bg-gray-50'} text-xs`}>
              <tr>
                <th scope="col" className={`px-3 py-2 text-left font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-2/5`}>
                  Member
                </th>
                <th scope="col" className={`px-3 py-2 text-left font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/5 hidden sm:table-cell`}>
                  Contact
                </th>
                <th scope="col" className={`px-3 py-2 text-left font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/5`}>
                  Status
                </th>
                <th scope="col" className={`px-3 py-2 text-left font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/5`}>
                  Role
                </th>
              </tr>
            </thead>
            <tbody className={`${settings.darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'} text-xs`}>
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`px-3 py-3 text-center ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No members found
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => (
                  <tr key={member.id} className={settings.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className="px-3 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className={`font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'} truncate max-w-[120px] sm:max-w-none`}>
                            {member.name || 'No Name'}
                          </div>
                          <div className={`${settings.darkMode ? 'text-gray-400' : 'text-gray-500'} text-[10px] sm:text-xs`}>
                            Joined {formatDate(member.created_at)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-3 py-3 hidden sm:table-cell ${settings.darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <Mail className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" />
                          <span className="truncate max-w-[150px] sm:max-w-none">{member.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" />
                          <span className="truncate max-w-[150px] sm:max-w-none">{member.mobile || 'No phone'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center">
                        <ToggleSwitch
                          checked={member.account_status === 'active'}
                          onChange={() => {
                            if (member.email === 'iceiceiceiceice5@gmail.com') {
                              toast.error("Cannot modify this user's status");
                              return;
                            }
                            const newStatus = member.account_status === 'active' ? 'inactive' : 'active';
                            setShowConfirmDialog({
                              show: true,
                              userId: member.id,
                              action: 'status',
                              newValue: newStatus,
                              message: `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${member.name || member.email}?`
                            });
                          }}
                          disabled={member.email === 'iceiceiceiceice5@gmail.com'}
                          color="green"
                        />
                        <span className="ml-3 font-medium text-gray-900 dark:text-gray-300 hidden sm:inline">
                          {member.account_status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center">
                        <ToggleSwitch
                          checked={member.role === 'admin'}
                          onChange={() => {
                            if (member.email === 'iceiceiceiceice5@gmail.com') {
                              toast.error("Cannot modify this user's role");
                              return;
                            }
                            const newRole = member.role === 'admin' ? 'user' : 'admin';
                            setShowConfirmDialog({
                              show: true,
                              userId: member.id,
                              action: 'role',
                              newValue: newRole,
                              message: `Are you sure you want to change ${member.name || member.email}'s role to ${newRole}?`
                            });
                          }}
                          disabled={member.email === 'iceiceiceiceice5@gmail.com'}
                          color="purple"
                        />
                        <span className="ml-3 font-medium text-gray-900 dark:text-gray-300 items-center hidden sm:flex">
                          <Shield className="h-3 w-3 mr-1" />
                          <span>{member.role === 'admin' ? 'Admin' : 'User'}</span>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-6 py-3 flex items-center justify-between border-t ${
            settings.darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  settings.darkMode
                    ? 'border-gray-700 bg-gray-800 text-gray-300 disabled:text-gray-600'
                    : 'border-gray-300 bg-white text-gray-700 disabled:text-gray-400'
                } disabled:opacity-50`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  settings.darkMode
                    ? 'border-gray-700 bg-gray-800 text-gray-300 disabled:text-gray-600'
                    : 'border-gray-300 bg-white text-gray-700 disabled:text-gray-400'
                } disabled:opacity-50`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className={`text-sm ${settings.darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredMembers.length)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredMembers.length)}</span> of{' '}
                  <span className="font-medium">{filteredMembers.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                      settings.darkMode
                        ? 'border-gray-700 bg-gray-800 text-gray-300 disabled:text-gray-600'
                        : 'border-gray-300 bg-white text-gray-500 disabled:text-gray-300'
                    } disabled:opacity-50`}
                  >
                    <span className="sr-only">First</span>
                    <span aria-hidden="true">&laquo;</span>
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === i + 1
                          ? settings.darkMode
                            ? 'z-10 bg-gray-700 border-gray-500 text-white'
                            : 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : settings.darkMode
                            ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                      settings.darkMode
                        ? 'border-gray-700 bg-gray-800 text-gray-300 disabled:text-gray-600'
                        : 'border-gray-300 bg-white text-gray-500 disabled:text-gray-300'
                    } disabled:opacity-50`}
                  >
                    <span className="sr-only">Last</span>
                    <span aria-hidden="true">&raquo;</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog.show && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className={`absolute inset-0 ${settings.darkMode ? 'bg-gray-900' : 'bg-gray-500'} opacity-75`}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
              settings.darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${settings.darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <h3 className={`text-lg leading-6 font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Confirm Action
                    </h3>
                    <div className="mt-2">
                      <p className={`text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {showConfirmDialog.message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${settings.darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'}`}>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                    showConfirmDialog.action === 'role'
                      ? 'bg-primary-600 hover:bg-primary-700'
                      : 'bg-warning-600 hover:bg-warning-700'
                  }`}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDialog({ show: false, userId: '', action: 'role', message: '', newValue: '' })}
                  className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                    settings.darkMode 
                      ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}