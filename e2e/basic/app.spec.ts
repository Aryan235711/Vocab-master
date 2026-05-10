import { test, expect } from '@playwright/test';

test.describe('Tier 1: Basic App Health', () => {
  test.beforeEach(async ({ page }) => {
    // Complete onboarding first
    await page.goto('/');
    
    // Check if we are on onboarding by looking for 'Get Started'
    const getStartedBtn = page.getByRole('button', { name: /Get Started/i });
    try {
      await getStartedBtn.waitFor({ state: 'visible', timeout: 5000 });
      await getStartedBtn.click();
      await page.getByRole('button', { name: /Continue/i }).click();
      await page.getByRole('button', { name: /Start Learning/i }).click();
      
      // Wait for the Home tab to appear after onboarding
      await page.getByText('Daily Quests').waitFor({ state: 'visible', timeout: 5000 });
    } catch (e) {
      // Onboarding not visible or already completed
    }
  });

  test('App loads successfully and displays the dashboard', async ({ page }) => {
    // Verify the title or a key element exists
    await expect(page).toHaveTitle(/VocabDost/);
    
    // The home tab should be visible initially
    await expect(page.getByText('Daily Quests')).toBeVisible();
  });

  test('Navigation tabs function correctly', async ({ page }) => {
    // Click Learn tab
    await page.getByText('Learn', { exact: true }).click();
    await expect(page).toHaveURL(/.*\/learn/);
    
    // Click Practice tab
    await page.getByText('Practice', { exact: true }).click();
    await expect(page).toHaveURL(/.*\/practice/);
    
    // Click Progress tab
    await page.getByText('Progress', { exact: true }).click();
    await expect(page).toHaveURL(/.*\/progress/);
  });
});
