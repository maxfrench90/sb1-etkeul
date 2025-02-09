// Add these test cases to the existing useBookings.test.ts file

  it('handles simultaneous real-time updates', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user' } },
      error: null
    });

    // Mock initial data
    const mockBookings = [{
      id: '1',
      client_id: 'client-1',
      provider_id: 'provider-1',
      service_type: 'Dog Walking',
      start_time: '2024-01-01T10:00:00Z',
      end_time: '2024-01-01T11:00:00Z',
      status: 'confirmed',
      created_at: '2024-01-01T09:00:00Z',
      updated_at: '2024-01-01T09:00:00Z'
    }];

    // Set up subscription mock
    const subscriptionCallback = vi.fn();
    vi.mocked(supabase.channel).mockReturnValue({
      on: () => ({
        subscribe: (cb: any) => {
          subscriptionCallback.mockImplementation(cb);
          return { unsubscribe: vi.fn() };
        }
      })
    });

    const { result, waitFor } = renderHook(() => useBookings({
      userRole: 'client',
      page: 1,
      pageSize: 20,
      filters: {}
    }), { wrapper });

    // Simulate multiple real-time updates
    act(() => {
      subscriptionCallback({
        new: { id: '2', status: 'confirmed' },
        eventType: 'INSERT'
      });
      subscriptionCallback({
        new: { id: '1', status: 'cancelled' },
        eventType: 'UPDATE'
      });
      subscriptionCallback({
        new: { id: '3', status: 'confirmed' },
        eventType: 'INSERT'
      });
    });

    await waitFor(() => {
      expect(result.current.bookings).toHaveLength(3);
      expect(result.current.bookings[0].status).toBe('cancelled');
    });
  });

  it('handles empty filter results', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user' } },
      error: null
    });

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            range: () => Promise.resolve({
              data: [],
              error: null,
              count: 0
            })
          })
        })
      })
    }));

    const { result, waitFor } = renderHook(() => useBookings({
      userRole: 'client',
      page: 1,
      pageSize: 20,
      filters: {
        serviceType: 'Non-existent Service'
      }
    }), { wrapper });

    await waitFor(() => {
      expect(result.current.bookings).toHaveLength(0);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  it('handles failed data fetches with retry', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user' } },
      error: null
    });

    let attempts = 0;
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            range: () => {
              attempts++;
              if (attempts <= 2) {
                throw new Error('Network error');
              }
              return Promise.resolve({
                data: [],
                error: null,
                count: 0
              });
            }
          })
        })
      })
    }));

    const { result, waitFor } = renderHook(() => useBookings({
      userRole: 'client',
      page: 1,
      pageSize: 20,
      filters: {}
    }), { wrapper });

    await waitFor(() => {
      expect(attempts).toBeGreaterThan(1);
      expect(result.current.error).toBeNull();
    });
  });