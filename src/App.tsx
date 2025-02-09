import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './providers/AuthProvider';
import { CollaborationProvider } from './components/collaboration/CollaborationProvider';
import { ChatProvider } from './components/chat/ChatProvider';
import { NotificationProvider } from './components/notifications/NotificationProvider';
import { ServiceProvider } from './providers/ServiceProvider';
import { FeedbackProvider } from './components/feedback/FeedbackProvider';
import { ExperimentProvider } from './components/experiments/ExperimentProvider';
import { AccessibilityProvider } from './components/accessibility/AccessibilityProvider';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { PageTransition } from './components/ui/PageTransition';
import { queryClient } from './lib/queryClient';
import { AppRoutes } from './routes';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ServiceProvider>
              <CollaborationProvider>
                <ChatProvider>
                  <NotificationProvider>
                    <FeedbackProvider>
                      <ExperimentProvider>
                        <AccessibilityProvider>
                          <Suspense fallback={<LoadingOverlay message="Loading..." />}>
                            <PageTransition>
                              <AppRoutes />
                            </PageTransition>
                          </Suspense>
                        </AccessibilityProvider>
                      </ExperimentProvider>
                    </FeedbackProvider>
                  </NotificationProvider>
                </ChatProvider>
              </CollaborationProvider>
            </ServiceProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;