// Add these test cases to the existing RebookDialog.test.tsx file

  it('prevents selecting past dates', () => {
    render(
      <RebookDialog
        isOpen={true}
        onClose={() => {}}
        booking={mockBooking}
        onRebook={() => {}}
      />
    );

    const datePicker = screen.getByPlaceholderText('Select a date');
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    fireEvent.change(datePicker, { target: { value: pastDate.toISOString() } });
    expect(datePicker).not.toHaveValue(pastDate.toISOString());
  });

  it('prevents selecting conflicting time slots', async () => {
    const mockRebook = vi.fn();
    render(
      <RebookDialog
        isOpen={true}
        onClose={() => {}}
        booking={{
          ...mockBooking,
          conflicting_slots: ['10:00']
        }}
        onRebook={mockRebook}
      />
    );

    // Select date
    const datePicker = screen.getByPlaceholderText('Select a date');
    fireEvent.change(datePicker, { target: { value: '2024-02-01' } });

    // Try to select conflicting time slot
    const conflictingSlot = screen.getByText('10:00');
    expect(conflictingSlot.parentElement).toHaveClass('bg-gray-100');
    expect(conflictingSlot.parentElement).toBeDisabled();
  });

  it('validates form before submission', async () => {
    const mockRebook = vi.fn();
    render(
      <RebookDialog
        isOpen={true}
        onClose={() => {}}
        booking={mockBooking}
        onRebook={mockRebook}
      />
    );

    // Try to submit without selecting date/time
    const confirmButton = screen.getByText('Confirm Rebooking');
    fireEvent.click(confirmButton);
    expect(mockRebook).not.toHaveBeenCalled();

    // Select invalid date
    const datePicker = screen.getByPlaceholderText('Select a date');
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    fireEvent.change(datePicker, { target: { value: pastDate.toISOString() } });

    // Verify form is still invalid
    expect(confirmButton).toBeDisabled();
  });