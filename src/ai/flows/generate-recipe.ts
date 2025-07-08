'use server';

/**
 * @fileOverview Generates a recipe based on identified food items.
 *
 * - generateRecipe - A function that generates a recipe based on identified food items.
 * - GenerateRecipeInput - The input type for the generateRecipe function.
 * - GenerateRecipeOutput - The return type for the generateRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipeInputSchema = z.object({
  foodItems: z
    .string()
    .describe('A comma separated list of food items identified in the image.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

const GenerateRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
  ingredients: z.string().describe('A list of ingredients for the recipe.'),
  instructions: z.string().describe('Step-by-step instructions for the recipe.'),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  return generateRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {schema: GenerateRecipeInputSchema},
  output: {schema: GenerateRecipeOutputSchema},
  prompt: `You are a world-class chef specializing in creating delicious recipes based on a given list of ingredients.

  Based on the following food items, generate a unique and tasty recipe. Include a recipe name, a list of ingredients, and step-by-step instructions.
  Respond with valid JSON that matches the schema.
  Food Items: {{{foodItems}}}
  `,
});

const generateRecipeFlow = ai.defineFlow(
  {
    name: 'generateRecipeFlow',
    inputSchema: GenerateRecipeInputSchema,
    outputSchema: GenerateRecipeOutputSchema,
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
