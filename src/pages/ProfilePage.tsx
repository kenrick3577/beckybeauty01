import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthGuard from '../components/layout/AuthGuard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate } from '../lib/utils';
import { User, Mail, Phone, Calendar, Sparkles, Shield } from 'lucide-react';
import EditProfileForm from '../components/profile/EditProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import ProfilePictureUpload from '../components/profile/ProfilePictureUpload';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { profile, isLoading, isAdmin, user, refetchProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileLoadRetry, setProfileLoadRetry] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      toast('You are logged in as an administrator', {
        icon: '👑',
        duration: 4000
      });
    }
  }, [isAdmin]);

  // Add retry mechanism for profile loading
  useEffect(() => {
    if (user && !profile && !isLoading && profileLoadRetry < 3) {
      const timer = setTimeout(() => {
        console.log(`Retrying profile fetch (attempt ${profileLoadRetry + 1})`);
        refetchProfile();
        setProfileLoadRetry(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, profile, isLoading, profileLoadRetry, refetchProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Not Found</h2>
          <p className="mt-2 text-gray-600 mb-6">We're having trouble loading your profile data.</p>
          <button 
            onClick={() => {
              refetchProfile();
              setProfileLoadRetry(0);
              toast.success("Retrying profile load...");
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Profile Not Found</h2>
          <p className="mt-2 text-gray-600">Please try signing in again.</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 animate-fade-in">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Profile Header */}
          <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row items-center md:items-start md:justify-between gap-6">
            <div className="flex flex-col items-center text-center md:text-left md:items-start">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile.name || 'User'}</h2>
              <p className="text-sm text-gray-500 mb-4">Member since {formatDate(profile.created_at)}</p>
              
              {profile.role === 'admin' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-4">
                  <Shield className="h-3 w-3 mr-1" />
                  Administrator
                </span>
              )}
              
              <div className="mt-4 flex flex-col sm:flex-row sm:space-x-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-2 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="mt-2 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Change Password
                </button>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <ProfilePictureUpload />
            </div>
          </div>
          
          {/* Profile Information */}
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <User className="h-5 w-5 mr-2 text-gray-400" />
                  Full name
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.name}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-gray-400" />
                  Email address
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.email}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-gray-400" />
                  Mobile number
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.mobile}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                  Member since
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {profile.created_at ? formatDate(profile.created_at) : 'Not available'}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-gray-400" />
                  Membership status
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active Member
                  </span>
                  {profile.account_type !== 'basic' && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {profile.account_type.charAt(0).toUpperCase() + profile.account_type.slice(1)}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {isEditing && (
          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Profile</h3>
                  <EditProfileForm onClose={() => setIsEditing(false)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {isChangingPassword && (
          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Change Password</h3>
                  <ChangePasswordForm onClose={() => setIsChangingPassword(false)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}