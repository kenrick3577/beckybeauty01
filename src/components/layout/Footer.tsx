import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Eye,
  Instagram, 
  Facebook, 
  Twitter, 
  MapPin, 
  Phone, 
  Mail 
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-secondary-900 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 text-xs sm:text-sm">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center">
              <Eye className="h-6 w-6 text-primary-500" />
              <span className="ml-2 text-xl font-bold text-white">Becky Beauty</span>
            </Link>
            <p className="mt-3 text-gray-300">
              Enhancing your natural beauty with personalized services and premium products.
            </p>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-primary-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h2 className="text-base font-semibold mb-3">Quick Links</h2>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-primary-500 transition-colors block py-2">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-300 hover:text-primary-500 transition-colors block py-2">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-gray-300 hover:text-primary-500 transition-colors block py-2">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/appointments" className="text-gray-300 hover:text-primary-500 transition-colors block py-2">
                  Appointments
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1">
            <h2 className="text-base font-semibold mb-3">Contact Us</h2>
            <ul className="space-y-2">
              <li className="flex items-start">
                <MapPin className="h-4 w-4 text-primary-500 mr-1 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  #1285-8888 Odlin Crescent<br />
                  Richmond B.C V6X 3Z8
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 text-primary-500 mr-1 flex-shrink-0" />
                <span className="text-gray-300">(604)773-6911</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 text-primary-500 mr-1 flex-shrink-0" />
                <span className="text-gray-300 truncate">k.beckybeauty@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="text-base font-semibold mb-3">Opening Hours</h2>
            <ul className="space-y-2">
              <li className="flex justify-between items-center">
                <span className="text-gray-300">Monday - Friday</span>
                <span className="text-gray-300">9:00 AM - 8:00 PM</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-300">Saturday</span>
                <span className="text-gray-300">9:00 AM - 6:00 PM</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-300">Sunday</span>
                <span className="text-gray-300">10:00 AM - 4:00 PM</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-xs">
          <p className="text-gray-300 text-center md:text-left">© 2025 Becky Beauty. All rights reserved.</p>
          <div className="mt-3 md:mt-0 flex space-x-4">
            <Link to="/privacy" className="text-gray-300 hover:text-primary-500 transition-colors py-2">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-300 hover:text-primary-500 transition-colors py-2">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}