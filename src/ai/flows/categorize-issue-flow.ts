'use server';
/**
 * @fileOverview AI flow for categorizing citizen-reported issues.
 * - categorizeIssue - Function to determine the category of an issue.
 * - CategorizeIssueInput - Input type for the categorizeIssue function.
 * - CategorizeIssueOutput - Output type for the categorizeIssue function.
 */

import { ai } from '@/ai/genkit'; // Assuming this path is correct for the global 'ai' object
import { z } from 'zod';

const PREDEFINED_CATEGORIES = ['garbage', 'drainage', 'potholes', 'streetlights', 'other'] as const;

const CategorizeIssueInputSchema = z.object({
  caption: z.string().describe('The textual description of the issue reported by the citizen.'),
  imageDataUri: z.string().optional().describe(
    "A photo of the issue, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type CategorizeIssueInput = z.infer<typeof CategorizeIssueInputSchema>;

const CategorizeIssueOutputSchema = z.object({
  category: z.enum(PREDEFINED_CATEGORIES).describe('The most relevant category for the issue from the predefined list.'),
});
export type CategorizeIssueOutput = z.infer<typeof CategorizeIssueOutputSchema>;

export async function categorizeIssue(input: CategorizeIssueInput): Promise<CategorizeIssueOutput> {
  // In a real scenario, you might want to add more error handling or retries here.
  try {
    const result = await categorizeIssueFlow(input);
    return result;
  } catch (error) {
    console.error("Error in categorizeIssue flow:", error);
    // Fallback to 'other' category in case of an error during AI categorization
    return { category: 'other' };
  }
}

const categorizePrompt = ai.definePrompt({
  name: 'categorizeIssuePrompt',
  input: { schema: CategorizeIssueInputSchema },
  output: { schema: CategorizeIssueOutputSchema },
  prompt: `You are an AI assistant that categorizes civic issues.
Based on the provided caption and image (if available), determine the most appropriate category for the issue.
The available categories are: ${PREDEFINED_CATEGORIES.join(', ')}.
Please select only one category from this list.

Issue Caption: {{{caption}}}
{{#if imageDataUri}}Issue Image: {{media url=imageDataUri}}{{/if}}

Output the category in the specified JSON format. If unsure, categorize as 'other'.`,
});

const categorizeIssueFlow = ai.defineFlow(
  {
    name: 'categorizeIssueFlow',
    inputSchema: CategorizeIssueInputSchema,
    outputSchema: CategorizeIssueOutputSchema,
  },
  async (input) => {
    const { output } = await categorizePrompt(input);
    if (!output || !PREDEFINED_CATEGORIES.includes(output.category)) {
      // Fallback or error handling if AI fails to categorize or returns an invalid category
      console.warn(`AI categorization failed or returned invalid category: ${output?.category}. Defaulting to "other".`);
      return { category: 'other' };
    }
    return output;
  }
);