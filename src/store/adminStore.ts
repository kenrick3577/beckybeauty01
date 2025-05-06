import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  created_at: string;
  role: 'user' | 'admin';
  last_login: string | null;
  login_count: number;
  account_status: 'active' | 'inactive';
  account_type: 'basic' | 'premium' | 'enterprise';
  metadata: any;
}

interface FinancialData {
  dailyRevenue: number;
  monthlyRevenue: number;
  appointmentCount: number;
  productOrderCount: number;
}

interface AdminStore {
  users: User[];
  isLoading: boolean;
  error: string | null;
  financialData: FinancialData | null;
  fetchUsers: () => Promise<void>;
  deleteUser: (userId: string) => Promise<boolean>;
  toggleUserRole: (userId: string, newRole: 'user' | 'admin') => Promise<boolean>;
  updateUserStatus: (userId: string, status: 'active' | 'inactive') => Promise<boolean>;
  fetchFinancialData: () => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,
  financialData: null,

  fetchFinancialData: async () => {
    set({ isLoading: true, error: null });
    try {
      const today = new Date();
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      // Format dates for queries
      const todayStr = format(today, 'yyyy-MM-dd');
      const monthStartStr = format(monthStart, 'yyyy-MM-dd');
      const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

      // Fetch daily appointments revenue
      const { data: dailyAppointments, error: dailyApptError } = await supabase
        .from('appointments')
        .select(`
          id,
          service:services(price)
        `)
        .eq('date', todayStr)
        .eq('status', 'completed');

      if (dailyApptError) throw dailyApptError;

      // Fetch monthly appointments revenue
      const { data: monthlyAppointments, error: monthlyApptError } = await supabase
        .from('appointments')
        .select(`
          id,
          service:services(price)
        `)
        .gte('date', monthStartStr)
        .lte('date', monthEndStr)
        .eq('status', 'completed');

      if (monthlyApptError) throw monthlyApptError;

      // Fetch daily orders revenue
      const { data: dailyOrders, error: dailyOrderError } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', `${todayStr}T00:00:00`)
        .lte('created_at', `${todayStr}T23:59:59`)
        .eq('status', 'completed');

      if (dailyOrderError) throw dailyOrderError;

      // Fetch monthly orders revenue
      const { data: monthlyOrders, error: monthlyOrderError } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', `${monthStartStr}T00:00:00`)
        .lte('created_at', `${monthEndStr}T23:59:59`)
        .eq('status', 'completed');

      if (monthlyOrderError) throw monthlyOrderError;

      // Calculate revenues
      const dailyAppointmentRevenue = dailyAppointments?.reduce((sum, app) => 
        sum + (app.service?.price || 0), 0) || 0;
      const monthlyAppointmentRevenue = monthlyAppointments?.reduce((sum, app) => 
        sum + (app.service?.price || 0), 0) || 0;
      const dailyOrderRevenue = dailyOrders?.reduce((sum, order) => 
        sum + (Number(order.total) || 0), 0) || 0;
      const monthlyOrderRevenue = monthlyOrders?.reduce((sum, order) => 
        sum + (Number(order.total) || 0), 0) || 0;

      // Get counts
      const { count: appointmentCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      const { count: productOrderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      set({
        financialData: {
          dailyRevenue: dailyAppointmentRevenue + dailyOrderRevenue,
          monthlyRevenue: monthlyAppointmentRevenue + monthlyOrderRevenue,
          appointmentCount: appointmentCount || 0,
          productOrderCount: productOrderCount || 0
        }
      });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error fetching financial data:', error);
      toast.error(`Failed to load financial data: ${error.message}`);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (userError) throw userError;
      set({ users: userData || [] });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error fetching users:', error);
      toast.error(`Failed to load users: ${error.message}`);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (userData?.role === 'admin' || userData?.email === 'iceiceiceiceice5@gmail.com') {
        throw new Error('Cannot delete admin users');
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      set(state => ({
        users: state.users.filter(user => user.id !== userId)
      }));

      toast.success('User deleted successfully');
      return true;
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.message}`);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  toggleUserRole: async (userId: string, newRole: 'user' | 'admin') => {
    set({ isLoading: true, error: null });
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (userData?.email === 'iceiceiceiceice5@gmail.com') {
        throw new Error('Cannot modify the role of this user');
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (updateError) throw updateError;

      if (newRole === 'admin') {
        const { error: metadataError } = await supabase.rpc('set_admin_metadata', {
          user_id: userId
        });

        if (metadataError) throw metadataError;
      }

      set(state => ({
        users: state.users.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      }));

      toast.success(`User role updated to ${newRole} successfully`);
      return true;
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error updating user role:', error);
      toast.error(`Failed to update user role: ${error.message}`);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateUserStatus: async (userId: string, status: 'active' | 'inactive') => {
    set({ isLoading: true, error: null });
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (userData?.email === 'iceiceiceiceice5@gmail.com') {
        throw new Error('Cannot modify the status of this user');
      }

      const { error } = await supabase
        .from('users')
        .update({ account_status: status })
        .eq('id', userId);

      if (error) throw error;

      set(state => ({
        users: state.users.map(user =>
          user.id === userId ? { ...user, account_status: status } : user
        )
      }));

      toast.success(`User ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
      return true;
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error updating user status:', error);
      toast.error(`Failed to update user status: ${error.message}`);
      return false;
    } finally {
      set({ isLoading: false });
    }
  }
}));