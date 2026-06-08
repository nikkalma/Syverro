export interface ProfileGoals {
  monthlyBooks: number;
  monthlyPages: number;
  yearlyBooks: number;
}

export interface Profile {
  name: string;
  bio: string;
  avatar: string | null;
  status: string | null;
  goals: ProfileGoals;
}

export type ProfileUpdate = Partial<Profile>;