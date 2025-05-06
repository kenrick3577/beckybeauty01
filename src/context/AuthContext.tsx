import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, checkSupabaseConnection } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

type AuthContextType = {
  user: User | null;
  profile: any | null;
  isAdmin: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string, mobile: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any, success?: boolean }>;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const navigate = useNavigate();

  const fetchUserProfile = async (userId: string | undefined) => {
    if (!userId || isFetchingProfile) {
      console.log("fetchUserProfile: No user ID or already fetching");
      return;
    }

    try {
      setIsFetchingProfile(true);
      console.log("Fetching profile for user:", userId);
      
      // Add timestamp to avoid caching issues
      const { data, error } = await supabase
        .rpc('get_user_profile', { user_id: userId });

      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }

      if (data) {
        console.log("Profile data received:", data);
        setProfile(data);
        setIsAdmin(data.role === 'admin');
        return;
      }

      const { data: authUser } = await supabase.auth.getUser();
      
      if (!authUser?.user) {
        throw new Error('No authenticated user found');
      }

      console.log("Creating new profile for user:", userId);
      const { error: createError } = await supabase
        .rpc('create_user_profile', {
          user_id: userId,
          user_email: authUser.user.email || 'unknown@example.com',
          user_name: authUser.user.email ? authUser.user.email.split('@')[0] : 'New User',
          user_mobile: '',
          user_role: 'user'
        });

      if (createError) {
        throw createError;
      }

      console.log("Fetching newly created profile");
      const { data: newProfile, error: newProfileError } = await supabase
        .rpc('get_user_profile', { user_id: userId });

      if (newProfileError) {
        throw newProfileError;
      }

      console.log("New profile data:", newProfile);
      setProfile(newProfile);
      setIsAdmin(newProfile.role === 'admin');

    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setProfile(null);
      setIsAdmin(false);
      toast.error('Failed to load user profile. Please try signing in again.');
      await signOut();
    } finally {
      setIsFetchingProfile(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        // Clear any existing session data
        localStorage.removeItem('sb-auth-token');
        
        const isConnected = await checkSupabaseConnection();
        if (!isConnected) {
          throw new Error('Unable to connect to Supabase');
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        setUser(session?.user || null);
        
        if (session?.user?.id) {
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        toast.error('Unable to connect to the server. Please try again later.');
        await signOut();
      } finally {
        setIsLoading(false);
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event);
        
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          localStorage.removeItem('sb-auth-token');
          navigate('/login');
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user || null);
          
          if (session?.user?.id) {
            await fetchUserProfile(session.user.id);
          }
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    initializeAuth();
  }, [navigate]);

  const refetchProfile = async () => {
    console.log("refetchProfile called");
    if (user?.id) {
      // Clear current profile to force a complete refresh
      setProfile(null);
      
      // Add a small delay to ensure any ongoing database operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log("Refetching profile for user:", user.id);
      
      // Fetch directly from database with nocache option
      try {
        const { data, error } = await supabase
          .rpc('get_user_profile', { user_id: user.id });
          
        if (error) {
          throw error;
        }
        
        if (data) {
          console.log("Refetched profile data:", data);
          setProfile(data);
          setIsAdmin(data.role === 'admin');
          return;
        }
      } catch (error) {
        console.error("Error in refetchProfile:", error);
        toast.error("Failed to refresh profile");
      }
    } else {
      console.warn("Cannot refetch profile: No user ID");
    }
  };

  const signUp = async (email: string, password: string, name: string, mobile: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .rpc('create_user_profile', {
            user_id: data.user.id,
            user_email: email,
            user_name: name,
            user_mobile: mobile,
            user_role: 'user'
          });

        if (profileError) throw profileError;
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error signing up:', error);
      const errorMessage = error.message === 'User already registered'
        ? 'This email is already registered. Please sign in instead.'
        : 'Failed to sign up. Please try again.';
      toast.error(errorMessage);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          toast.error('Invalid email or password. Please try again.');
        } else {
          toast.error('Failed to sign in. Please try again later.');
        }
        return { error };
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      return { error: null, success: true };
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error('An unexpected error occurred. Please try again.');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      localStorage.removeItem('sb-auth-token');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const value = {
    user,
    profile,
    isAdmin,
    isLoading,
    signUp,
    signIn,
    signOut,
    refetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}