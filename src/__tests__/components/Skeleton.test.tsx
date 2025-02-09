import { render } from '@testing-library/react';
import { Skeleton } from '../../components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders with default classes', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('bg-gray-200');
    expect(skeleton).toHaveClass('rounded');
  });

  it('accepts custom className', () => {
    const { container } = render(<Skeleton className="w-20 h-20" />);
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toHaveClass('w-20');
    expect(skeleton).toHaveClass('h-20');
  });

  it('has correct accessibility attributes', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });
});