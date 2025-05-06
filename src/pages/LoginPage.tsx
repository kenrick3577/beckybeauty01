import React from 'react';
import { useLocation } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

export default function LoginPage() {
  const location = useLocation();
  const message = location.state?.message;

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Becky Beauty</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {message && (
          <div className="bg-success-50 text-success-800 p-4 rounded-md mb-4 mx-auto max-w-md">
            {message}
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  );
}