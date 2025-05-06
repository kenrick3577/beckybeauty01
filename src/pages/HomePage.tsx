import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Star, Users, Trophy, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="relative bg-pink-50 min-h-[50vh]">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            src="https://images.pexels.com/photos/3738339/pexels-photo-3738339.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Becky Beauty Eyelash Studio"
          />
          <div className="absolute inset-0 bg-pink-900/75"></div>
        </div>
        <div className="relative max-w-7xl mx-auto py-12 px-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Becky Beauty<br/>Eyelash Studio</h1>
          <p className="mt-4 text-base text-white max-w-3xl">
            Transform your look with our premium eyelash services. Our expert technicians will help you achieve the perfect lash style that enhances your natural beauty.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/services"
              className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Our Services
            </Link>
            <Link
              to="/appointments"
              className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-primary-700 bg-white hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Services */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-gray-900">
              Our Featured Services
            </h2>
            <p className="mt-2 max-w-2xl mx-auto text-sm text-gray-500">
              Discover our range of premium eyelash services designed to enhance your natural beauty
            </p>
          </div>

          <div className="mt-8 grid gap-4 grid-cols-2">
            {/* Service 1 */}
            <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="h-32 bg-gray-200 group-hover:opacity-75">
                <img
                  src="https://images.pexels.com/photos/3738339/pexels-photo-3738339.jpeg?auto=compress&cs=tinysrgb&w=1600"
                  alt="Classic Lash Extensions"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-1">Classic Lash Extensions</h3>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                  Natural-looking lash extensions for subtle enhancement.
                </p>
                <div className="mt-2">
                  <Link
                    to="/services"
                    className="text-primary-600 hover:text-primary-500 font-medium flex items-center text-xs"
                  >
                    Learn more
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Service 2 */}
            <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="h-32 bg-gray-200 group-hover:opacity-75">
                <img
                  src="https://images.pexels.com/photos/3738333/pexels-photo-3738333.jpeg?auto=compress&cs=tinysrgb&w=1600"
                  alt="Volume Lash Extensions"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-1">Volume Lash Extensions</h3>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                  Multiple extensions for a fuller, dramatic look.
                </p>
                <div className="mt-2">
                  <Link
                    to="/services"
                    className="text-primary-600 hover:text-primary-500 font-medium flex items-center text-xs"
                  >
                    Learn more
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-8 text-center">
            <Link
              to="/services"
              className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              View All Services
            </Link>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-pink-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-gray-900">
              Why Choose Becky Beauty
            </h2>
            <p className="mt-2 max-w-2xl mx-auto text-sm text-gray-500">
              We're dedicated to making you look and feel your best
            </p>
          </div>

          <div className="mt-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center p-2 bg-primary-500 rounded-md shadow">
                      <Eye className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <h3 className="ml-3 text-base font-medium text-gray-900">Expert Technicians</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Our certified lash artists have years of experience in creating perfect lash looks.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow">
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center p-2 bg-primary-500 rounded-md shadow">
                      <Star className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <h3 className="ml-3 text-base font-medium text-gray-900">Premium Products</h3>
                </div>
                <p className="text-xs text-gray-500">
                  We use only the highest quality lash extensions and products for lasting results.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow">
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center p-2 bg-primary-500 rounded-md shadow">
                      <Users className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <h3 className="ml-3 text-base font-medium text-gray-900">Personal Approach</h3>
                </div>
                <p className="text-xs text-gray-500">
                  We customize each service to match your unique style and preferences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col items-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-white text-center">
            <span className="block">Ready to transform your look?</span>
            <span className="block text-pink-300 mt-1">Book your appointment today.</span>
          </h2>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="inline-flex rounded-md shadow w-full sm:w-auto">
              <Link
                to="/appointments"
                className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-white hover:bg-pink-50 w-full"
              >
                Book Now
              </Link>
            </div>
            <div className="inline-flex rounded-md shadow w-full sm:w-auto">
              <Link
                to="/services"
                className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500 w-full"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}