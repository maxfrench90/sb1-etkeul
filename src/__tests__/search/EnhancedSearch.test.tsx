import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedSearch } from '../../components/search/EnhancedSearch';
import { SearchProvider } from '../../components/search/SearchProvider';
import { supabase } from '../../lib/supabase';

describe('EnhancedSearch', () => {
  const mockProviders = [
    {
      id: '1',
      name: 'John Doe',
      services: [{ type: 'dog-walking', price: 50 }],
      rating: 4.5
    },
    {
      id: '2',
      name: 'Jane Smith',
      services: [{ type: 'pet-sitting', price: 75 }],
      rating: 5
    }
  ];

  beforeEach(() => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: mockProviders, error: null })
    }));
  });

  it('renders search filters correctly', () => {
    render(
      <SearchProvider>
        <EnhancedSearch />
      </SearchProvider>
    );

    expect(screen.getByPlaceholderText('Enter location')).toBeInTheDocument();
    expect(screen.getByText('All Services')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('shows advanced filters when clicked', async () => {
    render(
      <SearchProvider>
        <EnhancedSearch />
      </SearchProvider>
    );

    fireEvent.click(screen.getByText('Filters'));

    await waitFor(() => {
      expect(screen.getByText('Price Range')).toBeInTheDocument();
      expect(screen.getByText('Minimum Rating')).toBeInTheDocument();
      expect(screen.getByText('Availability')).toBeInTheDocument();
    });
  });

  it('handles search filter changes', async () => {
    render(
      <SearchProvider>
        <EnhancedSearch />
      </SearchProvider>
    );

    // Change service type
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'dog-walking' }
    });

    // Show advanced filters
    fireEvent.click(screen.getByText('Filters'));

    // Set price range
    const minPrice = screen.getByPlaceholderText('Min');
    fireEvent.change(minPrice, { target: { value: '20' } });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalled();
    });
  });

  it('saves search criteria', async () => {
    render(
      <SearchProvider>
        <EnhancedSearch />
      </SearchProvider>
    );

    fireEvent.click(screen.getByText('Save Search'));
    
    const nameInput = screen.getByPlaceholderText(/Dog Walkers/);
    fireEvent.change(nameInput, {
      target: { value: 'My Test Search' }
    });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Search saved successfully')).toBeInTheDocument();
    });
  });
});