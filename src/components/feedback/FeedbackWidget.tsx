import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { analytics } from '../../lib/analytics';
import { supabase } from '../../lib/supabase';

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !rating) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id,
          content: feedback.trim(),
          rating,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      analytics.trackEvent({
        category: 'Feedback',
        action: 'Submit',
        value: rating,
        metadata: { hasComment: feedback.trim().length > 0 }
      });

      setToast({
        type: 'success',
        message: 'Thank you for your feedback!'
      });

      setFeedback('');
      setRating(null);
      setIsOpen(false);
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Failed to submit feedback. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 transition-colors"
        aria-label="Give feedback"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
              aria-label="Close feedback form"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Help us improve
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How would you rate your experience?
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          rating === value
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="feedback"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Your feedback
                  </label>
                  <textarea
                    id="feedback"
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="Tell us what you think..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !feedback.trim() || !rating}
                  className="w-full"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}