import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Property } from '../types';

interface PropertyState {
  activeProperty: Property | null;
  setActiveProperty: (property: Property | null) => void;
  clearActiveProperty: () => void;
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set) => ({
      activeProperty: null,
      setActiveProperty: (property) => set({ activeProperty: property }),
      clearActiveProperty: () => set({ activeProperty: null }),
    }),
    {
      name: 'property-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
