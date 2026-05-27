import { test, expect } from '@playwright/test';
import { AITester } from './aiTester';

test.describe('Tier 2: AI Autonomous Flow', () => {
  // Give the AI test more time to execute since it involves multiple API calls
  test.setTimeout(120000); 

  test('AI agent navigates to Learn tab and completes one review', async ({ page }) => {
    // Run only when explicitly opted in (RUN_AI_TESTS=1). Keeps daily
    // nightly QA off the 20-RPD Gemini free-tier quota, but lets a
    // weekly workflow or local run exercise the path on demand.
    test.skip(!process.env.RUN_AI_TESTS, 'Set RUN_AI_TESTS=1 to run this test');
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
