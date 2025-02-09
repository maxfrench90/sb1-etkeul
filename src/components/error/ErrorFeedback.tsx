import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '../ui/Button';

interface ErrorFeedbackProps {
  errorId: string;
  suggestion: string;
}

export function ErrorFeedback({ errorId, suggestion }: ErrorFeedbackProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'unhelpful' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from('error_feedback')
        .insert({
          error_id: errorId,
          feedback,
          comment: comment.trim() || null,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  if (submitted) {
    return (
      <div className="text-sm text-gray-500 mt-2">
        Thank you for your feedback!
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <p className="text-sm text-gray-600 mb-2">
        Was this error message and suggestion helpful?
      </p>
      <div className="flex items-center gap-2 mb-3">
        <Button
          size="sm"
          variant={feedback === 'helpful' ? 'default' : 'outline'}
          onClick={() => setFeedback('helpful')}
          className="flex items-center gap-1"
        >
          <ThumbsUp className="w-4 h-4" />
          Yes
        </Button>
        <Button
          size="sm"
          variant={feedback === 'unhelpful' ? 'default' : 'outline'}
          onClick={() => setFeedback('unhelpful')}
          className="flex items-center gap-1"
        >
          <ThumbsDown className="w-4 h-4" />
          No
        </Button>
      </div>
      {feedback === 'unhelpful' && (
        <div className="mb-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How could we improve this message?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            rows={2}
          />
        </div>
      )}
      {feedback && (
        <Button
          size="sm"
          onClick={handleSubmit}
          className="w-full"
        >
          Submit Feedback
        </Button>
      )}
    </div>
  );
}