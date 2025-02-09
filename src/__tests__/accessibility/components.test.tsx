import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { FeedbackWidget } from '../../components/feedback/FeedbackWidget';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('Button has no accessibility violations', async () => {
    const { container } = render(
      <Button>Test Button</Button>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Toast notifications are accessible', async () => {
    const { container } = render(
      <Toast
        type="success"
        message="Test message"
        onClose={() => {}}
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('FeedbackWidget is accessible', async () => {
    const { container } = render(<FeedbackWidget />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});