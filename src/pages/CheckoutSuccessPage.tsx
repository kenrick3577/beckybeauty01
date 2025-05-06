import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CheckoutSuccessPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-24 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <CheckCircle className="h-16 w-16 text-success-500 mx-auto" />
            <h3 className="mt-2 text-3xl font-semibold text-gray-900">Order Successful!</h3>
            <p className="mt-2 text-sm text-gray-500">
              Your order has been successfully placed. Thank you for shopping with Becky Beauty!
            </p>
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900">What's Next?</h4>
              <p className="mt-2 text-sm text-gray-500">
                You can track your order status in your account dashboard. We'll also send you an email with your order details.
              </p>
              
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Link
                    to="/shop"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Continue Shopping
                  </Link>
                </div>
                <div>
                  <Link
                    to="/appointments"
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Book an Appointment
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}