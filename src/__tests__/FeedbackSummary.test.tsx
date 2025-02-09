// Add these test cases to the existing FeedbackSummary.test.tsx file

  it('handles missing ratings gracefully', async () => {
    const mockFeedbackNoRatings = [
      {
        comment: 'Great service!',
        created_at: '2024-01-01T10:00:00Z',
        bookings: { provider_id: 'provider-1' }
      }
    ];

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: () => ({
        eq: () => Promise.resolve({ data: mockFeedbackNoRatings, error: null })
      })
    }));

    render(<FeedbackSummary providerId="provider-1" />);

    await waitFor(() => {
      expect(screen.getByText('No ratings yet')).toBeInTheDocument();
    });
  });

  it('handles missing comments gracefully', async () => {
    const mockFeedbackNoComments = [
      {
        rating: 5,
        created_at: '2024-01-01T10:00:00Z',
        bookings: { provider_id: 'provider-1' }
      }
    ];

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: () => ({
        eq: () => Promise.resolve({ data: mockFeedbackNoComments, error: null })
      })
    }));

    render(<FeedbackSummary providerId="provider-1" />);

    await waitFor(() => {
      expect(screen.getByText('No comments yet')).toBeInTheDocument();
    });
  });

  it('handles very low feedback count gracefully', async () => {
    const mockFeedbackLowCount = [
      {
        rating: 5,
        comment: 'Great!',
        created_at: '2024-01-01T10:00:00Z',
        bookings: { provider_id: 'provider-1' }
      }
    ];

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: () => ({
        eq: () => Promise.resolve({ data: mockFeedbackLowCount, error: null })
      })
    }));

    render(<FeedbackSummary providerId="provider-1" />);

    await waitFor(() => {
      expect(screen.getByText('Based on 1 review')).toBeInTheDocument();
    });
  });

  it('handles incomplete data fields', async () => {
    const mockFeedbackIncomplete = [
      {
        rating: null,
        comment: '',
        created_at: '2024-01-01T10:00:00Z',
        bookings: { provider_id: 'provider-1' }
      }
    ];

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: () => ({
        eq: () => Promise.resolve({ data: mockFeedbackIncomplete, error: null })
      })
    }));

    render(<FeedbackSummary providerId="provider-1" />);

    await waitFor(() => {
      expect(screen.getByText('No feedback available')).toBeInTheDocument();
    });
  });