import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  created_at?: string;
}

interface Appointment {
  id: string;
  user_id: string;
  service_id: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  created_at?: string;
  service?: Service;
  user?: {
    name: string;
    email: string;
    mobile: string;
  };
}

interface AppointmentStore {
  appointments: Appointment[];
  services: Service[];
  userAppointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  fetchAppointments: () => Promise<void>;
  fetchServices: () => Promise<void>;
  fetchUserAppointments: (userId: string) => Promise<void>;
  bookAppointment: (appointment: Omit<Appointment, 'id' | 'status' | 'created_at'>) => Promise<boolean>;
  updateAppointmentStatus: (id: string, status: Appointment['status'], notes?: string) => Promise<void>;
  getNextAppointment: () => Appointment | undefined;
}

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  appointments: [],
  services: [],
  userAppointments: [],
  isLoading: false,
  error: null,

  fetchAppointments: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, service:services(id, name, description, duration, price, created_at), user:users(name, email, mobile)')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;

      // Format dates consistently
      const formattedData = data?.map(appointment => ({
        ...appointment,
        date: format(parseISO(appointment.date), 'yyyy-MM-dd')
      })) || [];

      set({ appointments: formattedData });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error fetching appointments:', error);
      toast.error(`Failed to load appointments: ${error.message}`);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchServices: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      set({ services: data || [] });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error fetching services:', error);
      toast.error(`Failed to load services: ${error.message}`);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserAppointments: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, service:services(id, name, description, duration, price, created_at)')
        .eq('user_id', userId)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;

      // Format dates consistently
      const formattedData = data?.map(appointment => ({
        ...appointment,
        date: format(parseISO(appointment.date), 'yyyy-MM-dd')
      })) || [];

      set({ userAppointments: formattedData });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error fetching user appointments:', error);
      toast.error(`Failed to load your appointments: ${error.message}`);
    } finally {
      set({ isLoading: false });
    }
  },

  bookAppointment: async (appointment) => {
    set({ isLoading: true, error: null });
    try {
      // Format the date to ensure consistency
      const formattedDate = format(parseISO(appointment.date), 'yyyy-MM-dd');

      const { error } = await supabase
        .from('appointments')
        .insert([{ ...appointment, date: formattedDate, status: 'pending' }]);

      if (error) throw error;
      
      // Refresh user appointments after booking
      await get().fetchUserAppointments(appointment.user_id);
      
      toast.success('Appointment booked successfully!');
      return true;
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error booking appointment:', error);
      toast.error(`Failed to book appointment: ${error.message}`);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateAppointmentStatus: async (id: string, status: Appointment['status'], notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status, notes })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh appointments list
      await get().fetchAppointments();
      
      toast.success(`Appointment ${status} successfully`);
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error updating appointment:', error);
      toast.error(`Failed to update appointment: ${error.message}`);
    } finally {
      set({ isLoading: false });
    }
  },

  getNextAppointment: () => {
    const { appointments } = get();
    const now = new Date();
    
    return appointments
      .filter(app => {
        const appointmentDate = new Date(`${app.date} ${app.time}`);
        return appointmentDate > now && app.status === 'approved';
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      })[0];
  }
}));