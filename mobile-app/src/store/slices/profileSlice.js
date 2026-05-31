export const createProfileSlice = (set, get) => ({
  profile: {
    name: 'Читатель',
    bio: '',
    avatar: null,
    goals: {
      monthlyBooks: 0,
      monthlyPages: 0,
      yearlyBooks: 0,
    },
  },

  updateProfile: (updates) => set((state) => ({
    profile: { ...state.profile, ...updates }
  })),

  updateGoals: (goals) => set((state) => ({
    profile: {
      ...state.profile,
      goals: { ...state.profile.goals, ...goals }
    }
  })),
});