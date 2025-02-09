import { test, expect } from '@playwright/test';

test.describe('Data Grid', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as admin
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
  });

  test('filters and sorts data', async ({ page }) => {
    await page.goto('/admin/bookings');

    // Test search
    await page.getByPlaceholderText('Search...').fill('Dog Walking');
    await expect(page.getByText('Dog Walking')).toBeVisible();
    await expect(page.getByText('Pet Grooming')).not.toBeVisible();

    // Test sorting
    await page.getByText('Date').click();
    await expect(page.getByTestId('sort-icon-asc')).toBeVisible();
    await page.getByText('Date').click();
    await expect(page.getByTestId('sort-icon-desc')).toBeVisible();

    // Test filtering
    await page.getByRole('button', { name: 'Filters' }).click();
    await page.getByLabel('Status').selectOption('confirmed');
    await expect(page.getByText('pending')).not.toBeVisible();
  });

  test('exports data', async ({ page, context }) => {
    await page.goto('/admin/bookings');

    // Set up download listener
    const downloadPromise = context.waitForEvent('download');

    // Click export button
    await page.getByRole('button', { name: 'Export' }).click();
    await page.getByText('CSV').click();
    await page.getByRole('button', { name: 'Export CSV' }).click();

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('handles bulk actions', async ({ page }) => {
    await page.goto('/admin/bookings');

    // Select multiple items
    await page.getByRole('checkbox', { name: 'Select all' }).check();
    await expect(page.getByText('Selected (2)')).toBeVisible();

    // Perform bulk action
    await page.getByRole('button', { name: 'Cancel Selected' }).click();
    await expect(page.getByText('2 bookings cancelled')).toBeVisible();

    // Verify undo action
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByText('Action undone successfully')).toBeVisible();
  });
});