import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Global Genkit instance initialized with the Google AI plugin.
 * We use the standard 'gemini-1.5-flash' model which is optimized for speed and efficiency.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash', // Explicitly prefix with provider
});
