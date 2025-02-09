import React from 'react';
import { Star, TrendingUp, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FeedbackSummaryProps {
  providerId: string;
  dateRange?: { start: Date; end: Date };
}

interface FeedbackStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  recentComments: Array<{
    rating: number;
    comment: string;
    date: string;
  }>;
}

export function FeedbackSummary({ providerId, dateRange }: FeedbackSummaryProps) {
  const [stats, setStats] = React.useState<FeedbackStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadFeedbackStats();
  }, [providerId, dateRange]);

  const loadFeedbackStats = async () => {
    try {
      let query = supabase
        .from('booking_feedback')
        .select(`
          rating,
          comment,
          created_at,
          bookings!inner(provider_id)
        `)
        .eq('bookings.provider_id', providerId);

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const distribution: Record<number, number> = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
      let totalRating = 0;

      data.forEach(feedback => {
        distribution[feedback.rating] = (distribution[feedback.rating] || 0) + 1;
        totalRating += feedback.rating;
      });

      setStats({
        averageRating: totalRating / data.length || 0,
        totalReviews: data.length,
        ratingDistribution: distribution,
        recentComments: data
          .filter(f => f.comment)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(f => ({
            rating: f.rating,
            comment: f.comment,
            date: new Date(f.created_at).toLocaleDateString()
          }))
      });
    } catch (error) {
      console.error('Error loading feedback stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <div className="mt-2 flex items-center">
                <span className="text-3xl font-semibold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </span>
                <Star className="w-6 h-6 text-yellow-400 ml-2" />
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {stats.totalReviews}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-600 mb-2">Rating Distribution</p>
          {Object.entries(stats.ratingDistribution).reverse().map(([rating, count]) => (
            <div key={rating} className="flex items-center gap-2">
              <div className="flex items-center w-16">
                <span className="text-sm text-gray-600">{rating}</span>
                <Star className="w-4 h-4 text-yellow-400 ml-1" />
              </div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${(count / stats.totalReviews) * 100}%`
                  }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {stats.recentComments.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Comments</h3>
          <div className="space-y-4">
            {stats.recentComments.map((comment, index) => (
              <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < comment.rating ? 'text-yellow-400' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">{comment.date}</span>
                </div>
                <p className="text-gray-700">{comment.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}