import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';
import { analytics } from '../../lib/analytics';
import { FeedbackWidget } from './FeedbackWidget';
import { SupportChat } from './SupportChat';
import { SurveyPrompt } from './SurveyPrompt';
import { Toast } from '../ui/Toast';

interface FeedbackContextType {
  submitFeedback: (feedback: {
    type: string;
    content: string;
    rating?: number;
  }) => Promise<void>;
  startSupportChat: () => void;
  showSurvey: (surveyType: string) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [showChat, setShowChat] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyType, setSurveyType] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const submitFeedback = async (feedback: {
    type: string;
    content: string;
    rating?: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          type: feedback.type,
          content: feedback.content,
          rating: feedback.rating,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      setToast({
        type: 'success',
        message: 'Thank you for your feedback!'
      });

      analytics.trackEvent({
        category: 'Feedback',
        action: 'Submit',
        label: feedback.type,
        value: feedback.rating
      });
    } catch (err) {
      await errorMonitor.logError({
        operation: 'feedback.submit',
        error: err instanceof Error ? err.message : 'Failed to submit feedback',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { feedback }
      });

      setToast({
        type: 'error',
        message: 'Failed to submit feedback. Please try again.'
      });
    }
  };

  const startSupportChat = () => {
    setShowChat(true);
    analytics.trackEvent({
      category: 'Support',
      action: 'Start Chat'
    });
  };

  const showSurveyPrompt = (type: string) => {
    setSurveyType(type);
    setShowSurvey(true);
    analytics.trackEvent({
      category: 'Survey',
      action: 'Show',
      label: type
    });
  };

  return (
    <FeedbackContext.Provider value={{
      submitFeedback,
      startSupportChat,
      showSurvey: showSurveyPrompt
    }}>
      {children}
      <FeedbackWidget />
      {showChat && (
        <SupportChat onClose={() => setShowChat(false)} />
      )}
      {showSurvey && (
        <SurveyPrompt
          type={surveyType}
          onClose={() => setShowSurvey(false)}
          onSubmit={submitFeedback}
        />
      )}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}