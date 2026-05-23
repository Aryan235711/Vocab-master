import { test, expect } from '@playwright/test';
import { AITester } from './aiTester';

test.describe('Tier 2: AI Autonomous Flow - Features', () => {
  test.setTimeout(120000); 

  test('AI agent opens Doubt Chat and asks a question', async ({ page }) => {
    test.skip(!process.env.GEMINI_API_KEY, 'GEMINI_API_KEY not provided');
      
    await page.goto('/');
    
    // Bypass onboarding robustly
    try {
      const getStartedBtn = page.getByRole('button', { name: /Get Started/i });
      await getStartedBtn.waitFor({ state: 'visible', timeout: 3000 });
      await getStartedBtn.click();
      await page.getByRole('button', { name: /Continue/i }).click();
      await page.getByRole('button', { name: /Start Learning/i }).click();
      // Wait for the Home tab to appear
      await page.getByText('Daily Quests').waitFor({ state: 'visible', timeout: 5000 });
    } catch (e) {
      // Onboarding not visible or already completed
    }

    // Navigate to Learn tab manually to avoid the AI clicking "Learn new words" on the home tab
    await page.goto('/learn');
    await page.waitForTimeout(1000);
    
    const ai = new AITester(page);

    const success = await ai.executeGoal(
      "Click the button that says 'Got a doubt?'. Once the chat opens, type 'What is the etymology of this word?' in the input field, submit it, and wait for the AI's response.",
      12
    );
    
    expect(success).toBe(true);
  });
});
