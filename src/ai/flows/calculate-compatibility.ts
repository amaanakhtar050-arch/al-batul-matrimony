'use server';
/**
 * @fileOverview Provides AI-driven compatibility scoring between two users.
 *
 * - calculateCompatibility - A function that calculates a compatibility score and reasons.
 * - CalculateCompatibilityInput - The input type for the calculateCompatibility function.
 * - CalculateCompatibilityOutput - The return type for the calculateCompatibility function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProfileSnapshotSchema = z.object({
  fullName: z.string().optional(),
  age: z.number().int(),
  sect: z.string(),
  education: z.string().optional(),
  occupation: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  maritalStatus: z.string().optional(),
  lifestyle: z.string().optional(),
  partnerPreferences: z.object({
    minAge: z.number().int().optional(),
    maxAge: z.number().int().optional(),
    sect: z.string().optional(),
    education: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
});

const CalculateCompatibilityInputSchema = z.object({
  viewerProfile: ProfileSnapshotSchema.describe("The profile of the user viewing the candidate."),
  targetProfile: ProfileSnapshotSchema.describe("The profile of the candidate being viewed."),
});
export type CalculateCompatibilityInput = z.infer<typeof CalculateCompatibilityInputSchema>;

const CalculateCompatibilityOutputSchema = z.object({
  score: z.number().describe('A compatibility score from 0 to 100.').int(),
  reasons: z.array(z.string()).describe('A list of reasons explaining the compatibility score.'),
});
export type CalculateCompatibilityOutput = z.infer<typeof CalculateCompatibilityOutputSchema>;

const prompt = ai.definePrompt({
  name: 'calculateCompatibilityPrompt',
  input: { schema: CalculateCompatibilityInputSchema },
  output: { schema: CalculateCompatibilityOutputSchema },
  system: "You are an expert matrimonial matchmaker for Al Batul Matrimony. Your goal is to provide a precise compatibility score and detailed reasoning between two Muslim individuals based on their profiles and preferences.",
  prompt: `
Calculate compatibility between:
Viewer: {{{viewerProfile.fullName}}} ({{{viewerProfile.age}}}, {{{viewerProfile.sect}}}, {{{viewerProfile.maritalStatus}}})
Target: {{{targetProfile.fullName}}} ({{{targetProfile.age}}}, {{{targetProfile.sect}}}, {{{targetProfile.maritalStatus}}})

Viewer Attributes:
- Education: {{{viewerProfile.education}}}
- Profession: {{{viewerProfile.occupation}}}
- Location: {{{viewerProfile.city}}}, {{{viewerProfile.country}}}
- Lifestyle: {{{viewerProfile.lifestyle}}}
- Preferences: {{{viewerProfile.partnerPreferences.minAge}}}-{{{viewerProfile.partnerPreferences.maxAge}}} years, Sect: {{{viewerProfile.partnerPreferences.sect}}}, Edu: {{{viewerProfile.partnerPreferences.education}}}, Loc: {{{viewerProfile.partnerPreferences.location}}}

Target Attributes:
- Education: {{{targetProfile.education}}}
- Profession: {{{targetProfile.occupation}}}
- Location: {{{targetProfile.city}}}, {{{targetProfile.country}}}
- Lifestyle: {{{targetProfile.lifestyle}}}
- Preferences: {{{targetProfile.partnerPreferences.minAge}}}-{{{targetProfile.partnerPreferences.maxAge}}} years, Sect: {{{targetProfile.partnerPreferences.sect}}}, Edu: {{{targetProfile.partnerPreferences.education}}}, Loc: {{{targetProfile.partnerPreferences.location}}}

Analyze sectarian alignment, educational level, professional status, age range matching (against preferences), and location proximity.
Return a score (0-100) and 3-4 professional, sincere reasons.`,
});

const calculateCompatibilityFlow = ai.defineFlow(
  {
    name: 'calculateCompatibilityFlow',
    inputSchema: CalculateCompatibilityInputSchema,
    outputSchema: CalculateCompatibilityOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('No output from compatibility prompt');
      }
      return output;
    } catch (error) {
      console.error('Compatibility Flow Error:', error);
      return { score: 0, reasons: ["AI analysis is currently unavailable."] };
    }
  }
);

export async function calculateCompatibility(input: CalculateCompatibilityInput): Promise<CalculateCompatibilityOutput> {
  return calculateCompatibilityFlow(input);
}
