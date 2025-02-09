export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'provider';
  avatar?: string;
}

export interface UserProfile extends User {
  phone?: string;
  address?: string;
  preferences?: {
    notifications: boolean;
    newsletter: boolean;
  };
}