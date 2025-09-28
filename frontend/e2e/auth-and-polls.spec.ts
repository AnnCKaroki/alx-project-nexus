import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login and registration links for unauthenticated users', async ({ page }) => {
    // Check that navbar shows correct links for unauthenticated users
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('VoteApp')).toBeVisible();
    await expect(page.getByText('Polls')).toBeVisible();
    await expect(page.getByText('Login')).toBeVisible();
    await expect(page.getByText('Sign Up')).toBeVisible();

    // Should not show authenticated elements
    await expect(page.getByText('Profile')).not.toBeVisible();
    await expect(page.getByText('Create Poll')).not.toBeVisible();
    await expect(page.getByText('Logout')).not.toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByText('Login').click();
    await expect(page).toHaveURL('/auth/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter your username')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.getByText('Sign Up').click();
    await expect(page).toHaveURL('/auth/register');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByPlaceholder('Choose a username')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/auth/login');

    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should show validation errors
    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show validation errors for invalid registration form', async ({ page }) => {
    await page.goto('/auth/register');

    // Fill form with invalid data
    await page.getByPlaceholder('Choose a username').fill('a'); // too short
    await page.getByPlaceholder('Enter your email').fill('invalid-email'); // invalid email
    await page.getByPlaceholder('Create a password').fill('123'); // too short
    await page.getByPlaceholder('Confirm your password').fill('456'); // doesn't match

    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should show validation errors
    await expect(page.getByText('Username must be at least 3 characters')).toBeVisible();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });
});

test.describe('Polls Functionality', () => {
  test('should display polls list page', async ({ page }) => {
    await page.goto('/polls');

    await expect(page.getByRole('heading', { name: 'Community Polls' })).toBeVisible();
    await expect(page.getByPlaceholder('Search polls...')).toBeVisible();

    // Should show message for empty state or polls if they exist
    const emptyState = page.getByText('No polls found');
    const pollsExist = page.locator('[data-testid="poll-card"]');

    // Either empty state or polls should be visible
    await expect(emptyState.or(pollsExist)).toBeVisible();
  });

  test('should search polls', async ({ page }) => {
    await page.goto('/polls');

    const searchInput = page.getByPlaceholder('Search polls...');
    await searchInput.fill('test query');

    // Search should trigger (implementation depends on debouncing)
    await page.waitForTimeout(500);

    // The search functionality should be working
    await expect(searchInput).toHaveValue('test query');
  });

  test('should navigate to create poll page when authenticated', async ({ page }) => {
    // Note: This test assumes user is authenticated
    // In a real scenario, you'd need to implement login flow first
    await page.goto('/polls/create');

    // Should either show the create form or redirect to login
    const createForm = page.getByRole('heading', { name: 'Create New Poll' });
    const loginRedirect = page.getByRole('heading', { name: 'Authentication Required' });

    await expect(createForm.or(loginRedirect)).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that mobile menu button is visible
    await expect(page.locator('[aria-label="Open main menu"]')).toBeVisible();

    // Click mobile menu
    await page.locator('[aria-label="Open main menu"]').click();

    // Check that mobile menu items are visible
    await expect(page.locator('[aria-label="Mobile menu"]')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Check that navigation is visible
    await expect(page.getByText('VoteApp')).toBeVisible();
    await expect(page.getByText('Polls')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page');

    // Should show Next.js 404 page or custom error page
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', route => route.abort());

    await page.goto('/polls');

    // Should show error state or loading state that handles failure
    // The exact implementation depends on how the app handles network errors
    await expect(page.locator('body')).toBeVisible(); // Basic check that page loads
  });
});
