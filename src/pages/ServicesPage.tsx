import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, DollarSign, Sparkles, Star, Shield, Heart } from 'lucide-react';
import { useAppointmentStore } from '../store/appointmentStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function ServicesPage() {
  const { services, fetchServices, isLoading } = useAppointmentStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      fetchServices();
      setIsInitialized(true);
    }
  }, [fetchServices, isInitialized]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="relative bg-pink-900">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            src="https://images.pexels.com/photos/3738339/pexels-photo-3738339.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Becky Beauty Eyelash Studio"
          />
          <div className="absolute inset-0 bg-pink-900/75"></div>
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Luxury Eyelash Services
          </h1>
          <p className="mt-6 text-xl text-white max-w-3xl">
            Transform your look with premium eyelash extensions and treatments. Our expert technicians use only the finest materials to create stunning, long-lasting results.
          </p>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Why Choose Our Lash Studio</h2>
          <p className="mt-4 text-lg text-gray-500">Experience the difference with our premium lash services</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
              <Star className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-xl font-medium text-gray-900 text-center">Expert Technicians</h3>
            <p className="mt-2 text-base text-gray-500 text-center">
              Our certified lash artists have years of experience creating perfect, customized looks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-xl font-medium text-gray-900 text-center">Premium Products</h3>
            <p className="mt-2 text-base text-gray-500 text-center">
              We use only the highest quality lashes and adhesives for safe, long-lasting results.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-xl font-medium text-gray-900 text-center">Personalized Care</h3>
            <p className="mt-2 text-base text-gray-500 text-center">
              Every service is tailored to your unique eye shape and desired look.
            </p>
          </div>
        </div>
      </div>

      {/* Service Menu */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Our Lash Services</h2>
            <p className="mt-4 text-lg text-gray-500">
              Choose from our range of professional eyelash services
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                    <div className="flex items-center text-primary-600 font-semibold">
                      <DollarSign className="h-5 w-5 mr-1" />
                      {service.price.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {service.duration} minutes
                  </div>
                  
                  <p className="mt-4 text-gray-600">{service.description}</p>
                  
                  <div className="mt-6">
                    <Link
                      to="/appointments"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Book Now
                    </Link>
                  </div>
                </div>
                <div className="h-48 bg-gray-200">
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-white text-center">
            <span className="block">Ready for gorgeous lashes?</span>
            <span className="block text-primary-200 mt-2">Book your appointment today</span>
          </h2>
          <div className="mt-8 flex justify-center">
            <div>
              <Link
                to="/appointments"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-600 bg-white hover:bg-gray-50"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}