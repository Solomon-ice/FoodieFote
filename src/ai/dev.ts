import { config } from 'dotenv';
config();

import '@/ai/flows/generate-recipe.ts';
import '@/ai/flows/generate-recipe-image.ts';
import '@/ai/flows/identify-food.ts';
import '@/ai/flows/generate-fallback-dessert.ts';