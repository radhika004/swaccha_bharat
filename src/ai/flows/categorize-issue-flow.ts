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
  prompt: `You are an expert AI assistant responsible for categorizing civic issues based on visual and textual information.
Your goal is to accurately assign one of the following predefined categories to the reported issue:
- garbage
- drainage
- potholes
- streetlights
- other

Analyze the provided issue caption and, more importantly, the issue image (if available).
Issue Caption: {{{caption}}}
{{#if imageDataUri}}Issue Image: {{media url=imageDataUri}}{{/if}}

Instructions for categorization:
1.  Prioritize the visual evidence from the image if one is provided. The image is the primary source for categorization.
2.  Use the caption as supplementary information to clarify or confirm the visual evidence.
3.  If the image or caption depicts multiple potential issues, categorize based on the most prominent or urgent civic problem shown.
4.  Select ONLY ONE category from the predefined list.
5.  If you are highly uncertain, or if the issue clearly does not fit into 'garbage', 'drainage', 'potholes', or 'streetlights', then categorize it as 'other'. Do not try to force a fit into an incorrect category.

Output the selected category in the specified JSON format.
`,
});

const categorizeIssueFlow = ai.defineFlow(
  {
    name: 'categorizeIssueFlow',
    inputSchema: CategorizeIssueInputSchema,
    outputSchema: CategorizeIssueOutputSchema,
  },
  async (input) => {
    // Ensure imageDataUri is passed if it exists, otherwise it's undefined (which is fine for the prompt)
    const promptInput: CategorizeIssueInput = {
      caption: input.caption,
      ...(input.imageDataUri && { imageDataUri: input.imageDataUri }),
    };

    const { output } = await categorizePrompt(promptInput);
    
    if (!output || !PREDEFINED_CATEGORIES.includes(output.category)) {
      // Fallback or error handling if AI fails to categorize or returns an invalid category
      console.warn(`AI categorization failed or returned invalid category: ${output?.category}. Defaulting to "other". Input caption: "${input.caption}"`);
      return { category: 'other' };
    }
    return output;
  }
);