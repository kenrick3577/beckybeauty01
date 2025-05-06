import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface UserStore {
  profilePictureUrl: string | null;
  isLoadingImage: boolean;
  hasImageError: boolean;
  refreshImageKey: number;
  
  setProfilePictureUrl: (url: string | null) => void;
  validateImageUrl: (url: string) => Promise<boolean>;
  refreshProfileImage: () => void;
  setImageError: (hasError: boolean) => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  profilePictureUrl: null,
  isLoadingImage: false,
  hasImageError: false,
  refreshImageKey: Date.now(),
  
  setProfilePictureUrl: (url) => set({ 
    profilePictureUrl: url,
    hasImageError: false,
    refreshImageKey: Date.now()
  }),
  
  validateImageUrl: async (url) => {
    try {
      set({ isLoadingImage: true });
      
      if (!url) return false;
      
      // For data URLs or relative URLs, assume they're valid
      if (url.startsWith('data:') || !url.startsWith('http')) {
        return true;
      }
      
      // For URLs with Supabase storage, check if the object exists
      if (url.includes(supabase.supabaseUrl)) {
        const pathMatch = url.match(/\/storage\/v1\/object\/public\/profile-pictures\/(.*)/);
        if (pathMatch && pathMatch[1]) {
          const filePath = decodeURIComponent(pathMatch[1]);
          
          const { data, error } = await supabase.storage
            .from('profile-pictures')
            .download(filePath);
            
          return !error && data !== null;
        }
      }
      
      // For external URLs, try a HEAD request
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (e) {
      console.error("Error validating image URL:", e);
      return false;
    } finally {
      set({ isLoadingImage: false });
    }
  },
  
  refreshProfileImage: () => set({
    refreshImageKey: Date.now(),
    hasImageError: false
  }),
  
  setImageError: (hasError) => set({ hasImageError: hasError })
}));