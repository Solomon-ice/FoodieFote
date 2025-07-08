'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating an image of a recipe.
 *
 * - generateRecipeImage - A function that generates an image of a given recipe.
 * - GenerateRecipeImageInput - The input type for the generateRecipeImage function.
 * - GenerateRecipeImageOutput - The return type for the generateRecipeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipeImageInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
  ingredients: z.string().describe('A comma separated list of ingredients in the recipe.'),
  instructions: z.string().describe('The instructions for making the recipe.'),
});
export type GenerateRecipeImageInput = z.infer<typeof GenerateRecipeImageInputSchema>;

const GenerateRecipeImageOutputSchema = z.object({
  imageUrl: z.string().describe('A data URI containing the generated image of the recipe.'),
});
export type GenerateRecipeImageOutput = z.infer<typeof GenerateRecipeImageOutputSchema>;

export async function generateRecipeImage(input: GenerateRecipeImageInput): Promise<GenerateRecipeImageOutput> {
  return generateRecipeImageFlow(input);
}

const generateRecipeImagePrompt = ai.definePrompt({
  name: 'generateRecipeImagePrompt',
  input: {schema: GenerateRecipeImageInputSchema},
  output: {schema: GenerateRecipeImageOutputSchema},
  prompt: `Generate an image of the following recipe:

Recipe Name: {{{recipeName}}}
Ingredients: {{{ingredients}}}
Instructions: {{{instructions}}}

Create an image that is visually appealing and represents the recipe well.`,
});

const generateRecipeImageFlow = ai.defineFlow(
  {
    name: 'generateRecipeImageFlow',
    inputSchema: GenerateRecipeImageInputSchema,
    outputSchema: GenerateRecipeImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      // IMPORTANT: ONLY the googleai/gemini-2.0-flash-preview-image-generation model is able to generate images. You MUST use exactly this model to generate images.
      model: 'googleai/gemini-2.0-flash-preview-image-generation',

      // simple prompt
      prompt: `Generate an image of a ${input.recipeName} recipe with the following ingredients ${input.ingredients}. The instructions are ${input.instructions}`,

      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });
    if (!media || !media.url) {
      throw new Error('Could not generate image for recipe.');
    }
    return {imageUrl: media.url};
  }
);
