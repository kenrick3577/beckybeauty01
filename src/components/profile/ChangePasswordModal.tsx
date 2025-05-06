import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type ChangePasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

interface ChangePasswordModalProps {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>();

  const newPassword = watch('newPassword');

  const onSubmit = async (data: ChangePasswordFormData) => {
    setCurrentPasswordError('');
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('User email not found');
      }

      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          setCurrentPasswordError('Incorrect current password');
        } else {
          toast.error('Failed to verify current password');
        }
        setIsLoading(false);
        return;
      }

      // If current password is correct, proceed with password update
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (updateError) throw updateError;

      toast.success('Password changed successfully. Please sign in with your new password.');
      reset();
      await signOut();
      navigate('/login');
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.status === 400 || error.status === 401) {
        toast.error('Your session has expired. Please sign in again.');
        await signOut();
        navigate('/login');
      } else {
        toast.error(error.message || 'Failed to update password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setCurrentPasswordError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Password Field */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  {...register('currentPassword', { required: 'Current password is required' })}
                  className={`block w-full pl-10 pr-10 py-2 border ${
                    currentPasswordError ? 'border-error-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {currentPasswordError && (
                <p className="mt-1 text-sm text-error-600">{currentPasswordError}</p>
              )}
            </div>

            {/* New Password Field */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  {...register('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                    pattern: {
                      value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
                      message: 'Password must contain at least one letter and one number',
                    },
                  })}
                  className={`block w-full pl-10 pr-10 py-2 border ${
                    errors.newPassword ? 'border-error-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-error-600">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === newPassword || 'Passwords do not match',
                  })}
                  className={`block w-full pl-10 pr-10 py-2 border ${
                    errors.confirmPassword ? 'border-error-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}