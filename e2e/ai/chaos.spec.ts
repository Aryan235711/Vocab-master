import { test, expect } from '@playwright/test';
import { AITester } from './aiTester';

test.describe('Tier 2: AI Autonomous Flow - Chaos Monkey', () => {
  // Allow enough time for 8 distinct AI interactions and API delays
  test.setTimeout(180000); 

  test('AI agent performs random chaos exploration without hallucination', async ({ page }) => {
    test.skip(!process.env.GEMINI_API_KEY, 'GEMINI_API_KEY not provided');
      
    await page.goto('/');
    
    const ai = new AITester(page);

    // Extremely strict prompt designed to prevent hallucination while enforcing chaos
    const goal = `
      You are a Chaos Monkey tester. Your goal is to randomly click around the application for exactly 8 steps.
      
      STRICT RULES to avoid hallucination:
      1. ONLY interact with elements that are CLEARLY and EXPLICITLY visible in the provided screenshot.
      2. If you want to click a button, use the exact text you see on it (e.g., text="Practice").
      3. Do NOT guess that an element exists. If you are on the Home tab, do not try to click "Settings" unless a Settings button is visually present.
      4. DO NOT click the exact same element twice in a row. Force yourself to explore different tabs, buttons, or flashcards.
      5. After you have successfully executed 8 distinct interactions, return type "done".
    `;
    
    // We give it a max of 12 steps to achieve 8 interactions (in case of minor missteps)
    const success = await ai.executeGoal(goal, 12);
    
    // If the app crashed to a white screen, the AI wouldn't find elements and would fail.
    // If it survives 8 steps, it succeeds.
    expect(success).toBe(true);
  });
});
