import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  },
  global: {
    // Add more retries and a longer timeout
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        credentials: 'same-origin',
        cache: 'no-store' // Ensure we don't use cache for Supabase requests
      });
    }
  }
});

// Add health check function to verify connection
export const checkSupabaseConnection = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Supabase session check failed:', sessionError);
      return false;
    }

    // If we have a session, verify it's valid
    if (session) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Invalid session:', userError);
        return false;
      }
      return true;
    }

    // If no session, check if we can make a public query
    const { error } = await supabase
      .from('services')
      .select('id')
      .limit(1)
      .single();

    if (error && error.message !== 'No rows found') {
      console.error('Supabase connection error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};

// Helper function to add cache busting to image URLs
export const getImageUrlWithCacheBusting = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  try {
    // If it's not a Supabase storage URL, return as is
    if (!url.includes(supabaseUrl)) {
      return url;
    }
    
    // Add cache busting parameter
    const urlObj = new URL(url);
    urlObj.searchParams.set('t', Date.now().toString());
    
    return urlObj.toString();
  } catch (e) {
    console.error("Invalid URL:", url);
    return url;
  }
};

// Helper to extract file path from storage URL
export const getStorageFilePath = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  try {
    // Extract the path from a storage URL
    const pathMatch = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/);
    if (pathMatch && pathMatch.length >= 3) {
      // Remove query parameters
      const path = pathMatch[2].split('?')[0];
      console.log(`Extracted path from ${url}: ${path}`);
      return path;
    }
    return null;
  } catch (e) {
    console.error("Failed to extract storage file path:", e);
    return null;
  }
};

// Helper function to verify an image URL is accessible
export const verifyImageUrl = async (url: string | null | undefined): Promise<boolean> => {
  if (!url) return false;
  
  try {
    // If it's not a URL starting with http, assume it's valid
    if (!url.startsWith('http')) {
      return true;
    }
    
    // Try a HEAD request to check if the image exists
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.ok;
  } catch (e) {
    console.error("Error verifying image URL:", url, e);
    return false;
  }
};