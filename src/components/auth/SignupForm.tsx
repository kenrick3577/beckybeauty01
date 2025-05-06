import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';

type SignupFormValues = {
  name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
};

export default function SignupForm() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>();

  const password = watch('password');
  const email = watch('email');

  // Check if email exists when email field changes
  useEffect(() => {
    const checkEmail = async () => {
      if (!email || !email.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i)) {
        setEmailExists(false);
        return;
      }

      setIsCheckingEmail(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('email')
          .eq('email', email.toLowerCase());

        // If we get data back and it has length, the email exists
        setEmailExists(data && data.length > 0);
      } catch (err) {
        console.error('Error checking email:', err);
        // Don't set emailExists on error to allow the signup attempt
        setEmailExists(false);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const debounceTimer = setTimeout(checkEmail, 500);
    return () => clearTimeout(debounceTimer);
  }, [email]);

  const onSubmit = async (data: SignupFormValues) => {
    if (emailExists) {
      setError('This email is already registered. Please log in or use a different email.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { error } = await signUp(data.email, data.password, data.name, data.mobile);
      
      if (error) {
        if (error.message === 'User already registered') {
          throw new Error('This email is already registered. Please log in or use a different email.');
        }
        throw new Error(error.message || 'Failed to sign up');
      }
      
      setSignupSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="max-w-md w-full space-y-6 sm:space-y-8 bg-white p-5 sm:p-8 rounded-lg shadow-md">
        <div className="text-center px-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Check your email</h2>
          <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
            <p>We've sent a confirmation link to your email address.</p>
            <p className="mt-1 sm:mt-2">Please check your email (including spam folder) and click the link to activate your account.</p>
          </div>
          <div className="mt-4 sm:mt-6">
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-3 sm:py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-6 sm:space-y-8 bg-white p-5 sm:p-8 rounded-lg shadow-md">
      <div className="text-center px-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Create an account</h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-600">
          Join Becky Beauty today
        </p>
      </div>
      
      {error && (
        <div className="bg-error-50 text-error-800 p-3 sm:p-4 rounded-md text-xs sm:text-sm">
          {error}
        </div>
      )}
      
      <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700">
              Full Name
            </label>
            <div className="mt-1 relative rounded-md">
              <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                id="name"
                type="text"
                autoComplete="name"
                {...register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters',
                  },
                })}
                className={`block w-full pl-8 sm:pl-10 pr-3 py-3 sm:py-2 border text-sm ${
                  errors.name ? 'border-error-500' : 'border-gray-300'
                } rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500`}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs sm:text-sm text-error-600">{errors.name.message}</p>
            )}
          </div>
          
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
                  errors.email || emailExists ? 'border-error-500' : 'border-gray-300'
                } rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500`}
              />
              {isCheckingEmail && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
            {errors.email && (
              <p className="mt-1 text-xs sm:text-sm text-error-600">{errors.email.message}</p>
            )}
            {emailExists && !errors.email && (
              <p className="mt-1 text-sm text-error-600">
                This email is already registered. Please{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  log in
                </Link>
                {' '}or use a different email.
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="mobile" className="block text-xs sm:text-sm font-medium text-gray-700">
              Mobile Number
            </label>
            <div className="mt-1 relative rounded-md">
              <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input 
                id="mobile"
                type="tel"
                autoComplete="tel"
                {...register('mobile', {
                  required: 'Mobile number is required',
                  pattern: {
                    value: /^[0-9]{10,15}$/,
                    message: 'Please enter a valid mobile number',
                  },
                })}
                className={`block w-full pl-8 sm:pl-10 pr-3 py-3 sm:py-2 border text-sm ${
                  errors.mobile ? 'border-error-500' : 'border-gray-300'
                } rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500`}
              />
            </div>
            {errors.mobile && (
              <p className="mt-1 text-xs sm:text-sm text-error-600">{errors.mobile.message}</p>
            )}
          </div>
          
          <div> 
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.password ? 'border-error-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500`}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match',
                })}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.confirmPassword ? 'border-error-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || isCheckingEmail || emailExists}
            className="w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Sign up'}
          </button>
        </div>
        
        <div className="text-center text-xs sm:text-sm">
          <p className="text-gray-600 mt-4 sm:mt-0">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}