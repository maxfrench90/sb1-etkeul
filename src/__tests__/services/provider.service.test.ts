import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderService } from '../../services/provider.service';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';

describe('ProviderService', () => {
  let providerService: ProviderService;

  beforeEach(() => {
    providerService = new ProviderService();
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('fetches provider profile successfully', async () => {
      const mockProfile = {
        id: 'provider-123',
        name: 'John Doe',
        services: [{ type: 'Dog Walking', price: 50 }],
        reviews: [{ rating: 5, comment: 'Great service!' }]
      };

      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: mockProfile,
          error: null
        })
      }));

      const result = await providerService.getProfile('provider-123');

      expect(result).toEqual(mockProfile);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('handles profile fetch errors', async () => {
      const error = new Error('Profile not found');
      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValueOnce(error)
      }));

      await expect(providerService.getProfile('invalid-id')).rejects.toThrow('Profile not found');

      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'provider.getProfile',
          error: error.message
        })
      );
    });
  });

  describe('searchProviders', () => {
    it('searches providers with filters', async () => {
      const mockProviders = [
        {
          id: 'provider-1',
          name: 'John Doe',
          services: [{ type: 'Dog Walking' }],
          rating: 4.5
        }
      ];

      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValueOnce({
          data: mockProviders,
          error: null
        })
      }));

      const result = await providerService.searchProviders({
        location: {
          latitude: -33.8688,
          longitude: 151.2093,
          radius: 10
        },
        serviceType: 'Dog Walking',
        rating: 4
      });

      expect(result).toEqual(mockProviders);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  describe('updateAvailability', () => {
    it('updates provider availability', async () => {
      const mockUser = { id: 'provider-123' };
      const mockSlots = [
        {
          startTime: '2024-03-01T10:00:00Z',
          endTime: '2024-03-01T11:00:00Z'
        }
      ];

      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        upsert: vi.fn().mockResolvedValueOnce({
          error: null
        })
      }));

      await providerService.updateAvailability(mockSlots);

      expect(supabase.from).toHaveBeenCalledWith('availability');
    });
  });
});