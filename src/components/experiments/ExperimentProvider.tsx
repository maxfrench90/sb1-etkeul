import React, { createContext, useContext, useEffect, useState } from 'react';
import { analytics } from '../../lib/analytics';

interface Experiment {
  id: string;
  variants: string[];
  weights?: number[];
}

interface ExperimentContextType {
  getVariant: (experimentId: string) => string | null;
  trackExperimentView: (experimentId: string) => void;
}

const ExperimentContext = createContext<ExperimentContextType | undefined>(undefined);

const EXPERIMENTS: Record<string, Experiment> = {
  'booking-form-layout': {
    id: 'booking-form-layout',
    variants: ['default', 'simplified'],
    weights: [0.5, 0.5]
  },
  'pricing-display': {
    id: 'pricing-display',
    variants: ['standard', 'dynamic'],
    weights: [0.7, 0.3]
  }
};

export function ExperimentProvider({ children }: { children: React.ReactNode }) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load existing assignments from localStorage
    const stored = localStorage.getItem('experiment_assignments');
    if (stored) {
      setAssignments(JSON.parse(stored));
    }
  }, []);

  const assignVariant = (experimentId: string): string => {
    const experiment = EXPERIMENTS[experimentId];
    if (!experiment) return 'default';

    const random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < experiment.variants.length; i++) {
      sum += experiment.weights?.[i] ?? (1 / experiment.variants.length);
      if (random <= sum) {
        return experiment.variants[i];
      }
    }

    return experiment.variants[0];
  };

  const getVariant = (experimentId: string): string | null => {
    if (!EXPERIMENTS[experimentId]) return null;

    if (!assignments[experimentId]) {
      const variant = assignVariant(experimentId);
      setAssignments(prev => {
        const next = { ...prev, [experimentId]: variant };
        localStorage.setItem('experiment_assignments', JSON.stringify(next));
        return next;
      });
      return variant;
    }

    return assignments[experimentId];
  };

  const trackExperimentView = (experimentId: string) => {
    const variant = assignments[experimentId];
    if (variant) {
      analytics.trackExperiment(experimentId, variant);
    }
  };

  return (
    <ExperimentContext.Provider value={{ getVariant, trackExperimentView }}>
      {children}
    </ExperimentContext.Provider>
  );
}

export function useExperiment(experimentId: string) {
  const context = useContext(ExperimentContext);
  if (!context) {
    throw new Error('useExperiment must be used within an ExperimentProvider');
  }

  const variant = context.getVariant(experimentId);
  
  useEffect(() => {
    if (variant) {
      context.trackExperimentView(experimentId);
    }
  }, [variant, experimentId]);

  return variant;
}