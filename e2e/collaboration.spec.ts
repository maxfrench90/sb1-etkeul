import { test, expect } from '@playwright/test';

test.describe('Real-time Collaboration', () => {
  test('shows active users', async ({ browser }) => {
    // Create two browser contexts for different users
    const userContext1 = await browser.newContext();
    const userContext2 = await browser.newContext();
    const page1 = await userContext1.newPage();
    const page2 = await userContext2.newPage();

    // Sign in first user
    await page1.goto('/sign-in');
    await page1.getByLabel('Email').fill('user1@example.com');
    await page1.getByLabel('Password').fill('password123');
    await page1.getByRole('button', { name: 'Sign In' }).click();

    // Sign in second user
    await page2.goto('/sign-in');
    await page2.getByLabel('Email').fill('user2@example.com');
    await page2.getByLabel('Password').fill('password123');
    await page2.getByRole('button', { name: 'Sign In' }).click();

    // Navigate both users to same page
    await page1.goto('/dashboard');
    await page2.goto('/dashboard');

    // Verify presence indicators
    await expect(page1.getByTestId('active-users')).toContainText('User 2');
    await expect(page2.getByTestId('active-users')).toContainText('User 1');

    // Test status changes
    await page1.getByRole('button', { name: 'Set Status' }).click();
    await page1.getByText('Away').click();
    await expect(page2.getByTestId('user-status-1')).toHaveText('Away');

    // Clean up
    await userContext1.close();
    await userContext2.close();
  });

  test('handles offline/online transitions', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Go offline
    await page.context().setOffline(true);
    await expect(page.getByText('You are offline')).toBeVisible();

    // Go online
    await page.context().setOffline(false);
    await expect(page.getByText('You are offline')).not.toBeVisible();
    await expect(page.getByText('Connected')).toBeVisible();
  });
});