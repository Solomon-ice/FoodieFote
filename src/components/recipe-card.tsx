"use client";

import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from './ui/separator';

interface Recipe {
  recipeName: string;
  ingredients: string;
  instructions: string;
  imageUrl: string;
}

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const parseList = (text: string) => {
    return text
      .split(/[\n,]/)
      .map(item => item.trim().replace(/^-/,'').trim())
      .filter(item => item.length > 0);
  };
  
  const ingredientsList = parseList(recipe.ingredients);
  const instructionsList = parseList(recipe.instructions);

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden shadow-lg border-2">
      <div className="relative w-full h-64 md:h-96">
        <Image
          src={recipe.imageUrl}
          alt={recipe.recipeName}
          layout="fill"
          objectFit="cover"
          className="bg-muted"
          data-ai-hint="recipe food"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
            <h2 className="font-headline text-3xl md:text-5xl font-bold text-white shadow-md">{recipe.recipeName}</h2>
        </div>
      </div>
      <CardContent className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h3 className="font-headline text-2xl font-semibold text-primary">Ingredients</h3>
          <Separator className="my-3 bg-primary/20" />
          <ul className="space-y-2 list-disc pl-5 text-lg">
            {ingredientsList.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          <h3 className="font-headline text-2xl font-semibold text-primary">Instructions</h3>
          <Separator className="my-3 bg-primary/20" />
          <ol className="space-y-4 list-decimal pl-5 text-lg">
             {instructionsList.map((item, index) => (
              <li key={index} className="pl-2">{item}</li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeCard;
