// src/types/user.ts
export interface User {
  id: string;
  email: string;
  createdAt: string;
  role: 'owner' | 'admin' | 'moderator' | 'user'; 
  profile?: {
    name?: string;
    avatar?: string;
    readerLevel?: string;
  };
} 