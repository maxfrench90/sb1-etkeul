import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { errorMonitor } from '../../lib/monitoring';

interface Review {
  id: string;
  booking_id: string;
  provider_id: string;
  client_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewContextType {
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'created_at'>) => Promise<void>;
  updateReview: (id: string, updates: Partial<Review>) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  getAverageRating: (providerId: string) => number;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function ReviewProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!user) return;

    // Load initial reviews
    loadReviews();

    // Subscribe to review changes
    const channel = supabase.channel('reviews')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reviews'
      }, handleReviewChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .or(`provider_id.eq.${user?.id},client_id.eq.${user?.id}`);

      if (error) throw error;
      setReviews(data);
    } catch (err) {
      await errorMonitor.logError({
        operation: 'reviews.load',
        error: err instanceof Error ? err.message : 'Failed to load reviews',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { userId: user?.id }
      });
    }
  };

  const handleReviewChange = (payload: any) => {
    const { eventType, new: newReview, old: oldReview } = payload;

    switch (eventType) {
      case 'INSERT':
        setReviews(prev => [...prev, newReview]);
        break;
      case 'UPDATE':
        setReviews(prev =>
          prev.map(review =>
            review.id === oldReview.id ? newReview : review
          )
        );
        break;
      case 'DELETE':
        setReviews(prev =>
          prev.filter(review => review.id !== oldReview.id)
        );
        break;
    }
  };

  const addReview = async (review: Omit<Review, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          ...review,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      await errorMonitor.logError({
        operation: 'reviews.add',
        error: err instanceof Error ? err.message : 'Failed to add review',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { review }
      });
    }
  };

  const updateReview = async (id: string, updates: Partial<Review>) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      await errorMonitor.logError({
        operation: 'reviews.update',
        error: err instanceof Error ? err.message : 'Failed to update review',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { reviewId: id, updates }
      });
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      await errorMonitor.logError({
        operation: 'reviews.delete',
        error: err instanceof Error ? err.message : 'Failed to delete review',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { reviewId: id }
      });
    }
  };

  const getAverageRating = (providerId: string): number => {
    const providerReviews = reviews.filter(r => r.provider_id === providerId);
    if (providerReviews.length === 0) return 0;

    const sum = providerReviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / providerReviews.length;
  };

  return (
    <ReviewContext.Provider value={{
      reviews,
      addReview,
      updateReview,
      deleteReview,
      getAverageRating
    }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
}