import { test, expect } from '@playwright/test';

test.describe('Notification System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
  });

  test('shows booking notifications', async ({ page }) => {
    await page.goto('/dashboard');

    // Simulate new booking notification
    await page.evaluate(() => {
      window.postMessage({
        type: 'NOTIFICATION',
        data: {
          type: 'booking_created',
          message: 'New booking request received'
        }
      }, '*');
    });

    // Verify notification appears
    await expect(page.getByRole('alert')).toContainText('New booking request received');

    // Dismiss notification
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByRole('alert')).not.toBeVisible();
  });

  test('handles notification preferences', async ({ page }) => {
    await page.goto('/settings');

    // Toggle notification settings
    await page.getByLabel('Email Notifications').uncheck();
    await page.getByLabel('Push Notifications').check();
    await page.getByRole('button', { name: 'Save Settings' }).click();

    // Verify settings are saved
    await expect(page.getByText('Settings saved successfully')).toBeVisible();

    // Verify persistence
    await page.reload();
    await expect(page.getByLabel('Email Notifications')).not.toBeChecked();
    await expect(page.getByLabel('Push Notifications')).toBeChecked();
  });

  test('groups multiple notifications', async ({ page }) => {
    await page.goto('/dashboard');

    // Simulate multiple notifications
    await page.evaluate(() => {
      const notifications = [
        { type: 'booking_created', message: 'New booking #1' },
        { type: 'booking_created', message: 'New booking #2' },
        { type: 'booking_created', message: 'New booking #3' }
      ];
      
      notifications.forEach(notification => {
        window.postMessage({
          type: 'NOTIFICATION',
          data: notification
        }, '*');
      });
    });

    // Verify notifications are grouped
    await expect(page.getByText('3 new bookings')).toBeVisible();

    // Expand group
    await page.getByText('3 new bookings').click();
    await expect(page.getByText('New booking #1')).toBeVisible();
    await expect(page.getByText('New booking #2')).toBeVisible();
    await expect(page.getByText('New booking #3')).toBeVisible();
  });
});