import { BaseService } from './base.service';
import type { User } from '../types/user';

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials extends SignInCredentials {
  role: 'client' | 'provider';
  fullName?: string;
}

export class AuthService extends BaseService {
  async signIn({ email, password }: SignInCredentials) {
    try {
      const { data, error } = await this.getClient().auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      });

      if (error) throw error;
      return data;
    } catch (error) {
      await this.handleError(error, 'auth.signIn', { email });
    }
  }

  async signUp({ email, password, role, fullName }: SignUpCredentials) {
    try {
      const { data, error } = await this.getClient().auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            role,
            full_name: fullName
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      await this.handleError(error, 'auth.signUp', { email, role });
    }
  }

  async signOut() {
    try {
      const { error } = await this.getClient().auth.signOut();
      if (error) throw error;
    } catch (error) {
      await this.handleError(error, 'auth.signOut');
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.getClient().auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      );

      if (error) throw error;
    } catch (error) {
      await this.handleError(error, 'auth.resetPassword', { email });
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await this.getClient().auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      await this.handleError(error, 'auth.getCurrentUser');
      return null;
    }
  }
}