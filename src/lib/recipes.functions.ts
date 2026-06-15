import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

const inputSchema = z.object({ cuisine: z.string(), mealType: z.string(), goal: z.string(), calories: z.number(), protein: z.number(), difficulty: z.string(), minutes: z.number(), ingredients: z.string() });
const recipeSchema = z.object({ dishName: z.string(), cuisineType: z.string(), cookingTimeMinutes: z.number(), difficulty: z.string(), servings: z.number(), calories: z.number(), proteinG: z.number(), carbsG: z.number(), fatG: z.number(), fiberG: z.number(), ingredients: z.array(z.object({ item: z.string(), quantity: z.string() })), instructions: z.array(z.string()), variations: z.array(z.object({ name: z.string(), changes: z.array(z.string()) })), liquidAlternative: z.object({ name: z.string(), type: z.string(), calories: z.number(), proteinG: z.number(), carbsG: z.number(), fatG: z.number(), instructions: z.array(z.string()) }) });

export const generateRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI service is not configured");
    const { data: profile, error: profileError } = await context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle();
    if (profileError) throw new Error(profileError.message);
    const { createNutriAiProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createNutriAiProvider(key);
    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema: recipeSchema }),
      prompt: `Create one beginner-friendly, medically cautious personalized recipe using affordable ingredients common in Nepal and India. Respect profile allergies, diet and conditions. Provide exact quantities, three variations named Quick Version, High Protein Version, Budget Friendly Version, plus a nutritionally similar liquid alternative. Profile: ${JSON.stringify(profile ?? {})}. Request: ${JSON.stringify(data)}`,
    });
    const row = { user_id: context.userId, dish_name: output.dishName, cuisine_type: output.cuisineType, meal_type: data.mealType, cooking_time_minutes: output.cookingTimeMinutes, difficulty: output.difficulty, servings: output.servings, calories: output.calories, protein_g: output.proteinG, carbs_g: output.carbsG, fat_g: output.fatG, fiber_g: output.fiberG, ingredients: output.ingredients, instructions: output.instructions, variations: output.variations, liquid_alternative: output.liquidAlternative, generation_input: data, youtube_query: `${output.dishName} healthy recipe` };
    const { data: saved, error } = await context.supabase.from("recipes").insert(row).select("id").single();
    if (error) throw new Error(error.message);
    return { id: saved.id, ...output };
  });