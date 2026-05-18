import { test, expect } from '@playwright/test';
import { AITester } from './aiTester';

test.describe('Tier 2: AI Autonomous Flow - Features', () => {
  test.setTimeout(120000); 

  test('AI agent opens Doubt Chat and asks a question', async ({ page }) => {
    test.skip(!process.env.GEMINI_API_KEY, 'GEMINI_API_KEY not provided');
      
    await page.goto('/');
    
    // Bypass onboarding manually to save AI quota and avoid hallucination loops
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Start Learning' }).click();
    await page.waitForTimeout(1000);
    
    const ai = new AITester(page);

    const goal = "Navigate to the 'Learn' tab. Click the button that says 'Got a doubt?' or 'MessageCircle'. Wait for the chat to open. Type the question 'What does this word mean in simple terms?' into the chat input, and click the send button. Then you are done.";
    
    const success = await ai.executeGoal(goal, 12);
    
    expect(success).toBe(true);
  });
});
