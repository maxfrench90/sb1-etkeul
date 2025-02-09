import { BaseService } from './base.service';
import type { Provider } from '../types';

interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

export class ProviderService extends BaseService {
  async getProfile(providerId: string) {
    try {
      const { data, error } = await this.getClient()
        .from('profiles')
        .select(`
          *,
          services (*),
          reviews (
            rating,
            comment,
            created_at,
            client:profiles!client_id(*)
          )
        `)
        .eq('id', providerId)
        .eq('role', 'provider')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      await this.handleError(error, 'provider.getProfile', { providerId });
    }
  }

  async updateAvailability(slots: AvailabilitySlot[]) {
    try {
      const { data: { user } } = await this.getClient().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await this.getClient()
        .from('availability')
        .upsert(
          slots.map(slot => ({
            provider_id: user.id,
            start_time: slot.startTime,
            end_time: slot.endTime
          }))
        );

      if (error) throw error;
    } catch (error) {
      await this.handleError(error, 'provider.updateAvailability', { slots });
    }
  }

  async searchProviders(filters: any) {
    try {
      let query = this.getClient()
        .from('profiles')
        .select(`
          *,
          services (*),
          availability (*),
          reviews (rating)
        `)
        .eq('role', 'provider');

      // Apply filters
      if (filters.location) {
        query = query.rpc('nearby_providers', {
          lat: filters.location.latitude,
          lng: filters.location.longitude,
          radius_km: filters.location.radius
        });
      }

      if (filters.serviceType) {
        query = query.eq('services.type', filters.serviceType);
      }

      if (filters.rating) {
        query = query.gte('average_rating', filters.rating);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      await this.handleError(error, 'provider.search', { filters });
      return [];
    }
  }
}