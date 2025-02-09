import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';

describe('Profile Management', () => {
  let userId: string;

  beforeEach(async () => {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id as string;
  });

  describe('Profile Photo Management', () => {
    it('should replace existing profile photo', async () => {
      // Upload initial photo
      const initialFile = new File([new ArrayBuffer(1 * 1024 * 1024)], 'initial.jpg', { type: 'image/jpeg' });
      await supabase.storage
        .from('avatars')
        .upload(`${userId}/avatar.jpg`, initialFile);

      // Replace with new photo
      const newFile = new File([new ArrayBuffer(1 * 1024 * 1024)], 'new.jpg', { type: 'image/jpeg' });
      const { error } = await supabase.storage
        .from('avatars')
        .update(`${userId}/avatar.jpg`, newFile);

      expect(error).toBeNull();
    });

    it('should handle high-DPI image uploads', async () => {
      const hdpiFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'hdpi.jpg', { type: 'image/jpeg' });
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(`${userId}/hdpi-avatar.jpg`, hdpiFile);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  // ... existing profile tests ...
});