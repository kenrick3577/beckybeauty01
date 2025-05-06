import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Clock, ShoppingBag, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice, formatDate } from '../../lib/utils';
import LoadingSpinner from '../ui/LoadingSpinner';

interface DailyTransaction {
  id: string;
  type: 'appointment' | 'order';
  amount: number;
  time: string;
  description: string;
}

export default function DailyFinancialReport() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<DailyTransaction[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [date] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDailyTransactions = async () => {
      setIsLoading(true);
      try {
        // Format date as YYYY-MM-DD for Supabase query
        const queryDate = formatDate(date, 'yyyy-MM-dd');

        // Fetch appointments
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            time,
            service:services(name, price)
          `)
          .eq('date', queryDate)
          .eq('status', 'completed');

        if (appointmentsError) throw appointmentsError;

        // Fetch orders
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .gte('created_at', `${queryDate}T00:00:00`)
          .lte('created_at', `${queryDate}T23:59:59`)
          .eq('status', 'completed');

        if (ordersError) throw ordersError;

        // Combine and format transactions
        const allTransactions: DailyTransaction[] = [
          ...(appointments?.map(apt => ({
            id: apt.id,
            type: 'appointment' as const,
            amount: apt.service?.price || 0,
            time: apt.time,
            description: `Service: ${apt.service?.name}`
          })) || []),
          ...(orders?.map(order => ({
            id: order.id,
            type: 'order' as const,
            amount: order.total,
            time: new Date(order.created_at).toLocaleTimeString(),
            description: `Order #${order.id.slice(0, 8)}`
          })) || [])
        ].sort((a, b) => a.time.localeCompare(b.time));

        const total = allTransactions.reduce((sum, t) => sum + t.amount, 0);

        setTransactions(allTransactions);
        setTotalRevenue(total);
      } catch (error) {
        console.error('Error fetching daily transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyTransactions();
  }, [date]);

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
        <h2 className="text-2xl font-bold text-gray-900">
          Daily Financial Report
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
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
                <Sparkles className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Services Completed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {transactions.filter(t => t.type === 'appointment').length}
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
                    {transactions.filter(t => t.type === 'order').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Transactions for {formatDate(date)}
          </h3>
        </div>
        <div className="bg-white">
          <ul className="divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <li className="px-4 py-5 sm:px-6 text-center text-gray-500">
                No transactions found for this date
              </li>
            ) : (
              transactions.map((transaction) => (
                <li key={transaction.id} className="px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {transaction.type === 'appointment' ? (
                        <Sparkles className="h-5 w-5 text-gray-400 mr-3" />
                      ) : (
                        <ShoppingBag className="h-5 w-5 text-gray-400 mr-3" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="text-sm text-gray-500">{transaction.time}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(transaction.amount)}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}