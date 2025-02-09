import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill('client@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
  });

  test('completes booking flow successfully', async ({ page }) => {
    // Navigate to service listing
    await page.goto('/services');
    await page.getByText('Dog Walking').click();

    // Open booking modal
    await page.getByRole('button', { name: 'Book Now' }).click();

    // Select date and time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.getByPlaceholderText('Select a date').fill(tomorrow.toLocaleDateString());
    await page.getByText('10:00').click();

    // Confirm booking
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // Complete payment
    await page.getByRole('button', { name: /Pay \$\d+/ }).click();

    // Verify success message
    await expect(page.getByText('Booking confirmed')).toBeVisible();
  });

  test('handles booking conflicts', async ({ page }) => {
    await page.goto('/services');
    await page.getByText('Dog Walking').click();
    await page.getByRole('button', { name: 'Book Now' }).click();

    // Try to book a conflicting slot
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.getByPlaceholderText('Select a date').fill(tomorrow.toLocaleDateString());

    // Verify conflicting slot is disabled
    await expect(page.getByText('10:00')).toBeDisabled();
  });

  test('validates booking inputs', async ({ page }) => {
    await page.goto('/services');
    await page.getByText('Dog Walking').click();
    await page.getByRole('button', { name: 'Book Now' }).click();

    // Try to confirm without selecting date/time
    await expect(page.getByRole('button', { name: 'Confirm Booking' })).toBeDisabled();

    // Select past date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.getByPlaceholderText('Select a date').fill(pastDate.toLocaleDateString());

    // Verify error message
    await expect(page.getByText('Cannot select past dates')).toBeVisible();
  });
});