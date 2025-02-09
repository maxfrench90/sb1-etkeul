import { test, expect } from '@playwright/test';

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
  });

  test('updates profile information', async ({ page }) => {
    await page.goto('/profile');

    // Update profile fields
    await page.getByLabel('Full Name').fill('John Doe');
    await page.getByLabel('Bio').fill('Professional dog walker');
    await page.getByLabel('Phone').fill('+1234567890');

    await page.getByRole('button', { name: 'Save Profile' }).click();

    // Verify success message
    await expect(page.getByText('Profile updated successfully')).toBeVisible();

    // Verify persistence after reload
    await page.reload();
    await expect(page.getByLabel('Full Name')).toHaveValue('John Doe');
    await expect(page.getByLabel('Bio')).toHaveValue('Professional dog walker');
    await expect(page.getByLabel('Phone')).toHaveValue('+1234567890');
  });

  test('validates profile inputs', async ({ page }) => {
    await page.goto('/profile');

    // Try invalid phone number
    await page.getByLabel('Phone').fill('invalid');
    await page.getByRole('button', { name: 'Save Profile' }).click();
    await expect(page.getByText('Invalid phone number format')).toBeVisible();

    // Try too long bio
    const longBio = 'a'.repeat(501);
    await page.getByLabel('Bio').fill(longBio);
    await page.getByRole('button', { name: 'Save Profile' }).click();
    await expect(page.getByText('Bio must be less than 500 characters')).toBeVisible();
  });

  test('handles profile photo upload', async ({ page }) => {
    await page.goto('/profile');

    // Upload photo
    await page.setInputFiles('input[type="file"]', 'e2e/fixtures/profile.jpg');
    await expect(page.getByText('Photo uploaded successfully')).toBeVisible();

    // Verify photo preview
    const img = page.getByRole('img', { name: 'Profile photo' });
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', /blob:/);
  });
});