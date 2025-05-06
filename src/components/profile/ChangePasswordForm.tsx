import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type ChangePasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

interface ChangePasswordFormProps {
  onClose: () => void;
}

export default function ChangePasswordForm({ onClose }: ChangePasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordFormData>();

  const newPassword = watch('newPassword');

  const onSubmit = async (data: ChangePasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

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
          toast.error('The current password you entered is incorrect. Please try again.');
        } else {
          toast.error('Failed to verify current password. Please try again later.');
        }
        setIsLoading(false);
        return;
      }

      // If current password is correct, proceed with password update
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (updateError) {
        throw updateError;
      }

      toast.success('Password updated successfully. Please sign in with your new password.');
      await signOut();
      navigate('/login');
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.status === 400 || error.status === 401) {
        toast.error('Your session has expired. Please sign in again.');
        await signOut();
        navigate('/login');
      } else {
        toast.error(error.message || 'Failed to update password. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
          Current Password
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="password"
            id="currentPassword"
            {...register('currentPassword', { required: 'Current password is required' })}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        {errors.currentPassword && (
          <p className="mt-1 text-sm text-error-600">{errors.currentPassword.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
          New Password
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="password"
            id="newPassword"
            {...register('newPassword', {
              required: 'New password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        {errors.newPassword && (
          <p className="mt-1 text-sm text-error-600">{errors.newPassword.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm New Password
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="password"
            id="confirmPassword"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: value => value === newPassword || 'Passwords do not match',
            })}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : 'Change Password'}
        </button>
      </div>
    </form>
  );
}