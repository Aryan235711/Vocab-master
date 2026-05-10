import { test, expect } from '@playwright/test';
import { AITester } from './aiTester';

test.describe('Tier 2: AI Autonomous Flow', () => {
  // Give the AI test more time to execute since it involves multiple API calls
  test.setTimeout(120000); 

  test('AI agent navigates to Learn tab and completes one review', async ({ page }) => {
    // Skipping to preserve the 20 Requests Per Day free-tier quota
    test.skip(true, 'Skipped to preserve Gemini free-tier quota');
    // Note: This test will fail if GEMINI_API_KEY is not set in the .env file.
    test.skip(!process.env.GEMINI_API_KEY, 'GEMINI_API_KEY not provided, skipping AI test');
      
    await page.goto('/');
    
    // Initialize the AI Tester with the current page
    const ai = new AITester(page);

    // Give it a high-level goal
    const goal = "Navigate to the 'Learn' tab. Click to show the answer for the current flashcard. Rate the answer as 'Good' or '4'. Verify you are on the next card, then you are done.";
    
    // Let the AI figure out how to do it
    const success = await ai.executeGoal(goal, 10);
    
    // Assert that the AI reported successful completion of the goal
    expect(success).toBe(true);
  });
});
