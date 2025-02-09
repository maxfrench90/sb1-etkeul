import React from 'react';
import { Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface BookingFeedbackProps {
  bookingId: string;
  onFeedbackSubmitted: () => void;
}

export function BookingFeedback({ bookingId, onFeedbackSubmitted }: BookingFeedbackProps) {
  const [rating, setRating] = React.useState<number>(0);
  const [comment, setComment] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('booking_feedback')
        .insert({
          booking_id: bookingId,
          rating,
          comment,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      onFeedbackSubmitted();
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 ${
                  value <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Comments
        </label>
        <textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          placeholder="Share your experience..."
        />
      </div>

      <Button type="submit" disabled={loading || rating === 0}>
        {loading ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </form>
  );
}