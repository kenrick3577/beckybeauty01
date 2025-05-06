import React, { useEffect, useState } from 'react';
import { DollarSign, Calendar, ShoppingBag, Sparkles } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatPrice } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function FinancialDashboard() {
  const { financialData, fetchFinancialData, isLoading } = useAdminStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitialized) {
      fetchFinancialData();
      setIsInitialized(true);
    }
  }, [fetchFinancialData, isInitialized]);

  if (isLoading || !financialData) {
    return <LoadingSpinner className="py-10" />;
  }

  return (
    <div className="animate-fade-in text-xs sm:text-sm">
      <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Daily Revenue */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="font-medium text-gray-500 truncate">
                    Daily Revenue
                  </dt>
                  <dd>
                    <div className="text-base sm:text-lg font-medium text-gray-900">
                      {formatPrice(financialData.dailyRevenue)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 sm:px-5 py-2 sm:py-3">
            <div>
              <button
                onClick={() => navigate('/admin?tab=finances&view=daily')}
                className="font-medium text-primary-600 hover:text-primary-900"
              >
                View daily report
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="font-medium text-gray-500 truncate">
                    Monthly Revenue
                  </dt>
                  <dd>
                    <div className="text-base sm:text-lg font-medium text-gray-900">
                      {formatPrice(financialData.monthlyRevenue)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 sm:px-5 py-2 sm:py-3">
            <div>
              <button
                onClick={() => navigate('/admin?tab=finances&view=monthly')}
                className="font-medium text-primary-600 hover:text-primary-900"
              >
                View monthly report
              </button>
            </div>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="font-medium text-gray-500 truncate">
                    Total Appointments
                  </dt>
                  <dd>
                    <div className="text-base sm:text-lg font-medium text-gray-900">
                      {financialData.appointmentCount}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 sm:px-5 py-2 sm:py-3">
            <div>
              <button
                onClick={() => navigate('/admin?tab=appointments')}
                className="font-medium text-primary-600 hover:text-primary-900"
              >
                View all appointments
              </button>
            </div>
          </div>
        </div>

        {/* Total Product Orders */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="font-medium text-gray-500 truncate">
                    Total Product Orders
                  </dt>
                  <dd>
                    <div className="text-base sm:text-lg font-medium text-gray-900">
                      {financialData.productOrderCount}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 sm:px-5 py-2 sm:py-3">
            <div>
              <button
                onClick={() => navigate('/admin?tab=finances&view=orders')}
                className="font-medium text-primary-600 hover:text-primary-900"
              >
                View all orders
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="mt-6 sm:mt-8 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
          <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900">
            Revenue Overview
          </h3>
          <p className="mt-1 text-gray-500">
            Last 30 days revenue breakdown
          </p>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex justify-center items-center h-48 sm:h-64 bg-gray-50">
          <p className="text-gray-500">Revenue chart will be displayed here</p>
        </div>
      </div>
    </div>
  );
}