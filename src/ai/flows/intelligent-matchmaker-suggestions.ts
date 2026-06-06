'use server';
/**
 * @fileOverview Provides AI-driven intelligent matchmaking suggestions.
 *
 * - intelligentMatchmakerSuggestions - A function that suggests compatible profiles based on user preferences.
 * - IntelligentMatchmakerSuggestionsInput - The input type for the intelligentMatchmakerSuggestions function.
 * - IntelligentMatchmakerSuggestionsOutput - The return type for the intelligentMatchmakerSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const UserProfileSchema = z.object({
  sect: z.string().describe('The religious sect of the user.'),
  education: z.string().describe('The educational background of the user.'),
  lifestyle: z.string().describe('The lifestyle description of the user.'),
  city: z.string().describe('The city where the user resides.'),
  maritalStatus: z.string().describe('The marital status of the user.'),
  age: z.number().describe('The age of the user.').int(),
});

const AvailableProfileSchema = z.object({
  profileId: z.string().describe('The unique identifier for the profile.'),
  sect: z.string().describe('The religious sect of the profile.'),
  education: z.string().describe('The educational background of the profile.'),
  lifestyle: z.string().describe('The lifestyle description of the profile.'),
  city: z.string().describe('The city where the profile resides.'),
  maritalStatus: z.string().describe('The marital status of the profile.'),
  age: z.number().describe('The age of the profile.').int(),
});

const IntelligentMatchmakerSuggestionsInputSchema = z.object({
  userProfile: UserProfileSchema.describe("The current user's profile details."),
  availableProfiles: z.array(AvailableProfileSchema).describe('A list of available profiles to consider for matching.'),
});
export type IntelligentMatchmakerSuggestionsInput = z.infer<typeof IntelligentMatchmakerSuggestionsInputSchema>;

const IntelligentMatchmakerSuggestionsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      profileId: z.string().describe('The ID of the suggested compatible profile.'),
      reason: z.string().describe('A brief explanation of why this profile is compatible.'),
    })
  ).describe('A list of suggested compatible profiles with reasons for compatibility.'),
});
export type IntelligentMatchmakerSuggestionsOutput = z.infer<typeof IntelligentMatchmakerSuggestionsOutputSchema>;

/**
 * Defines the AI prompt for matchmaking suggestions.
 * Uses Handlebars templating to inject user and available profile data.
 */
const prompt = ai.definePrompt({
  name: 'intelligentMatchmakerPrompt',
  input: { schema: IntelligentMatchmakerSuggestionsInputSchema },
  output: { schema: IntelligentMatchmakerSuggestionsOutputSchema },
  system: "You are an expert matrimonial matchmaker for Al Batul Matrimony. Your goal is to suggest highly compatible profiles based on the user's profile and preferences, considering sect, education, lifestyle, city, marital status, and age.",
  prompt: `
User's Profile:
Sect: {{{userProfile.sect}}}
Education: {{{userProfile.education}}}
Lifestyle: {{{userProfile.lifestyle}}}
City: {{{userProfile.city}}}
Marital Status: {{{userProfile.maritalStatus}}}
Age: {{{userProfile.age}}}

Available Profiles to Consider (choose up to 3 most compatible):
{{#each availableProfiles}}
Profile ID: {{{profileId}}}
Sect: {{{sect}}}
Education: {{{education}}}
Lifestyle: {{{lifestyle}}}
City: {{{city}}}
Marital Status: {{{maritalStatus}}}
Age: {{{age}}}
---
{{/each}}

Based on the user's profile, carefully review the available profiles and suggest up to 3 most compatible matches. For each suggestion, provide a brief reason for its compatibility.`,
});

/**
 * Genkit Flow for generating intelligent matchmaker suggestions.
 */
const intelligentMatchmakerSuggestionsFlow = ai.defineFlow(
  {
    name: 'intelligentMatchmakerSuggestionsFlow',
    inputSchema: IntelligentMatchmakerSuggestionsInputSchema,
    outputSchema: IntelligentMatchmakerSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate matchmaker suggestions.');
    }
    return output;
  }
);

/**
 * Server-side wrapper function to invoke the matchmaking suggestions flow.
 */
export async function intelligentMatchmakerSuggestions(input: IntelligentMatchmakerSuggestionsInput): Promise<IntelligentMatchmakerSuggestionsOutput> {
  return intelligentMatchmakerSuggestionsFlow(input);
}
