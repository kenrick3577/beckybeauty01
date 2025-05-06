import React, { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Clock, DollarSign, Image as ImageIcon, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppointmentStore } from '../../store/appointmentStore';
import { useAdminSettingsStore } from '../../store/adminSettingsStore';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  image_url?: string;
}

export default function ServiceManager() {
  const { settings } = useAdminSettingsStore();
  const { services, fetchServices, isLoading } = useAppointmentStore();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    image_url: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showUploadDetails, setShowUploadDetails] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      image_url: service.image_url || ''
    });
    setPreviewImage(service.image_url || null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: service, error: fetchError } = await supabase
        .from('services')
        .select('image_url')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // If the image is stored in Supabase, delete it first
      if (service?.image_url && service.image_url.includes(supabase.supabaseUrl)) {
        const url = new URL(service.image_url);
        const pathParts = url.pathname.split('/service-images/');
        
        if (pathParts.length > 1) {
          const filePath = decodeURIComponent(pathParts[1]);
          
          const { error: deleteImageError } = await supabase.storage
            .from('service-images')
            .remove([filePath]);
          
          if (deleteImageError) {
            console.error('Error deleting service image:', deleteImageError);
            // Continue even if image deletion fails
          }
        }
      }
      
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Service deleted successfully');
      fetchServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(error.message);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    setShowUploadDetails(true);
    setUploadProgress(0);
    setUploadStatus('Starting upload...');

    try {
      setUploadStatus('Reading file...');
      setUploadProgress(10);

      // Create a local preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      setUploadStatus('Preparing to upload...');
      setUploadProgress(20);

      // Delete old image if it exists and is stored in Supabase
      if (editingService?.image_url && editingService.image_url.includes(supabase.supabaseUrl)) {
        try {
          setUploadStatus('Removing old image...');
          setUploadProgress(30);
          
          const url = new URL(editingService.image_url);
          const pathParts = url.pathname.split('/service-images/');
          
          if (pathParts.length > 1) {
            const filePath = decodeURIComponent(pathParts[1]);
            
            await supabase.storage
              .from('service-images')
              .remove([filePath]);
          }
        } catch (error) {
          console.warn('Failed to delete old service image:', error);
          // Continue with upload even if delete fails
        }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `service_${Date.now()}.${fileExt}`;

      setUploadStatus('Uploading image...');
      setUploadProgress(50);

      // Upload to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      setUploadStatus('Processing image...');
      setUploadProgress(80);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(data?.path || fileName);

      setUploadStatus('Upload complete!');
      setUploadProgress(100);

      // Update form data with new image URL
      setFormData({
        ...formData,
        image_url: publicUrl
      });

      setTimeout(() => {
        setShowUploadDetails(false);
      }, 3000);

      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadStatus(`Upload failed: ${error.message}`);
      setUploadProgress(0);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            name: formData.name,
            description: formData.description,
            duration: formData.duration,
            price: formData.price,
            image_url: formData.image_url
          })
          .eq('id', editingService.id);

        if (error) throw error;
        toast.success('Service updated successfully');
      } else {
        const { error } = await supabase
          .from('services')
          .insert([formData]);

        if (error) throw error;
        toast.success('Service added successfully');
      }

      setShowModal(false);
      setEditingService(null);
      setFormData({ name: '', description: '', duration: 30, price: 0, image_url: '' });
      setPreviewImage(null);
      fetchServices();
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="py-10" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className={`text-xl sm:text-2xl font-bold ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>
          Manage Services
        </h2>
        <button
          onClick={() => {
            setEditingService(null);
            setFormData({ name: '', description: '', duration: 30, price: 0, image_url: '' });
            setPreviewImage(null);
            setShowModal(true);
          }}
          className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
          Add Service
        </button>
      </div>

      <div className={`shadow overflow-hidden border rounded-lg ${
        settings.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } text-xs sm:text-sm`}>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className={`${settings.darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th scope="col" className={`px-2 sm:px-6 py-2 sm:py-3 text-left font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-2/5`}>
                Service
              </th>
              <th scope="col" className={`px-2 sm:px-6 py-2 sm:py-3 text-left font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/5 hidden sm:table-cell`}>
                Image
              </th>
              <th scope="col" className={`px-2 sm:px-6 py-2 sm:py-3 text-left font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/5`}>
                Duration
              </th>
              <th scope="col" className={`px-2 sm:px-6 py-2 sm:py-3 text-left font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/5`}>
                Price
              </th>
              <th scope="col" className={`px-2 sm:px-6 py-2 sm:py-3 text-right font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/5`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`${settings.darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}`}>
            {services.map((service) => (
              <tr key={service.id} className={settings.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                <td className="px-2 sm:px-6 py-3 sm:py-4">
                  <div className={`font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {service.name}
                  </div>
                  <div className={`${settings.darkMode ? 'text-gray-300' : 'text-gray-500'} truncate max-w-[150px] sm:max-w-none`}>
                    {service.description.length > 50 ? service.description.substring(0, 50) + '...' : service.description}
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                  <img 
                    src={service.image_url || 'https://images.pexels.com/photos/3738339/pexels-photo-3738339.jpeg?auto=compress&cs=tinysrgb&w=1600'} 
                    alt={service.name}
                    className="h-16 w-16 object-cover rounded-lg"
                  />
                </td>
                <td className={`px-2 sm:px-6 py-3 sm:py-4 ${settings.darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  <div className="flex items-center">
                    <Clock className="flex-shrink-0 mr-1 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    {service.duration} min
                  </div>
                </td>
                <td className={`px-2 sm:px-6 py-3 sm:py-4 ${settings.darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  <div className="flex items-center">
                    <DollarSign className="flex-shrink-0 mr-1 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    {service.price.toFixed(2)}
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-3 sm:py-4 text-right font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-error-600 hover:text-error-900"
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 overflow-y-auto z-50 px-4">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className={`absolute inset-0 ${settings.darkMode ? 'bg-gray-900' : 'bg-gray-500'} opacity-75`}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full ${
              settings.darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <form onSubmit={handleSubmit}>
                <div className={`px-3 sm:px-4 pt-4 sm:pt-5 pb-3 sm:pb-4 sm:p-6 ${settings.darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className={`text-base sm:text-lg leading-6 font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className={`block text-sm font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Service Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          settings.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="description" className={`block text-sm font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        rows={3}
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          settings.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${settings.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Service Image
                      </label>
                      <div className="mt-1 space-y-3">
                        {/* Image Preview */}
                        <div className="flex justify-center">
                          <div className="relative w-64 h-40 bg-gray-200 rounded-lg overflow-hidden">
                            {previewImage || formData.image_url ? (
                              <img
                                src={previewImage || formData.image_url}
                                alt="Service preview"
                                className="w-full h-full object-cover"
                                onError={() => {
                                  toast.error('Failed to load image preview');
                                  setPreviewImage('https://images.pexels.com/photos/3738339/pexels-photo-3738339.jpeg?auto=compress&cs=tinysrgb&w=1600');
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full w-full">
                                <ImageIcon className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                            {isUploading && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <LoadingSpinner size="md" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Upload Progress */}
                        {showUploadDetails && (
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700 flex items-center">
                                {isUploading ? (
                                  <Upload className="h-4 w-4 mr-1 text-primary-500 animate-pulse" />
                                ) : uploadProgress === 100 ? (
                                  <CheckCircle className="h-4 w-4 mr-1 text-success-500" />
                                ) : uploadProgress === 0 ? (
                                  <AlertCircle className="h-4 w-4 mr-1 text-error-500" />
                                ) : (
                                  <Upload className="h-4 w-4 mr-1 text-gray-400" />
                                )}
                                {uploadStatus}
                              </span>
                              <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
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
                        
                        {/* Upload Button */}
                        <div className="flex items-center space-x-3">
                          <input
                            type="file"
                            id="image_upload"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className={`flex items-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                              settings.darkMode
                                ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload New Image
                          </button>

                          <div className="flex-1">
                            <input
                              type="url"
                              id="image_url"
                              value={formData.image_url}
                              onChange={(e) => {
                                setFormData({ ...formData, image_url: e.target.value });
                                setPreviewImage(e.target.value);
                              }}
                              placeholder="Or enter image URL..."
                              className={`block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                                settings.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="duration" className={`block text-sm font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        id="duration"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                        required
                        min="1"
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          settings.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="price" className={`block text-sm font-medium ${settings.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Price
                      </label>
                      <input
                        type="number"
                        id="price"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        required
                        min="0"
                        step="0.01"
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          settings.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${settings.darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'}`}>
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingService ? 'Update' : 'Add'} Service
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingService(null);
                      setFormData({ name: '', description: '', duration: 30, price: 0, image_url: '' });
                      setPreviewImage(null);
                    }}
                    className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                      settings.darkMode 
                        ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}