import React from 'react';
import { useAuth } from '../context/AuthContext';
import AppointmentForm from '../components/appointments/AppointmentForm';
import AppointmentList from '../components/appointments/AppointmentList';
import AuthGuard from '../components/layout/AuthGuard';

export default function AppointmentsPage() {
  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              Book an Appointment
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              Schedule your next beauty service with Becky Beauty. Select your preferred service, date, and time to book your appointment.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Note: All appointments must be approved by our staff before they are confirmed. You will receive a notification once your appointment is approved.
            </p>
          </div>
          <div className="mt-12 lg:mt-0 lg:col-span-2">
            <AppointmentForm />
          </div>
        </div>
        
        <div className="mt-16">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Your Appointments
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            View your upcoming and past appointments.
          </p>
          <div className="mt-6">
            <AppointmentList />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}