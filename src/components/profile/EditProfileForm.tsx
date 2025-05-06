import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

type ProfileFormData = {
  name: string;
  email: string;
  mobile: string;
};

interface EditProfileFormProps {
  onClose: () => void;
}

export default function EditProfileForm({ onClose }: EditProfileFormProps) {
  const { profile, refetchProfile, isAdmin, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: profile?.name || '',
      email: profile?.email || '',
      mobile: profile?.mobile || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update the users table without updated_at field
      const { error } = await supabase
        .from('users')
        .update({
          name: data.name,
          email: data.email,
          mobile: data.mobile
        })
        .eq('id', user.id);

      if (error) throw error;
      
      await refetchProfile();
      toast.success('Profile updated successfully');
      onClose();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'Name is required' })}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        {errors.name && (
          <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            id="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
          Mobile Number
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="tel"
            id="mobile"
            {...register('mobile', {
              required: 'Mobile number is required',
              pattern: {
                value: /^[0-9]{10,15}$/,
                message: 'Please enter a valid mobile number',
              },
            })}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        {errors.mobile && (
          <p className="mt-1 text-sm text-error-600">{errors.mobile.message}</p>
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
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}