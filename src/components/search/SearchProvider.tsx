import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { analytics } from '../../lib/analytics';
import { errorMonitor } from '../../lib/monitoring';
import type { Provider } from '../../types';

interface SearchFilters {
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
  serviceType?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  availability?: {
    date: Date;
    timeSlot: string;
  };
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  created_at: string;
}

interface SearchContextType {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  results: Provider[];
  isLoading: boolean;
  error: Error | null;
  savedSearches: SavedSearch[];
  saveSearch: (name: string) => Promise<void>;
  deleteSearch: (id: string) => Promise<void>;
  loadSearch: (id: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Fetch providers based on filters
  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['providers', filters],
    queryFn: async () => {
      try {
        let query = supabase
          .from('profiles')
          .select(`
            *,
            services (
              id,
              type,
              price
            ),
            availability (
              start_time,
              end_time
            ),
            reviews (
              rating
            )
          `)
          .eq('role', 'provider');

        // Apply location filter
        if (filters.location) {
          query = query.rpc('nearby_providers', {
            lat: filters.location.latitude,
            lng: filters.location.longitude,
            radius_km: filters.location.radius
          });
        }

        // Apply service type filter
        if (filters.serviceType) {
          query = query.eq('services.type', filters.serviceType);
        }

        // Apply price range filter
        if (filters.priceRange) {
          query = query
            .gte('services.price', filters.priceRange.min)
            .lte('services.price', filters.priceRange.max);
        }

        // Apply rating filter
        if (filters.rating) {
          query = query.gte('average_rating', filters.rating);
        }

        // Apply availability filter
        if (filters.availability) {
          const startTime = filters.availability.date.toISOString();
          query = query.not('availability.id', 'is', null)
            .gte('availability.start_time', startTime)
            .contains('availability.time_slots', [filters.availability.timeSlot]);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Track search analytics
        analytics.trackEvent({
          category: 'Search',
          action: 'Provider Search',
          metadata: { filters }
        });

        return data;
      } catch (err) {
        await errorMonitor.logError({
          operation: 'provider.search',
          error: err instanceof Error ? err.message : 'Search failed',
          severity: 'medium',
          timestamp: new Date().toISOString(),
          context: { filters }
        });
        throw err;
      }
    },
    staleTime: 30000 // Consider data fresh for 30 seconds
  });

  // Load saved searches
  const loadSavedSearches = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedSearches(data);
    } catch (err) {
      console.error('Failed to load saved searches:', err);
    }
  }, []);

  // Save current search
  const saveSearch = async (name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('saved_searches')
        .insert({
          name,
          filters,
          user_id: user.id
        });

      if (error) throw error;
      loadSavedSearches();

      analytics.trackEvent({
        category: 'Search',
        action: 'Save Search',
        label: name
      });
    } catch (err) {
      await errorMonitor.logError({
        operation: 'search.save',
        error: err instanceof Error ? err.message : 'Failed to save search',
        severity: 'low',
        timestamp: new Date().toISOString(),
        context: { filters, name }
      });
      throw err;
    }
  };

  // Delete saved search
  const deleteSearch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadSavedSearches();

      analytics.trackEvent({
        category: 'Search',
        action: 'Delete Search',
        label: id
      });
    } catch (err) {
      await errorMonitor.logError({
        operation: 'search.delete',
        error: err instanceof Error ? err.message : 'Failed to delete search',
        severity: 'low',
        timestamp: new Date().toISOString(),
        context: { searchId: id }
      });
      throw err;
    }
  };

  // Load saved search
  const loadSearch = (id: string) => {
    const search = savedSearches.find(s => s.id === id);
    if (search) {
      setFilters(search.filters);
      analytics.trackEvent({
        category: 'Search',
        action: 'Load Search',
        label: search.name
      });
    }
  };

  return (
    <SearchContext.Provider value={{
      filters,
      setFilters,
      results,
      isLoading,
      error,
      savedSearches,
      saveSearch,
      deleteSearch,
      loadSearch
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}