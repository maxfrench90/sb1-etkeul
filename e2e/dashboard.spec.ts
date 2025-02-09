import { test, expect } from '@playwright/test';

test.describe('Dashboard Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
  });

  test('displays correct statistics', async ({ page }) => {
    await page.goto('/dashboard');

    // Check stats cards
    await expect(page.getByText('Total Bookings')).toBeVisible();
    await expect(page.getByText('Active Bookings')).toBeVisible();
    await expect(page.getByText('Completed Bookings')).toBeVisible();
    await expect(page.getByText('Total Spent')).toBeVisible();

    // Verify charts
    await expect(page.getByRole('graphics-document')).toBeVisible();
    await expect(page.getByText('Weekly Booking Trends')).toBeVisible();
  });

  test('filters booking history', async ({ page }) => {
    await page.goto('/dashboard');

    // Apply date filter
    await page.getByText('Last 30 Days').click();
    await expect(page.getByTestId('booking-list')).toBeVisible();

    // Filter by status
    await page.getByRole('button', { name: 'Filters' }).click();
    await page.getByLabel('Status').selectOption('completed');
    await expect(page.getByText('pending')).not.toBeVisible();

    // Clear filters
    await page.getByRole('button', { name: 'Clear all' }).click();
    await expect(page.getByText('pending')).toBeVisible();
  });

  test('exports booking data', async ({ page, context }) => {
    await page.goto('/dashboard');

    // Set up download listener
    const downloadPromise = context.waitForEvent('download');

    // Export data
    await page.getByRole('button', { name: 'Export' }).click();
    await page.getByText('CSV').click();
    await page.getByRole('button', { name: 'Export CSV' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/bookings_export.*\.csv$/);
  });

  test('handles real-time updates', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for initial data
    await expect(page.getByTestId('booking-list')).toBeVisible();

    // Simulate new booking (will be handled by real-time subscription)
    await page.evaluate(() => {
      window.postMessage({
        type: 'MOCK_BOOKING_CREATED',
        data: {
          id: 'new-booking',
          service_type: 'Dog Walking',
          status: 'pending'
        }
      }, '*');
    });

    // Verify new booking appears
    await expect(page.getByText('new-booking')).toBeVisible();
  });
});