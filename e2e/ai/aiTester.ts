import { Page } from '@playwright/test';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables for the test
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY must be set in your .env file to run AI E2E tests.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'mock-key' });
const MODEL = 'gemini-2.5-flash';

export interface Action {
  type: 'click' | 'type' | 'wait' | 'done';
  selector?: string;
  text?: string;
  reasoning: string;
}

export class AITester {
  constructor(private page: Page) {}

  /**
   * Instructs the AI to achieve a goal on the current page.
   * Takes a screenshot, sends it to Gemini, and executes the returned action.
   */
  async executeGoal(goal: string, maxSteps = 10): Promise<boolean> {
    if (!apiKey) {
      console.warn("Skipping AI test execution due to missing GEMINI_API_KEY.");
      return false; // Or throw depending on your preference
    }

    let step = 0;
    while (step < maxSteps) {
      step++;
      console.log(`\n--- Step ${step} ---`);
      
      // 1. Capture Screenshot
      const screenshotBuffer = await this.page.screenshot();
      const base64Screenshot = screenshotBuffer.toString('base64');

      // 2. Extract DOM context (to give Gemini hints on selectors)
      // For a real robust system, you'd extract clickable elements, but we'll 
      // rely heavily on Vision for this example.
      const pageTitle = await this.page.title();
      const currentUrl = this.page.url();

      const prompt = `
      You are an autonomous QA testing agent.
      Goal: ${goal}
      
      Current URL: ${currentUrl}
      Page Title: ${pageTitle}
      
      Look at the provided screenshot of the web application. 
      What action should be taken next to achieve the goal?
      
      Respond ONLY with a valid JSON object matching this interface:
      {
        "type": "click" | "type" | "wait" | "done",
        "selector": "Playwright selector to interact with. MUST use format 'text=Your Text' (no quotes around the text) for case-insensitive text matching. DO NOT use specific tag names like 'a' or 'button' unless absolutely necessary.",
        "text": "Text to type (if type is 'type')",
        "reasoning": "Brief explanation of why you chose this action"
      }
      
      If the goal is already achieved, return type "done".
      `;

      try {
        console.log("Analyzing UI...");
        const response = await ai.models.generateContent({
          model: MODEL,
          contents: [
            prompt,
            {
              inlineData: {
                data: base64Screenshot,
                mimeType: 'image/png'
              }
            }
          ],
          config: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        });

        const responseText = response.text;
        if (!responseText) {
            throw new Error("No text returned from Gemini");
        }
        
        const action: Action = JSON.parse(responseText);
        console.log(`Action: ${action.type}`);
        console.log(`Reasoning: ${action.reasoning}`);
        if (action.selector) console.log(`Selector: ${action.selector}`);

        // 3. Execute the Action
        if (action.type === 'done') {
          console.log("Goal achieved!");
          return true;
        } else if (action.type === 'click' && action.selector) {
          // Add a small wait in case of animations
          await this.page.waitForTimeout(500); 
          await this.page.locator(action.selector).first().click();
        } else if (action.type === 'type' && action.selector && action.text) {
          await this.page.locator(action.selector).first().fill(action.text);
        } else if (action.type === 'wait') {
          await this.page.waitForTimeout(2000);
        }

        // Wait for UI to settle after action
        await this.page.waitForTimeout(1000); 

      } catch (err: any) {
        console.error(`AI Error executing action (Step ${step + 1}):`, err.message);
      }

      // Add a small delay to avoid hitting Gemini free-tier rate limits (15 RPM)
      await this.page.waitForTimeout(4500);

      step++;
    }
    
    console.log(`Failed to achieve goal within ${maxSteps} steps.`);
    return false;
  }
}
