import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, Database, RefreshCw } from 'lucide-react';
import { useAdminSettingsStore } from '../../store/adminSettingsStore';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface DiagnosticData {
  timestamp: string;
  connection: {
    status: string;
    responseTime: number;
    error?: string;
  };
  data: {
    users: number;
    appointments: number;
    queryStats: any[];
    errors: {
      connection?: string;
      appointments?: string;
      pgStats?: string;
    };
  };
  recommendations: Array<{
    type: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}

export default function SystemDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useAdminSettingsStore();
  const darkMode = settings.darkMode;

  const fetchDiagnostics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: diagnosticsData, error: diagnosticsError } = await supabase.functions.invoke(
        'system-diagnostics',
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (diagnosticsError) {
        throw new Error(`Edge Function Error: ${diagnosticsError.message}`);
      }

      if (!diagnosticsData) {
        throw new Error('No data received from diagnostics');
      }

      if (diagnosticsData.error) {
        throw new Error(diagnosticsData.error);
      }

      setDiagnostics(diagnosticsData);
    } catch (err: any) {
      console.error('Error fetching diagnostics:', err);
      setError(err.message || 'Failed to fetch system diagnostics');
      toast.error(err.message || 'Failed to fetch system diagnostics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  if (isLoading) {
    return <LoadingSpinner className="py-10" />;
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-400 mr-2" />
          <h3 className={`text-lg font-medium ${darkMode ? 'text-red-200' : 'text-red-800'}`}>
            Diagnostics Error
          </h3>
        </div>
        <p className={`mt-2 text-sm ${darkMode ? 'text-red-200' : 'text-red-700'}`}>{error}</p>
        <button
          onClick={fetchDiagnostics}
          className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (!diagnostics) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return darkMode ? 'text-red-300' : 'text-red-700';
      case 'warning':
        return darkMode ? 'text-yellow-300' : 'text-yellow-700';
      default:
        return darkMode ? 'text-blue-300' : 'text-blue-700';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'error':
        return darkMode ? 'bg-red-900/20' : 'bg-red-50';
      case 'warning':
        return darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50';
      default:
        return darkMode ? 'bg-blue-900/20' : 'bg-blue-50';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Connection Status */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Database className={`h-5 w-5 ${
              diagnostics.connection.status === 'connected' 
                ? 'text-green-400' 
                : 'text-red-400'
            } mr-2`} />
            <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Database Connection
            </h3>
          </div>
          <span className={`px-2 py-1 text-sm rounded-full ${
            diagnostics.connection.status === 'connected'
              ? darkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-100 text-green-800'
              : darkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-100 text-red-800'
          }`}>
            {diagnostics.connection.status}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Response Time</p>
            <p className={`mt-1 text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {diagnostics.connection.responseTime}ms
            </p>
          </div>
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Updated</p>
            <p className={`mt-1 text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {new Date(diagnostics.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Data Statistics */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Data Statistics
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Users</p>
            <p className={`mt-1 text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {diagnostics.data.users}
            </p>
          </div>
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Appointments</p>
            <p className={`mt-1 text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {diagnostics.data.appointments}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {diagnostics.recommendations.length > 0 && (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            System Recommendations
          </h3>
          <div className="mt-4 space-y-4">
            {diagnostics.recommendations.map((rec, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg ${getSeverityBg(rec.severity)}`}
              >
                <div className="flex items-center">
                  {rec.severity === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-400 mr-2" />
                  ) : rec.severity === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-blue-400 mr-2" />
                  )}
                  <p className={`text-sm ${getSeverityColor(rec.severity)}`}>
                    {rec.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={fetchDiagnostics}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
            darkMode
              ? 'text-white bg-primary-600 hover:bg-primary-700'
              : 'text-white bg-primary-600 hover:bg-primary-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Diagnostics
        </button>
      </div>
    </div>
  );
}