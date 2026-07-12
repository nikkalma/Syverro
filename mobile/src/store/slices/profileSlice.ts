import { StateCreator } from 'zustand';
import type { Profile, ProfileUpdate, ProfileGoals } from '../../types/profile.types';

// Типизация действий для профиля
export interface ProfileSlice {
  profile: Profile;
  
  updateProfile: (updates: ProfileUpdate) => void;
  updateGoals: (goals: Partial<ProfileGoals>) => void;
}

// Начальное состояние профиля
const initialProfile: Profile = {
  name: 'Читатель',
  bio: '',
  avatar: null,
  status: '',
  goals: {
    monthlyBooks: 0,
    monthlyPages: 0,
    yearlyBooks: 0,
  },
};

// Создаём slice
export const createProfileSlice: StateCreator<
  ProfileSlice,
  [],
  [],
  ProfileSlice
> = (set) => ({
  profile: initialProfile,

  updateProfile: (updates) => {
    set((state) => ({
      profile: { ...state.profile, ...updates }
    }));
  },

  updateGoals: (goals) => {
    set((state) => ({
      profile: {
        ...state.profile,
        goals: { ...state.profile.goals, ...goals }
      }
    }));
  },
});