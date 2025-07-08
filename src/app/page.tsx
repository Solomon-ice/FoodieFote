"use client";

import { useState, useRef } from 'react';
import { Loader2, Upload, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { identifyFood } from '@/ai/flows/identify-food';
import { generateRecipe } from '@/ai/flows/generate-recipe';
import { generateRecipeImage } from '@/ai/flows/generate-recipe-image';
import { generateFallbackDessert } from '@/ai/flows/generate-fallback-dessert';
import CameraCapture from '@/components/camera-capture';
import RecipeCard from '@/components/recipe-card';
import { Logo } from '@/components/icons';
import AuthWrapper from '@/components/auth-wrapper';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';


type AppState = 'initial' | 'capturing' | 'processing' | 'displaying' | 'error';
type Recipe = {
  recipeName: string;
  ingredients: string;
  instructions: string;
  imageUrl: string;
};

function HomePageContent() {
  const [appState, setAppState] = useState<AppState>('initial');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [processingMessage, setProcessingMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();


  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out', error);
      toast({
        variant: 'destructive',
        title: 'Error Signing Out',
        description: 'There was a problem signing you out. Please try again.',
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        processImage(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const processImage = async (photoDataUri: string) => {
    setAppState('processing');
    try {
      setProcessingMessage('Analyzing your photo...');
      const { foodItems, isFood } = await identifyFood({ photoDataUri });

      if (!isFood) {
        setProcessingMessage('No food found... creating a surprise dessert!');
        const dessertRecipe = await generateFallbackDessert();
        const { imageUrl } = await generateRecipeImage({
          recipeName: dessertRecipe.recipeName,
          ingredients: dessertRecipe.ingredients,
          instructions: dessertRecipe.instructions,
        });
        setRecipe({ ...dessertRecipe, imageUrl });
        setAppState('displaying');
        return;
      }

      setProcessingMessage('Found food! Generating a delicious recipe...');
      const recipeResult = await generateRecipe({
        foodItems: foodItems.join(', '),
      });
      
      setProcessingMessage('Creating a beautiful image for your recipe...');
      const { imageUrl } = await generateRecipeImage(recipeResult);

      setRecipe({ ...recipeResult, imageUrl });
      setAppState('displaying');
    } catch (error) {
      console.error(error);
      setAppState('error');
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to generate a recipe. Please try again.',
      });
    }
  };
  
  const resetApp = () => {
    setRecipe(null);
    setAppState('initial');
  };

  const renderContent = () => {
    switch (appState) {
      case 'initial':
        return (
          <div className="text-center animate-in fade-in duration-500">
            <h2 className="font-headline text-3xl md:text-4xl font-semibold">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Welcome, {user?.displayName?.split(' ')[0]}!
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Upload a photo or take a picture of your ingredients.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleUploadClick} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Upload className="mr-2 h-5 w-5" />
                Upload a Photo
              </Button>
              <Button size="lg" variant="secondary" onClick={() => setAppState('capturing')}>
                <Camera className="mr-2 h-5 w-5" />
                Take a Picture
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        );
      case 'capturing':
        return (
          <CameraCapture
            onCapture={processImage}
            onCancel={() => setAppState('initial')}
          />
        );
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center gap-4 text-center animate-in fade-in duration-500">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="font-headline text-2xl font-semibold text-primary-foreground/90">
              {processingMessage}
            </p>
          </div>
        );
      case 'displaying':
        return recipe ? (
          <div className="w-full animate-in fade-in duration-700">
            <RecipeCard recipe={recipe} />
            <div className="mt-8 text-center">
              <Button size="lg" onClick={resetApp}>Start Over</Button>
            </div>
          </div>
        ) : null;
      case 'error':
         return (
          <div className="text-center animate-in fade-in duration-500">
            <h2 className="font-headline text-3xl font-semibold text-destructive">Something Went Wrong</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We couldn't generate a recipe. Please try again.
            </p>
            <div className="mt-8">
              <Button size="lg" onClick={resetApp}>Try Again</Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Logo className="h-8 w-8 text-primary" />
                <h1 className="font-headline text-3xl font-bold text-primary-foreground/90">FoodieFoto</h1>
            </div>
            <Button onClick={handleSignOut} variant="secondary">Sign Out</Button>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {renderContent()}
        </div>
      </main>
      <footer className="py-6 px-4 sm:px-6 text-center text-muted-foreground text-sm">
        <p>&copy; 2025 FoodieFoto. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function Home() {
    return (
        <AuthWrapper>
            <HomePageContent />
        </AuthWrapper>
    )
}
