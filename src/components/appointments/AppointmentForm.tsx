import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Clock } from 'lucide-react';
import { format, parse, addDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useAppointmentStore } from '../../store/appointmentStore';
import LoadingSpinner from '../ui/LoadingSpinner';
import { generateTimeSlots } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

type AppointmentFormValues = {
  service_id: string;
  date: string;
  time: string;
  notes?: string;
};

export default function AppointmentForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { services = [], bookAppointment, fetchServices, isLoading } = useAppointmentStore();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormValues>();
  
  // Get today's date in the format required for the date input
  const today = format(new Date(), 'yyyy-MM-dd');
  // Calculate max date (e.g., 30 days from today)
  const maxDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  useEffect(() => {
    fetchServices();
    // Generate time slots
    setTimeSlots(generateTimeSlots(9, 18, 30));
  }, [fetchServices]);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/appointments' } });
    }
  }, [user, navigate]);

  const onSubmit = async (data: AppointmentFormValues) => {
    if (!user?.id) {
      navigate('/login', { state: { from: '/appointments' } });
      return;
    }
    
    setSubmitLoading(true);
    
    try {
      const success = await bookAppointment({
        user_id: user.id,
        service_id: data.service_id,
        date: data.date,
        time: data.time,
        notes: data.notes,
      });
      
      if (success) {
        reset();
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!user) {
    return null; // Don't render form if user is not authenticated
  }

  if (isLoading) {
    return <LoadingSpinner className="py-10" />;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Book an Appointment</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="service" className="block text-xs font-medium text-gray-700 mb-1">
            Service
          </label>
          <select
            id="service"
            {...register('service_id', { required: 'Please select a service' })}
            className={`block w-full border text-sm py-3 ${
              errors.service_id ? 'border-error-500' : 'border-gray-300'
            } rounded-lg shadow-sm px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 appearance-none`}
          >
            <option value="">Select a service</option>
            {Array.isArray(services) && services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - ${service.price.toFixed(2)} ({service.duration} min)
              </option>
            ))}
          </select>
          {errors.service_id && ( 
            <p className="mt-1 text-xs sm:text-sm text-error-600">{errors.service_id.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="date" className="block text-xs font-medium text-gray-700 mb-1">
            Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              id="date"
              min={today}
              max={maxDate}
              {...register('date', { required: 'Please select a date' })}
              className={`block w-full pl-10 pr-3 py-3 border text-sm ${
                errors.date ? 'border-error-500' : 'border-gray-300'
              } rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500`}
            />
          </div>
          {errors.date && (
            <p className="mt-1 text-xs text-error-600">{errors.date.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="time" className="block text-xs font-medium text-gray-700 mb-1">
            Time
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
            <select
              id="time"
              {...register('time', { required: 'Please select a time' })}
              className={`block w-full pl-10 pr-3 py-3 border text-sm ${
                errors.time ? 'border-error-500' : 'border-gray-300'
              } rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 appearance-none`}
            >
              <option value="">Select a time</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {format(parse(slot, 'HH:mm', new Date()), 'h:mm a')}
                </option>
              ))}
            </select>
          </div>
          {errors.time && (
            <p className="mt-1 text-xs text-error-600">{errors.time.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-xs font-medium text-gray-700 mb-1">
            Special Requests (Optional)
          </label>
          <textarea
            id="notes"
            rows={3}
            {...register('notes')}
            className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-xs"
            placeholder="Any special requests or additional information..."
          />
        </div>
        
        <div>
          <button
            type="submit"
            disabled={submitLoading || !user}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitLoading ? <LoadingSpinner size="sm" /> : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}