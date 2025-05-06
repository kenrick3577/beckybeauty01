import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 text-center animate-fade-in">
      <ShieldOff className="h-16 w-16 text-error-500 mb-4" />
      <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Access Denied</h1>
      <p className="mt-4 text-lg text-gray-500">
        You don't have permission to access this page.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Go Back
        </button>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}