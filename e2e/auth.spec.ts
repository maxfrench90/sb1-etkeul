import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('completes sign up and sign in flow', async ({ page }) => {
    // Start sign up
    await page.goto('/sign-up');
    await expect(page).toHaveTitle(/Sign Up/);

    // Fill sign up form
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    // Verify success message
    await expect(page.getByText('Account created successfully')).toBeVisible();
    await expect(page).toHaveURL('/dashboard');

    // Sign out
    await page.getByRole('button', { name: 'Sign Out' }).click();

    // Sign in
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify successful sign in
    await expect(page).toHaveURL('/dashboard');
  });

  test('handles invalid credentials', async ({ page }) => {
    await page.goto('/sign-in');

    // Try invalid credentials
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify error message
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('shows password reset option after multiple failures', async ({ page }) => {
    await page.goto('/sign-in');

    // First attempt
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('wrong1');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Second attempt
    await page.getByLabel('Password').fill('wrong2');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify reset password link appears
    await expect(page.getByText('Reset your password')).toBeVisible();
  });
});