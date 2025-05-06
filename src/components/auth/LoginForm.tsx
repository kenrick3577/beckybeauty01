import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const { signIn, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: signInError } = await signIn(data.email, data.password);
      
      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          throw new Error(
            'Please confirm your email address before logging in. Check your email (including spam folder) for a confirmation link from us.'
          );
        } else if (signInError.message.includes('Invalid login credentials')) {
          throw new Error(
            'The email or password you entered is incorrect. Please check your credentials and try again.'
          );
        }
        throw new Error(signInError.message || 'Failed to sign in');
      }

      // Add a small delay to ensure user profile and admin status are loaded
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if user is admin and redirect accordingly
      if (isAdmin) {
        toast.success('Welcome back, Administrator!');
        navigate('/admin');
      } else {
        navigate(from);
      }
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-6 sm:space-y-8 bg-white p-5 sm:p-8 rounded-lg shadow-md">
      <div className="text-center px-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Welcome back</h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-600">
          Sign in to your account to continue
        </p>
      </div>
      
      {error && (
        <div className="bg-error-50 text-error-800 p-3 sm:p-4 rounded-md text-xs sm:text-sm">
          <p>{error}</p>
          {error.includes('incorrect') && (
            <p className="mt-1 sm:mt-2">
              If you've forgotten your password, you can{' '}
              <Link to="/reset-password" className="text-primary-600 hover:text-primary-500 font-medium">
                reset it here
              </Link>
              .
            </p>
          )}
          {error.includes('confirm your email') && (
            <p className="mt-2">
              Didn't receive the confirmation email?{' '}
              <button 
                onClick={() => {
                  // Here you would typically call a resend confirmation email function
                  alert('Resend confirmation feature coming soon');
                }}
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Click here to resend it
              </button>
            </p>
          )}
        </div>
      )}
      
      <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1 relative rounded-md">
              <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className={`block w-full pl-8 sm:pl-10 pr-3 py-3 sm:py-2 border text-sm ${
                  errors.email ? 'border-error-500' : 'border-gray-300'
                } rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs sm:text-sm text-error-600">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative rounded-md">
              <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                className={`block w-full pl-8 sm:pl-10 pr-3 py-3 sm:py-2 border text-sm ${
                  errors.password ? 'border-error-500' : 'border-gray-300'
                } rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500`}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs sm:text-sm text-error-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-gray-900">
              Remember me
            </label>
          </div>
          <div>
            <Link to="/reset-password" className="font-medium text-primary-600 hover:text-primary-500">
              Forgot your password?
            </Link>
          </div>
        </div>

        <div className="mt-4 sm:mt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Sign in'}
          </button>
        </div>
        
        <div className="text-center text-xs sm:text-sm">
          <p className="text-gray-600 mt-4 sm:mt-0">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}