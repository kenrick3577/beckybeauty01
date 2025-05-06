import React, { useState, useRef, useEffect } from 'react';
import { User, Trash2, Upload, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { supabase, getImageUrlWithCacheBusting, getStorageFilePath } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner'; 
import toast from 'react-hot-toast'; 

export default function ProfilePictureUpload() {
  const { user, profile, refetchProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now().toString());
  const [imageError, setImageError] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showUploadDetails, setShowUploadDetails] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getImageUrl = () => {
    if (!profile?.profile_picture_url) return null;
    
    try {
      // If we have a local preview image (during upload process), use that first
      if (localImageUrl) return localImageUrl;
    
      // Otherwise use the profile picture with cache busting
      return getImageUrlWithCacheBusting(profile.profile_picture_url);
    } catch (e) {
      console.error("Invalid URL:", profile.profile_picture_url);
      return profile.profile_picture_url;
    }
  };

  useEffect(() => {
    if (profile?.profile_picture_url) {
      setRefreshKey(Date.now().toString());
      setImageError(false);
    }
  }, [profile?.profile_picture_url]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      return;
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    // If user already has a profile picture, show confirmation
    if (profile?.profile_picture_url) {
      setPendingFile(file);
      setShowConfirmation(true);
      return;
    }
    
    // Otherwise proceed with upload
    await uploadImage(file);
  };
  
  const uploadImage = async (file: File) => {
    if (!user) return;
    
    // Create temporary local preview right away
    const reader = new FileReader();
    reader.onload = (e) => {
      setLocalImageUrl(e.target?.result as string);
      setImageError(false);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setShowUploadDetails(true);
    setUploadProgress(0);
    setUploadStatus('Starting upload...');
    
    try {
      setUploadStatus('Preparing image for upload...');
      setUploadProgress(10);
      
      // Delete old profile picture if exists
      if (profile?.profile_picture_url) {
        try {
          setUploadStatus('Removing previous profile picture...');
          setUploadProgress(20);
          
          // Extract path from URL if it's a Supabase storage URL
          const filePath = getStorageFilePath(profile.profile_picture_url);
          if (filePath) {
            console.log("Attempting to delete file:", filePath);
            
            const { error: deleteError } = await supabase.storage
              .from('profile-pictures')
              .remove([filePath]);
              
            if (deleteError) {
              console.warn("Error deleting file:", deleteError);
              // Continue anyway - we'll overwrite the profile URL
            }
          }
        } catch (error) {
          console.warn('Failed to delete old profile picture:', error);
          // Continue with upload even if delete fails
        }
      }
      
      // Upload new profile picture
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      const contentType = file.type;
      
      setUploadStatus('Uploading image to server...');
      setUploadProgress(40);
      
      console.log("Uploading file to path:", filePath);
      
      // Upload with explicit content type
      const { data, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType
        });
      
      if (uploadError) throw uploadError;
      
      console.log("Upload successful, data:", data);
      
      // Get public URL
      setUploadStatus('Generating public URL...');
      setUploadProgress(70);
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(data?.path || filePath);
      
      console.log('Generated public URL:', publicUrl);
      
      // Update user profile directly without using RPC function
      setUploadStatus('Updating profile...');
      setUploadProgress(80);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          profile_picture_url: publicUrl
        })
        .eq('id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log('Profile picture updated in database');
      
      // Force refresh
      setUploadStatus('Refreshing profile data...');
      setUploadProgress(90);
      
      // Wait to ensure database updates are complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refetchProfile();
      
      // Update local state
      setRefreshKey(Date.now().toString());
      setImageError(false);
      
      setUploadProgress(100);
      setUploadStatus('Upload complete!');
      
      toast.success('Profile picture uploaded successfully');
      
      // Hide details after a delay
      setTimeout(() => {
        setShowUploadDetails(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      setUploadStatus(`Upload failed: ${error.message || 'Unknown error'}`);
      setUploadProgress(0);
      toast.error('Error uploading profile picture: ' + (error.message || 'Unknown error'));
      
      // Clear local image on error
      setLocalImageUrl(null);
    } finally {
      setIsUploading(false);
      setPendingFile(null);
    }
  };

  const handleDelete = async (showToast = true) => {
    if (!user || !profile?.profile_picture_url) return;

    if (showToast) setIsDeleting(true);
    setLocalImageUrl(null);
    
    try {
      // Extract the file path from the URL if it's a Supabase storage URL
      const filePath = getStorageFilePath(profile.profile_picture_url);
      
      if (filePath) {
        console.log("Deleting file:", filePath);
        
        const { error: deleteError } = await supabase.storage
          .from('profile-pictures')
          .remove([filePath]);
        
        if (deleteError) {
          console.warn("Failed to delete file from storage:", deleteError);
          // Continue anyway - we'll still update the user record
        }
      }
      
      // Update user profile directly
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: null })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Force refresh
      setRefreshKey(Date.now().toString());
      
      // Wait to ensure database updates are complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refetchProfile();
      
      if (showToast) {
        toast.success('Profile picture removed successfully');
      }
    } catch (error: any) {
      console.error('Error deleting profile picture:', error);
      if (showToast) {
        toast.error(error.message || 'Failed to delete profile picture');
      }
    } finally {
      if (showToast) setIsDeleting(false);
    }
  };

  const handleImageClick = () => {
    if (!isUploading && !isDeleting) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-xs sm:max-w-sm">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Replace Profile Picture?</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-4">
              You already have a profile picture. Would you like to replace it with the new image?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setPendingFile(null);
                }}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  if (pendingFile) {
                    uploadImage(pendingFile);
                  }
                }}
                className="px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div 
        className="relative group cursor-pointer"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleImageClick}
      >
        {getImageUrl() ? (
          <img
            key={refreshKey}
            src={getImageUrl() || undefined}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-primary-100 shadow-lg transition-all duration-200 bg-gray-50"
            onError={(e) => {
              console.error("Image load error:", getImageUrl());
              setImageError(true);
              toast.error('Failed to load profile picture');
            }}
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
            <User className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {/* Overlay on hover */}
        {isHovering && !isUploading && !isDeleting && (
          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center transition-opacity duration-200">
            <Camera className="h-8 w-8 text-white" />
          </div>
        )}
        
        {/* Loading overlay */}
        {(isUploading || isDeleting) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex flex-col items-center justify-center">
            <LoadingSpinner size="sm" />
            {isUploading && (
              <div className="mt-2 text-xs text-white">
                {Math.round(uploadProgress)}%
              </div>
            )}
          </div>
        )}
        
        {/* Upload success indicator */}
        {!isUploading && uploadProgress === 100 && (
          <div className="absolute -bottom-2 -right-2 bg-success-500 text-white rounded-full p-1">
            <CheckCircle className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Upload progress and status */}
      {showUploadDetails && (
        <div className="w-full max-w-xs px-2 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-gray-700 flex items-center">
              {isUploading ? (
                <Upload className="h-3 w-3 mr-1 text-primary-500 animate-pulse" />
              ) : uploadProgress === 100 ? (
                <CheckCircle className="h-3 w-3 mr-1 text-success-500" />
              ) : uploadProgress === 0 && !isUploading ? (
                <AlertCircle className="h-3 w-3 mr-1 text-error-500" />
              ) : (
                <Upload className="h-3 w-3 mr-1 text-gray-400" />
              )}
              <span className="truncate max-w-[150px]">{uploadStatus}</span>
            </span>
            <span className="font-medium text-gray-700">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                uploadProgress === 100 
                  ? 'bg-success-600' 
                  : uploadProgress === 0 && !isUploading 
                    ? 'bg-error-600'
                    : 'bg-primary-600'
              }`} 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-2">
        <input
          type="file"
          id="profile-picture-input"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/jpg,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload profile picture"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isDeleting}
          className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-xs"
        >
          <Upload className="h-4 w-4 mr-2" />
          {profile?.profile_picture_url ? 'Change Picture' : 'Upload Picture'}
        </button>
        {profile?.profile_picture_url && (
          <button
            onClick={() => handleDelete(true)}
            disabled={isUploading || isDeleting} 
            className="p-2 text-error-600 hover:text-error-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md flex items-center justify-center"
            aria-label="Delete profile picture"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Image guidelines */}
      <div className="text-[10px] text-gray-500 text-center max-w-xs px-2">
        <p className="mb-1">Accepted formats: JPG, PNG, GIF (Max 5MB)</p>
        <p>Recommended size: 500×500 pixels</p>
      </div>
    </div>
  );
}