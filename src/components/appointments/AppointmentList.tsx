import React, { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Clock3, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppointmentStore } from '../../store/appointmentStore';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatDate, formatTime } from '../../lib/utils';

export default function AppointmentList() {
  const { user } = useAuth();
  const { userAppointments = [], fetchUserAppointments, isLoading } = useAppointmentStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (user && !isInitialized) {
      fetchUserAppointments(user.id);
      setIsInitialized(true);
    }
  }, [user, fetchUserAppointments, isInitialized]);

  // Add retry mechanism for loading
  useEffect(() => {
    if (isInitialized && (!Array.isArray(userAppointments) || userAppointments.length === 0) && !isLoading && retryCount < 3) {
      const timer = setTimeout(() => {
        if (user) {
          fetchUserAppointments(user.id);
          setRetryCount(prev => prev + 1);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized, userAppointments, isLoading, retryCount, fetchUserAppointments, user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock3 className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-warning-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to view your appointments.
        </p>
      </div>
    );
  }

  if (!Array.isArray(userAppointments) || userAppointments.length === 0) {
    return (
      <div className="text-center py-10">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No appointments yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          You haven't booked any appointments yet. Book your first appointment to get started.
        </p>
      </div>
    );
  }

  // Sort appointments: upcoming first, then past in reverse chronological order
  const now = new Date();
  const sortedAppointments = [...userAppointments].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    const isAUpcoming = dateA >= now;
    const isBUpcoming = dateB >= now;

    if (isAUpcoming && !isBUpcoming) return -1;
    if (!isAUpcoming && isBUpcoming) return 1;
    if (isAUpcoming) return dateA.getTime() - dateB.getTime();
    return dateB.getTime() - dateA.getTime();
  });

  // Split appointments into upcoming and past
  const { upcoming, past } = sortedAppointments.reduce((acc, appointment) => {
    const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
    if (appointmentDate >= now) {
      acc.upcoming.push(appointment);
    } else {
      acc.past.push(appointment);
    }
    return acc;
  }, { upcoming: [], past: [] });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upcoming Appointments */}
      <div className="px-2">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Upcoming Appointments</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden divide-y divide-gray-200 text-xs">
          {upcoming.length === 0 ? (
            <div className="p-3 text-center text-gray-500">
              No upcoming appointments
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {upcoming.map((appointment) => (
                <li key={appointment.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {appointment.service?.name}
                    </h3>
                    {getStatusBadge(appointment.status)}
                  </div>
                  
                  <div className="mt-2 flex flex-col">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-gray-500 text-xs">
                        <Calendar className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" />
                        <span>{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-xs">
                        <Clock className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" />
                        <span>{formatTime(appointment.time)}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-gray-500">
                      <span className="font-medium text-primary-600 text-xs">
                        ${appointment.service?.price?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="mt-2 text-gray-500 text-xs">
                      <div className="font-medium text-xs">Notes:</div>
                      <div className="line-clamp-2">{appointment.notes}</div>
                    </div>
                  )}

                  {appointment.status === 'approved' && (
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-100 text-primary-800">
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        Upcoming
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Past Appointments */}
      <div className="px-2">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Past Appointments</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden divide-y divide-gray-200 text-xs">
          {past.length === 0 ? (
            <div className="p-3 text-center text-gray-500">
              No past appointments
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {past.map((appointment) => (
                <li key={appointment.id} className="p-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {appointment.service?.name}
                    </h3>
                    {getStatusBadge(appointment.status)}
                  </div>
                  
                  <div className="mt-2 flex flex-col">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-gray-500 text-xs">
                        <Calendar className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" />
                        <span>{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-xs">
                        <Clock className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" />
                        <span>{formatTime(appointment.time)}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-gray-500">
                      <span className="font-medium text-primary-600 text-xs">
                        ${appointment.service?.price?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="mt-2 text-gray-500 text-xs">
                      <div className="font-medium text-xs">Notes:</div>
                      <div className="line-clamp-2">{appointment.notes}</div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}