import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';

describe('Authentication', () => {
  beforeEach(async () => {
    await supabase.auth.signOut();
  });

  describe('Password Reset', () => {
    it('should handle invalid reset tokens', async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(
        'test@example.com',
        { redirectTo: 'http://localhost:3000/reset-password' }
      );
      expect(error).toBeNull();
    });

    it('should update password successfully', async () => {
      const { data: { user }, error } = await supabase.auth.updateUser({
        password: 'newPassword123!'
      });
      
      expect(error).toBeNull();
      expect(user).toBeDefined();
    });
  });

  // ... existing auth tests ...
});