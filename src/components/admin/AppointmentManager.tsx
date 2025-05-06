import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Calendar, User, Phone, Mail, MessageSquare, ArrowUp, ArrowDown } from 'lucide-react';
import { useAppointmentStore } from '../../store/appointmentStore';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatDate, formatTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useAdminSettingsStore } from '../../store/adminSettingsStore';
import ToggleSwitch from '../ui/ToggleSwitch';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function AppointmentManager() {
  const { appointments, fetchAppointments, isLoading } = useAppointmentStore();
  const { settings } = useAdminSettingsStore();
  const { isAdmin } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'time' | 'name' | 'service'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isInitialized) {
      fetchAppointments();
      setIsInitialized(true);
    }
  }, [fetchAppointments, isInitialized]);

  useEffect(() => {
    if (isInitialized && appointments.length === 0 && !isLoading && retryCount < 3) {
      const timer = setTimeout(() => {
        fetchAppointments();
        setRetryCount(prev => prev + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized, appointments.length, isLoading, retryCount, fetchAppointments]);

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      if (newStatus === 'approved') {
        const appointment = appointments.find(a => a.id === id);
        if (appointment && appointment.user) {
          if (settings.emailNotifications) {
            await sendNotificationEmail(appointment);
          }
          
          if (settings.smsNotifications) {
            await sendNotificationSMS(appointment);
          }
          
          toast.success(`Appointment approved! Notification sent to ${appointment.user.name || appointment.user.email}`);
        }
      } else {
        toast.success('Appointment status changed to pending');
      }
      
      fetchAppointments();
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error("Failed to update appointment status");
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleReject = (id: string) => {
    setSelectedAppointment(id);
    setShowNoteModal(true);
  };

  const confirmReject = async () => {
    if (selectedAppointment) {
      try {
        const { error } = await supabase
          .from('appointments')
          .update({ 
            status: 'rejected',
            notes: noteText 
          })
          .eq('id', selectedAppointment);

        if (error) throw error;
        
        toast.success('Appointment rejected');
        setShowNoteModal(false);
        setNoteText('');
        setSelectedAppointment(null);
        fetchAppointments();
      } catch (error) {
        console.error("Error rejecting appointment:", error);
        toast.error("Failed to reject appointment");
      }
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Appointment marked as completed');
      fetchAppointments();
    } catch (error) {
      console.error("Error completing appointment:", error);
      toast.error("Failed to complete appointment");
    }
  };

  const sendNotificationEmail = async (appointment: any) => {
    try {
      console.log(`Sending email notification to ${appointment.user.email} for appointment on ${appointment.date}`);
      toast.success(`Email notification would be sent to ${appointment.user.email || 'user'}`);
      return true;
    } catch (error) {
      console.error("Failed to send email notification:", error);
      return false;
    }
  };
  
  const sendNotificationSMS = async (appointment: any) => {
    try {
      console.log(`Sending SMS notification to ${appointment.user.mobile} for appointment on ${appointment.date}`);
      toast.success(`SMS notification would be sent to ${appointment.user.mobile || 'user'}`);
      return true;
    } catch (error) {
      console.error("Failed to send SMS notification:", error);
      return false;
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="py-10" />;
  }

  let filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      (appointment.user?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (appointment.user?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (appointment.user?.mobile || '').includes(searchTerm) ||
      (appointment.service?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' 
      ? appointment.status !== 'completed'
      : appointment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  filteredAppointments = [...filteredAppointments].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortField) {
      case 'name':
        valueA = a.user?.name?.toLowerCase() || '';
        valueB = b.user?.name?.toLowerCase() || '';
        break;
      case 'service':
        valueA = a.service?.name?.toLowerCase() || '';
        valueB = b.service?.name?.toLowerCase() || '';
        break;
      case 'time':
        valueA = a.time;
        valueB = b.time;
        break;
      default:
        valueA = new Date(`${a.date} ${a.time}`).getTime();
        valueB = new Date(`${b.date} ${b.time}`).getTime();
    }

    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
        <div className="flex items-center space-x-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`block w-full sm:w-auto pl-3 pr-10 py-3 border rounded-lg leading-5 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-xs ${
              settings.darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-100' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">Active Appointments</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            className={`block w-full pl-3 pr-3 py-3 border rounded-lg leading-5 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-xs ${
              settings.darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="Search appointments..."
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
                <th scope="col" className={`px-3 py-2 text-left font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/4`}>
                  <button 
                    onClick={() => handleSort('name')}
                    className="group flex items-center space-x-1 focus:outline-none"
                  >
                    <span>Customer</span>
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className={`px-3 py-2 text-left font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/4 hidden sm:table-cell`}>
                  <button 
                    onClick={() => handleSort('service')}
                    className="group flex items-center space-x-1 focus:outline-none"
                  >
                    <span>Service</span>
                    {sortField === 'service' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className={`px-3 py-2 text-left font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/4`}>
                  <button 
                    onClick={() => handleSort('date')}
                    className="group flex items-center space-x-1 focus:outline-none"
                  >
                    <span>Date</span>
                    {sortField === 'date' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className={`px-3 py-2 text-left font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/4 hidden sm:table-cell`}>
                  <button 
                    onClick={() => handleSort('time')}
                    className="group flex items-center space-x-1 focus:outline-none"
                  >
                    <span>Time</span>
                    {sortField === 'time' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className={`px-3 py-2 text-left font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/4`}>
                  Status
                </th>
                <th scope="col" className={`px-3 py-2 text-right font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider hidden sm:table-cell`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${settings.darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'} text-xs`}>
              {paginatedAppointments.length === 0 ? (
                <tr className="text-center">
                  <td colSpan={6} className={`px-3 py-3 ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No appointments found
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((appointment) => (
                  <tr key={appointment.id} className={settings.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className="px-3 py-3">
                      <div className={`font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {appointment.user?.name || 'Unknown User'}
                      </div>
                      <div className="flex flex-col mt-1">
                        <a href={`mailto:${appointment.user?.email}`} className={`flex items-center truncate ${settings.darkMode ? 'text-gray-300 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                          <Mail className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" />
                          <span className="truncate">{appointment.user?.email || 'No email'}</span>
                        </a>
                        <a href={`tel:${appointment.user?.mobile}`} className={`flex items-center mt-1 truncate ${settings.darkMode ? 'text-gray-300 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                          <Phone className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" />
                          <span className="truncate">{appointment.user?.mobile || 'No phone'}</span>
                        </a>
                      </div>
                    </td>
                    <td className={`px-3 py-3 hidden sm:table-cell ${settings.darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div>
                        <div>{appointment.service?.name || 'Unknown Service'}</div>
                        <div className="text-primary-600 font-medium mt-1">
                          ${appointment.service?.price?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </td>
                    <td className={`px-3 py-3 ${settings.darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="flex items-center">
                        <Calendar className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" />
                        <span>{formatDate(appointment.date)}</span>
                      </div>
                    </td>
                    <td className={`px-3 py-3 hidden sm:table-cell ${settings.darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="flex items-center">
                        <Clock className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" />
                        <span>{formatTime(appointment.time)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {appointment.status !== 'rejected' && appointment.status !== 'completed' && (
                        <div className="flex items-center">
                          <ToggleSwitch
                            checked={appointment.status === 'approved'}
                            onChange={() => handleStatusToggle(appointment.id, appointment.status)}
                            color="green"
                          />
                          <span className="ml-3 font-medium text-gray-900 dark:text-gray-300 hidden sm:inline">
                            {appointment.status === 'approved' ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                      )}
                      {appointment.status === 'rejected' && (
                        <span className="px-2 inline-flex leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Rejected
                        </span>
                      )}
                      {appointment.status === 'completed' && (
                        <span className="px-2 inline-flex leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-medium hidden sm:table-cell">
                      <div className="flex items-center justify-end space-x-2">
                        {appointment.status === 'pending' && (
                          <button
                            onClick={() => handleReject(appointment.id)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-error-600 hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        )}
                        {appointment.status === 'approved' && (
                          <button
                            onClick={() => handleComplete(appointment.id)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={`px-6 py-3 flex items-center justify-between border-t ${
            settings.darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          } text-xs sm:text-sm`}>
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-3 py-2 border font-medium ${
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
                className={`ml-3 relative inline-flex items-center px-3 py-2 border font-medium ${
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
                <p className={`${settings.darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredAppointments.length)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAppointments.length)}</span> of{' '}
                  <span className="font-medium">{filteredAppointments.length}</span> results
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

      {showNoteModal && (
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
                <h3 className={`text-lg leading-6 font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>Rejection Reason</h3>
                <div className="mt-4">
                  <textarea
                    rows={4}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      settings.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    }`}
                    placeholder="Please provide a reason for rejecting this appointment..."
                  />
                </div>
              </div>
              <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${settings.darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'}`}>
                <button
                  type="button"
                  onClick={confirmReject}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Reject Appointment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteModal(false);
                    setNoteText('');
                    setSelectedAppointment(null);
                  }}
                  className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
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