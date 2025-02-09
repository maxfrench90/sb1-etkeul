// Add these test cases to the existing BookingList.test.tsx file

  it('handles interaction between infinite scroll and manual pagination', async () => {
    const prefetchNextPage = vi.fn();
    const mockBookings = Array(100).fill(null).map((_, i) => ({
      id: `${i + 1}`,
      service_type: 'Dog Walking',
      start_time: '2024-01-01T10:00:00Z',
      status: 'confirmed'
    }));

    vi.mocked(useBookings).mockReturnValue({
      bookings: mockBookings.slice(0, 20),
      isLoading: false,
      error: null,
      totalCount: mockBookings.length,
      prefetchNextPage
    });

    const { rerender } = render(
      <BookingList
        userRole="provider"
        filters={{}}
        onSelect={() => {}}
      />,
      { wrapper }
    );

    // Simulate scroll
    const container = screen.getByRole('list');
    fireEvent.scroll(container, {
      target: {
        scrollTop: 1000,
        scrollHeight: 2000,
        clientHeight: 500
      }
    });

    expect(prefetchNextPage).toHaveBeenCalled();

    // Update page manually
    vi.mocked(useBookings).mockReturnValue({
      bookings: mockBookings.slice(20, 40),
      isLoading: false,
      error: null,
      totalCount: mockBookings.length,
      prefetchNextPage
    });

    rerender(
      <BookingList
        userRole="provider"
        filters={{}}
        onSelect={() => {}}
      />
    );

    // Verify scroll position is maintained
    expect(container.scrollTop).toBe(1000);
  });

  it('handles screen size changes', async () => {
    const mockBookings = Array(50).fill(null).map((_, i) => ({
      id: `${i + 1}`,
      service_type: 'Dog Walking',
      start_time: '2024-01-01T10:00:00Z',
      status: 'confirmed'
    }));

    vi.mocked(useBookings).mockReturnValue({
      bookings: mockBookings,
      isLoading: false,
      error: null,
      totalCount: mockBookings.length,
      prefetchNextPage: vi.fn()
    });

    // Mock different screen sizes
    const originalInnerHeight = window.innerHeight;
    const originalInnerWidth = window.innerWidth;

    // Test mobile size
    Object.defineProperty(window, 'innerHeight', { value: 667 });
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    window.dispatchEvent(new Event('resize'));

    const { rerender } = render(
      <BookingList
        userRole="provider"
        filters={{}}
        onSelect={() => {}}
      />,
      { wrapper }
    );

    // Verify mobile layout
    const mobileContainer = screen.getByRole('list');
    expect(mobileContainer.clientHeight).toBeLessThanOrEqual(667);

    // Test desktop size
    Object.defineProperty(window, 'innerHeight', { value: 1080 });
    Object.defineProperty(window, 'innerWidth', { value: 1920 });
    window.dispatchEvent(new Event('resize'));

    rerender(
      <BookingList
        userRole="provider"
        filters={{}}
        onSelect={() => {}}
      />
    );

    // Verify desktop layout
    const desktopContainer = screen.getByRole('list');
    expect(desktopContainer.clientHeight).toBeLessThanOrEqual(1080);

    // Restore original dimensions
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight });
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth });
  });

  it('handles rapid filter changes', async () => {
    const prefetchNextPage = vi.fn();
    let filterChangeCount = 0;

    vi.mocked(useBookings).mockImplementation(() => {
      filterChangeCount++;
      return {
        bookings: [],
        isLoading: filterChangeCount <= 3, // Loading for first 3 changes
        error: null,
        totalCount: 0,
        prefetchNextPage
      };
    });

    const { rerender } = render(
      <BookingList
        userRole="provider"
        filters={{ serviceType: 'Dog Walking' }}
        onSelect={() => {}}
      />,
      { wrapper }
    );

    // Rapidly change filters
    rerender(
      <BookingList
        userRole="provider"
        filters={{ serviceType: 'Pet Sitting' }}
        onSelect={() => {}}
      />
    );

    rerender(
      <BookingList
        userRole="provider"
        filters={{ serviceType: 'Grooming' }}
        onSelect={() => {}}
      />
    );

    // Verify loading states are handled correctly
    expect(screen.getAllByTestId('skeleton-row')).toHaveLength(3);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton-row')).toBeNull();
    });
  });