// src/ai/flows/generate-fallback-dessert.ts
'use server';

/**
 * @fileOverview Generates a random dessert recipe when no food items are identified in an image.
 *
 * - generateFallbackDessert - A function that generates a random dessert recipe.
 * - GenerateFallbackDessertInput - The input type for the generateFallbackDessert function.
 * - GenerateFallbackDessertOutput - The return type for the generateFallbackDessert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFallbackDessertInputSchema = z.object({
  prompt: z
    .string()
    .optional()
    .describe('Optional prompt to guide dessert recipe generation.'),
});
export type GenerateFallbackDessertInput = z.infer<
  typeof GenerateFallbackDessertInputSchema
>;

const GenerateFallbackDessertOutputSchema = z.object({
  recipeName: z.string().describe('The name of the generated dessert recipe.'),
  ingredients: z
    .string()
    .describe('A list of ingredients required for the recipe.'),
  instructions: z.string().describe('Step-by-step instructions for the recipe.'),
  imagePrompt: z.string().describe('A prompt that can be used to generate an image of the dessert'),
});
export type GenerateFallbackDessertOutput = z.infer<
  typeof GenerateFallbackDessertOutputSchema
>;

export async function generateFallbackDessert(
  input?: GenerateFallbackDessertInput
): Promise<GenerateFallbackDessertOutput> {
  return generateFallbackDessertFlow(input ?? {});
}

const prompt = ai.definePrompt({
  name: 'generateFallbackDessertPrompt',
  input: {schema: GenerateFallbackDessertInputSchema},
  output: {schema: GenerateFallbackDessertOutputSchema},
  prompt: `You are a world-class pastry chef. Generate a random and delicious dessert recipe.

    Recipe must have:
    - recipeName
    - ingredients
    - instructions
    - imagePrompt (a prompt suitable for generating an image of the dessert)

    Do not include any preamble or postamble. Just the recipe.

    {{#if prompt}}
    Also, take into account this additional information: {{{prompt}}}
    {{/if}}
    `,
});

const generateFallbackDessertFlow = ai.defineFlow(
  {
    name: 'generateFallbackDessertFlow',
    inputSchema: GenerateFallbackDessertInputSchema,
    outputSchema: GenerateFallbackDessertOutputSchema,
  },
  async (input) => {
    const maxRetries = 3;
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const {output} = await prompt(input);
        return output!;
      } catch (error: any) {
        lastError = error;
        const isServiceUnavailable =
          error.message?.includes('503') ||
          error.message?.includes('overloaded');
          
        if (isServiceUnavailable && i < maxRetries - 1) {
          console.warn(
            `AI model service unavailable. Retrying attempt ${i + 2} of ${maxRetries}...`
          );
          await new Promise(resolve =>
            setTimeout(resolve, 1000 * Math.pow(2, i))
          );
        } else {
          throw lastError;
        }
      }
    }
    throw lastError;
  }
);
