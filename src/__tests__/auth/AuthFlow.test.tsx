import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../test/utils';
import { AuthForm } from '../../components/auth/AuthForm';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';

describe('Authentication Flow', () => {
  it('handles sign in successfully', async () => {
    const mockUser = { id: 'test-id', user_metadata: { role: 'client' } };
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: mockUser },
      error: null
    });

    renderWithProviders(<AuthForm type="sign-in" />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(errorMonitor.logSuccess).toHaveBeenCalled();
    });
  });

  it('handles sign in errors', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockRejectedValueOnce(
      new Error('Invalid credentials')
    );

    renderWithProviders(<AuthForm type="sign-in" />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      expect(errorMonitor.logError).toHaveBeenCalled();
    });
  });

  it('shows password reset link after multiple failed attempts', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(
      new Error('Invalid login credentials')
    );

    renderWithProviders(<AuthForm type="sign-in" />);

    // First attempt
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Second attempt
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrong2' }
      });
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/reset your password/i)).toBeInTheDocument();
    });
  });

  it('handles sign up validation', async () => {
    renderWithProviders(<AuthForm type="sign-up" role="client" />);

    // Try to submit without data
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });

    // Try with invalid email
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });

    // Try with short password
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });
});