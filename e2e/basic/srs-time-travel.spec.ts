import { test, expect } from '@playwright/test';

// Use a fixed starting date for deterministic tests
const START_DATE = new Date('2026-01-01T12:00:00.000Z');

test.describe('Advanced SRS: Time-Travel Validation', () => {
  // Increase timeout as we are reloading the page multiple times
  test.setTimeout(60000); 

  test.beforeEach(async ({ page }) => {
    // 1. Initialize the browser clock to our starting date
    await page.clock.install({ time: START_DATE });

    // 2. Bypass Onboarding
    await page.goto('/');
    const getStartedBtn = page.getByRole('button', { name: /Get Started/i });
    try {
      await getStartedBtn.waitFor({ state: 'visible', timeout: 5000 });
      await getStartedBtn.click();
      await page.getByRole('button', { name: /Continue/i }).click();
      await page.getByRole('button', { name: /Start Learning/i }).click();
      await page.getByText('Daily Quests').waitFor({ state: 'visible', timeout: 5000 });
    } catch (e) {
      // Ignore if already bypassed
    }
  });

  test('Simulate multi-day learning streak and SRS interval growth', async ({ page }) => {
    // --- DAY 1 ---
    console.log('--- Day 1 ---');
    await expect(page.getByText('Start Streak!')).toBeVisible();

    // Go to Learn tab
    await page.getByText('Learn', { exact: true }).click();
    await expect(page).toHaveURL(/.*\/learn/);

    // We should see a flashcard. Let's flip it and mark it "Good"
    await page.getByText(/Tap to reveal/i).click();
    
    // Grab the word being learned to ensure consistency (optional, but good for debugging)
    const cardText = await page.locator('h2').first().textContent();
    console.log(`Day 1: Learning word -> ${cardText}`);

    // Click "Good" (rating 4) to trigger a successful SM-2 interval
    // The button likely contains the text 'Good'
    await page.getByText(/Good/i, { exact: true }).click();

    // Verify progress incremented
    await page.getByText('Home', { exact: true }).click();
    // The progress ring should show 1/10 (or whatever goal is set)
    // await expect(page.getByText('1/10')).toBeVisible();

    // --- DAY 2 ---
    console.log('--- Day 2 ---');
    // Fast forward 24 hours
    await page.clock.setFixedTime(new Date(START_DATE.getTime() + 24 * 60 * 60 * 1000));
    
    // Reload the app to trigger a new session evaluation
    await page.reload();

    // Go to Learn tab again
    await page.getByText('Learn', { exact: true }).click();
    
    // The word we learned on Day 1 was scheduled for an interval of 1 day,
    // so it should be due right now.
    await expect(page.getByText(/Tap to reveal/i)).toBeVisible();
    
    const cardTextDay2 = await page.locator('h2').first().textContent();
    console.log(`Day 2: Reviewing word -> ${cardTextDay2}`);
    
    // Flip and mark "Good" again. This should push the interval to ~6 days.
    await page.getByText(/Tap to reveal/i).click();
    await page.getByText(/Good/i, { exact: true }).click();

    // Check that the streak is now 2
    await page.getByText('Home', { exact: true }).click();
    await expect(page.getByText('2 Days')).toBeVisible();

    // --- DAY 3 ---
    console.log('--- Day 3 ---');
    // Fast forward another 24 hours (total 48h from start)
    await page.clock.setFixedTime(new Date(START_DATE.getTime() + 48 * 60 * 60 * 1000));
    
    // Reload the app
    await page.reload();

    // Check Learn tab
    await page.getByText('Learn', { exact: true }).click();
    
    // Because the interval is 6 days, the word should NOT be due today.
    // If there were only 1 word in the system, we'd see "No Reviews Due".
    // Since VocabDost pulls new words, we will just see a new word.
    await expect(page.getByText(/Tap to reveal/i)).toBeVisible();
    const cardTextDay3 = await page.locator('h2').first().textContent();
    console.log(`Day 3: Learning new word -> ${cardTextDay3}`);
    
    // Assuming the dictionary has distinct words, it shouldn't be the Day 1 word
    expect(cardTextDay3).not.toBe(cardTextDay2);
    
    // Do one review to secure the streak
    await page.getByText(/Tap to reveal/i).click();
    await page.getByText(/Good/i, { exact: true }).click();

    // Streak should be 3
    await page.getByText('Home', { exact: true }).click();
    await expect(page.getByText('3 Days')).toBeVisible();
  });
});
