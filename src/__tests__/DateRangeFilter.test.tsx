// Add these test cases to the existing DateRangeFilter.test.tsx file

  it('handles invalid date ranges', () => {
    const mockOnChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={new Date('2024-01-31')}
        endDate={new Date('2024-01-01')}
        onRangeChange={mockOnChange}
      />
    );

    expect(screen.getByText('Start date must be before end date')).toBeInTheDocument();
  });

  it('handles date ranges too far in the future', () => {
    const mockOnChange = vi.fn();
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    render(
      <DateRangeFilter
        startDate={new Date()}
        endDate={futureDate}
        onRangeChange={mockOnChange}
      />
    );

    expect(screen.getByText('Date range cannot exceed 1 year')).toBeInTheDocument();
  });

  it('handles date ranges too far in the past', () => {
    const mockOnChange = vi.fn();
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 2);

    render(
      <DateRangeFilter
        startDate={pastDate}
        endDate={new Date()}
        onRangeChange={mockOnChange}
      />
    );

    expect(screen.getByText('Cannot select dates more than 1 year in the past')).toBeInTheDocument();
  });

  it('clears date range when reset button is clicked', () => {
    const mockOnChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={new Date()}
        endDate={new Date()}
        onRangeChange={mockOnChange}
      />
    );

    const resetButton = screen.getByText('Clear');
    fireEvent.click(resetButton);

    expect(mockOnChange).toHaveBeenCalledWith(null, null);
  });