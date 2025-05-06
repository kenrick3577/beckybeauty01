import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, ShoppingBag, Sparkles, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice, formatDate } from '../../lib/utils';
import LoadingSpinner from '../ui/LoadingSpinner';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths } from 'date-fns';

interface DailyRevenue {
  date: string;
  total: number;
  appointments: number;
  orders: number;
}

export default function MonthlyFinancialReport() {
  const [isLoading, setIsLoading] = useState(true);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigate = useNavigate();

  const fetchMonthlyData = async (date: Date) => {
    setIsLoading(true);
    try {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      // Get all days in the month
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      // Initialize daily revenue data
      const dailyData: DailyRevenue[] = daysInMonth.map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        total: 0,
        appointments: 0,
        orders: 0
      }));

      // Fetch appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          date,
          service:services(price)
        `)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'))
        .eq('status', 'completed');

      if (appointmentsError) throw appointmentsError;

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', `${format(monthStart, 'yyyy-MM-dd')}T00:00:00`)
        .lte('created_at', `${format(monthEnd, 'yyyy-MM-dd')}T23:59:59`)
        .eq('status', 'completed');

      if (ordersError) throw ordersError;

      // Process appointments
      appointments?.forEach(apt => {
        const dayData = dailyData.find(d => d.date === apt.date);
        if (dayData) {
          dayData.total += apt.service?.price || 0;
          dayData.appointments += 1;
        }
      });

      // Process orders
      orders?.forEach(order => {
        const orderDate = format(new Date(order.created_at), 'yyyy-MM-dd');
        const dayData = dailyData.find(d => d.date === orderDate);
        if (dayData) {
          dayData.total += order.total;
          dayData.orders += 1;
        }
      });

      // Calculate totals
      const monthlyTotal = dailyData.reduce((sum, day) => sum + day.total, 0);
      const monthlyAppointments = dailyData.reduce((sum, day) => sum + day.appointments, 0);
      const monthlyOrders = dailyData.reduce((sum, day) => sum + day.orders, 0);

      setDailyRevenue(dailyData);
      setTotalRevenue(monthlyTotal);
      setTotalAppointments(monthlyAppointments);
      setTotalOrders(monthlyOrders);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData(currentMonth);
  }, [currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (nextMonth <= new Date()) {
      setCurrentMonth(nextMonth);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="py-10" />;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/admin?tab=finances')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePreviousMonth}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Previous Month
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={handleNextMonth}
            disabled={addMonths(currentMonth, 1) > new Date()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Month
            <ChevronRight className="h-5 w-5 ml-1" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Revenue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatPrice(totalRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Daily Average
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatPrice(totalRevenue / dailyRevenue.length)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Sparkles className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Services Completed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalAppointments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingBag className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Orders Completed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalOrders}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Daily Revenue Breakdown - {format(currentMonth, 'MMMM yyyy')}
          </h3>
        </div>
        <div className="bg-white">
          <ul className="divide-y divide-gray-200">
            {dailyRevenue.map((day) => (
              <li key={day.date} className="px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(day.date)}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="flex items-center text-sm text-gray-500">
                          <Sparkles className="h-4 w-4 text-gray-400 mr-1" />
                          {day.appointments} services
                        </span>
                        <span className="flex items-center text-sm text-gray-500">
                          <ShoppingBag className="h-4 w-4 text-gray-400 mr-1" />
                          {day.orders} orders
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(day.total)}
                    </div>
                    {day.total > (totalRevenue / dailyRevenue.length) ? (
                      <div className="flex items-center text-sm text-green-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Above Average
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-gray-500">
                        <TrendingDown className="h-4 w-4 mr-1" />
                        Below Average
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}