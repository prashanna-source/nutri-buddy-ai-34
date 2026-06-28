import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const inputSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Easy"),
  cuisine: z.string().default("Indian"),
  preference: z.string().default("Balanced"),
  ingredients: z.array(z.string()).default([]),
});

const recipeSchema = z.object({
  dishName: z.string(),
  cuisineType: z.string(),
  cookingTimeMinutes: z.number(),
  difficulty: z.string(),
  servings: z.number(),
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  fiberG: z.number(),
  ingredients: z.array(z.object({ item: z.string(), quantity: z.string() })),
  instructions: z.array(z.string()),
  variations: z.array(z.object({ name: z.string(), changes: z.array(z.string()) })),
  liquidAlternative: z.object({
    name: z.string(),
    type: z.string(),
    calories: z.number(),
    proteinG: z.number(),
    carbsG: z.number(),
    fatG: z.number(),
    instructions: z.array(z.string()),
  }),
});

async function generateImageDataUrl(apiKey: string, dishName: string): Promise<string | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-image-2",
        prompt: `Realistic premium food photography of ${dishName}, authentic South Asian household plating, warm natural light, top-down angle, appetizing, no text, no people`,
        size: "1024x1024",
        quality: "low",
        n: 1,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.data?.[0];
    if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
    if (item?.url) return item.url as string;
    return null;
  } catch {
    return null;
  }
}

export const generateRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI service is not configured");
    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);

    const { createNutriAiProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createNutriAiProvider(key);

    const ingredientsLine = data.ingredients.length
      ? `Use primarily these ingredients on hand: ${data.ingredients.join(", ")}.`
      : `Suggest affordable, commonly available ingredients.`;

    const profileLine = profile
      ? `User profile — diet: ${profile.dietary_type ?? "any"}; goals: ${(profile.health_goals ?? []).join(", ") || "general health"}; allergies: ${(profile.allergies ?? []).join(", ") || "none"}; medical conditions: ${(profile.health_conditions ?? []).join(", ") || "none"}; deficiencies: ${(profile.deficiencies ?? []).join(", ") || "none"}.`
      : "";

    let output: z.infer<typeof recipeSchema>;
    try {
      const result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt: `Create ONE personalized ${data.cuisine} ${data.mealType} recipe (${data.difficulty} difficulty, preference: ${data.preference}). ${ingredientsLine} ${profileLine} Be medically cautious — strictly respect allergies and conditions. Provide exact quantities and clear step-by-step instructions. Include three variations named "Quick Version", "High Protein Version", "Budget Friendly Version" and one nutritionally similar liquid alternative (smoothie or soup). Estimate realistic cooking time yourself.

Respond with ONLY a single valid JSON object (no markdown fences, no commentary) matching exactly this TypeScript shape:
{
  "dishName": string,
  "cuisineType": string,
  "cookingTimeMinutes": number,
  "difficulty": string,
  "servings": number,
  "calories": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "fiberG": number,
  "ingredients": Array<{ "item": string, "quantity": string }>,
  "instructions": string[],
  "variations": Array<{ "name": string, "changes": string[] }>,
  "liquidAlternative": { "name": string, "type": string, "calories": number, "proteinG": number, "carbsG": number, "fatG": number, "instructions": string[] }
}`,
      });
      const raw = result.text ?? "";
      const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const start = cleaned.search(/[{[]/);
      const end = cleaned.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("Model did not return JSON");
      let jsonStr = cleaned.slice(start, end + 1);
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        jsonStr = jsonStr.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, "");
        parsed = JSON.parse(jsonStr);
      }
      output = recipeSchema.parse(parsed);
    } catch (err) {
      console.error("Recipe generation failed", err);
      throw new Error(err instanceof Error ? err.message : "Recipe generation failed");
    }

    const image_url = await generateImageDataUrl(key, output.dishName);

    const row = {
      user_id: context.userId,
      dish_name: output.dishName,
      cuisine_type: output.cuisineType,
      meal_type: data.mealType,
      cooking_time_minutes: output.cookingTimeMinutes,
      difficulty: output.difficulty,
      servings: output.servings,
      calories: output.calories,
      protein_g: output.proteinG,
      carbs_g: output.carbsG,
      fat_g: output.fatG,
      fiber_g: output.fiberG,
      ingredients: output.ingredients,
      instructions: output.instructions,
      variations: output.variations,
      liquid_alternative: output.liquidAlternative,
      image_url,
      generation_input: data,
      youtube_query: `${output.dishName} healthy recipe`,
    };
    const { data: saved, error } = await context.supabase
      .from("recipes")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: saved.id, image_url, ...output };
  });

export const listRecipes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("recipes")
      .select("id,dish_name,cuisine_type,meal_type,calories,protein_g,carbs_g,fat_g,fiber_g,cooking_time_minutes,difficulty,image_url,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("recipes")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addRecipeToMeals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ recipeId: z.string().uuid(), mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: r, error } = await context.supabase
      .from("recipes")
      .select("dish_name,meal_type,calories,protein_g,carbs_g,fat_g,fiber_g")
      .eq("id", data.recipeId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!r) throw new Error("Recipe not found");
    const logged_on = new Date().toISOString().slice(0, 10);
    const allowed = ["breakfast", "lunch", "dinner", "snack"] as const;
    const meal_type = (data.mealType ?? (allowed.includes(r.meal_type as any) ? r.meal_type : "snack")) as typeof allowed[number];
    const insert = await context.supabase.from("meal_logs").insert({
      user_id: context.userId,
      meal_type,
      meal_name: r.dish_name,
      servings: 1,
      calories: r.calories ?? 0,
      protein_g: r.protein_g ?? 0,
      carbs_g: r.carbs_g ?? 0,
      fat_g: r.fat_g ?? 0,
      fiber_g: r.fiber_g ?? 0,
      recipe_id: data.recipeId,
      logged_on,
    });
    if (insert.error) throw new Error(insert.error.message);
    // refresh nutrition_logs
    const { data: rows } = await context.supabase
      .from("meal_logs")
      .select("calories,protein_g,carbs_g,fat_g,fiber_g")
      .eq("user_id", context.userId)
      .eq("logged_on", logged_on);
    const totals = (rows ?? []).reduce(
      (a: any, x: any) => ({
        calories: a.calories + (x.calories || 0),
        protein_g: a.protein_g + Number(x.protein_g || 0),
        carbs_g: a.carbs_g + Number(x.carbs_g || 0),
        fat_g: a.fat_g + Number(x.fat_g || 0),
        fiber_g: a.fiber_g + Number(x.fiber_g || 0),
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
    );
    await context.supabase
      .from("nutrition_logs")
      .upsert({ user_id: context.userId, logged_on, ...totals }, { onConflict: "user_id,logged_on" });
    return { ok: true };
  });
