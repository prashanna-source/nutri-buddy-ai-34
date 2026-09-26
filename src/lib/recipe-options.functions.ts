import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const optionsInput = z.object({
  mode: z.enum(["options", "surprise"]).default("options"),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).default("lunch"),
  cuisine: z.string().default("Any"),
  preference: z.string().default("Balanced"),
  maxMinutes: z.number().int().positive().default(45),
  exclude: z.array(z.string()).default([]),
});

const recipeSchema = z.object({
  dishName: z.string(),
  cuisineType: z.string(),
  region: z.string().default(""),
  mainIngredient: z.string().default(""),
  cookingMethod: z.string().default(""),
  cookingTimeMinutes: z.coerce.number(),
  difficulty: z.string().default("Easy"),
  servings: z.coerce.number().default(2),
  calories: z.coerce.number(),
  proteinG: z.coerce.number(),
  carbsG: z.coerce.number(),
  fatG: z.coerce.number(),
  fiberG: z.coerce.number(),
  ingredients: z.array(z.object({ item: z.string(), quantity: z.string() })),
  instructions: z.array(z.string()),
});
export type GeneratedRecipe = z.infer<typeof recipeSchema>;

function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.search(/[[{]/);
  const endArr = cleaned.lastIndexOf("]");
  const endObj = cleaned.lastIndexOf("}");
  const end = Math.max(endArr, endObj);
  if (start === -1 || end === -1) throw new Error("The AI did not return a recipe list");
  let slice = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    slice = slice.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\u0000-\u001F\u007F]/g, " ");
    return JSON.parse(slice);
  }
}

async function loadProfileContext(supabase: any, userId: string) {
  const [{ data: profile }, { data: recent }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("recipes")
      .select("dish_name,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  const recentNames: string[] = (recent ?? []).map((r: any) => r.dish_name);
  const p = profile ?? {};
  const profileLine = [
    `Age: ${p.age ?? "n/a"}`,
    `Gender: ${p.gender ?? "n/a"}`,
    `Height: ${p.height_cm ?? "n/a"} cm`,
    `Weight: ${p.weight_kg ?? "n/a"} kg`,
    `Activity: ${p.activity_level ?? "n/a"}`,
    `Goals: ${(p.health_goals ?? []).join(", ") || "general health"}`,
    `Dietary preference: ${p.dietary_type ?? "any"}`,
    `ALLERGIES (must never appear, not even in traces): ${(p.allergies ?? []).join(", ") || "none"}`,
    `Medical conditions: ${(p.health_conditions ?? []).join(", ") || "none"}`,
    `Deficiencies: ${(p.deficiencies ?? []).join(", ") || "none"}`,
    `Preferred cuisines: ${(p.cuisine_preferences ?? []).join(", ") || "Indian, Nepali"}`,
    `Foods they enjoy: ${(p.food_preferences ?? []).join(", ") || "household staples"}`,
    `Region: ${[p.city, p.country].filter(Boolean).join(", ") || "South Asia"}`,
    `Daily targets: ${p.calorie_target ?? "n/a"} kcal, ${p.protein_target_g ?? "n/a"}g protein, ${p.carbs_target_g ?? "n/a"}g carbs, ${p.fat_target_g ?? "n/a"}g fat`,
  ].join("\n");
  return { profileLine, recentNames };
}

export const generateRecipeOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => optionsInput.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI service is not configured");
    const { profileLine, recentNames } = await loadProfileContext(context.supabase, context.userId);
    const avoid = Array.from(new Set([...recentNames, ...data.exclude])).slice(0, 60);
    const count = data.mode === "surprise" ? 1 : 10;

    const { createNutriAiProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createNutriAiProvider(key);

    const seed = Math.random().toString(36).slice(2, 8);
    const varietyBlock =
      data.mode === "surprise"
        ? `Generate EXACTLY 1 novel, creative recipe. It must be meaningfully different from everything in the avoid-list: different main ingredient, different cooking method and different region. Surprise the user with a lesser-known but authentic regional dish (randomisation seed ${seed}).`
        : `Generate EXACTLY 10 genuinely different recipes. Hard variety rules:
- No two recipes may share the same main ingredient.
- No two recipes may share the same cooking method (steamed, fermented, pressure-cooked, tawa/griddle, stir-fried, slow-simmered, baked, no-cook, roasted, soup).
- Spread across regions: North Indian, South Indian, East/Bengali, West/Gujarati-Maharashtrian, Newari, Thakali, Himalayan/Tibetan-Nepali, plus at least one light continental-style option if the user likes it.
- Vary the meal format: dry sabzi, curry with grain, one-pot, snack/chaat, soup/jhol, salad/sadeko, fermented/steamed item, breakfast item, high-protein bowl.
- Do NOT produce minor variations of the same dish (no "paneer bhurji" plus "paneer curry"; no ten dal dishes).
- Randomisation seed ${seed} — pick a fresh combination this time.`;

    const prompt = `You are an expert Indian and Nepali home-cooking nutritionist for the Food Veda app.

USER PROFILE
${profileLine}

REQUEST
Meal type: ${data.mealType}. Cuisine leaning: ${data.cuisine}. Nutrition preference: ${data.preference}. Cooking time should stay at or under about ${data.maxMinutes} minutes.

RECENTLY SHOWN — DO NOT REPEAT OR CREATE MINOR VARIATIONS OF THESE:
${avoid.length ? avoid.join(", ") : "(nothing yet)"}

${varietyBlock}

NON-NEGOTIABLE RULES
- Respect every allergy and dietary restriction absolutely.
- Use only real, practical ingredients found in Indian and Nepali households or local markets (atta, rice, dals, besan, sooji, poha, chiura, gundruk, paneer, curd, eggs if allowed, seasonal vegetables, common spices).
- Every dish must be a REAL named dish people actually cook, personalised to the user's goals (oil, portion, grain, protein, salt tuned to their profile).
- Give realistic household quantities (katori, cup, tbsp, tsp, g) and 5-8 clear steps.
- Nutrition numbers are per serving and must be realistic.

Respond with ONLY a JSON array of ${count} object(s), no markdown fences, no commentary:
[{
 "dishName": string,
 "cuisineType": string,
 "region": string,
 "mainIngredient": string,
 "cookingMethod": string,
 "cookingTimeMinutes": number,
 "difficulty": "Easy" | "Medium" | "Hard",
 "servings": number,
 "calories": number,
 "proteinG": number,
 "carbsG": number,
 "fatG": number,
 "fiberG": number,
 "ingredients": [{ "item": string, "quantity": string }],
 "instructions": string[]
}]`;

    // Pre-assign a distinct "slot" (region + method + base ingredient) per recipe so the
    // model can't collapse into near-identical dishes.
    const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
    const regions = shuffle(["North Indian (Punjabi)", "South Indian (Tamil/Kerala)", "Karnataka/Andhra", "Bengali/Odia", "Gujarati", "Maharashtrian", "Rajasthani", "Newari", "Thakali", "Himalayan Tibetan-Nepali", "Madhesi/Terai", "Kashmiri", "Goan/Konkani", "Continental-light"]);
    const methods = shuffle(["steamed", "fermented", "pressure-cooked", "tawa/griddle", "stir-fried", "slow-simmered curry", "baked/roasted", "no-cook salad/sadeko", "soup/jhol", "grilled/tandoor-style"]);
    const bases = shuffle(["moong dal", "chana/chickpea", "rajma/kidney beans", "paneer", "egg or tofu", "millet (kodo/ragi/bajra)", "rice", "whole wheat/atta", "besan", "leafy greens (palak/saag/gundruk)", "sprouts", "soya chunks", "potato/sweet potato", "cauliflower/cabbage", "chiura/poha", "curd/yogurt", "mushroom", "lentil (masoor/urad)"]);
    const slots = Array.from({ length: count }, (_, i) => `${i + 1}. ${regions[i % regions.length]} · ${methods[i % methods.length]} · built around ${bases[i % bases.length]}`).join("\n");
    const finalPrompt = `${prompt}

ASSIGNED SLOTS — recipe N must match slot N (swap the base ingredient only if it violates the user's diet/allergies, choosing a different unused one):
${slots}`;

    let text = "";
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
              generationConfig: { temperature: 1.1, topP: 0.95, responseMimeType: "application/json" },
            }),
          },
        );
        if (res.ok) {
          const j: any = await res.json();
          text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
        } else {
          console.error("Gemini API error", res.status, (await res.text()).slice(0, 300));
        }
      } catch (e) {
        console.error("Gemini API request failed", e);
      }
    }
    if (!text) {
      const result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt: finalPrompt,
        temperature: 1,
      });
      text = result.text ?? "";
    }

    const parsed = extractJson(text);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const recipes = arr
      .map((r) => recipeSchema.safeParse(r))
      .filter((r): r is { success: true; data: GeneratedRecipe } => r.success)
      .map((r) => r.data);

    // De-duplicate by dish name / main ingredient just in case.
    const seen = new Set<string>();
    const unique = recipes.filter((r) => {
      const k = r.dishName.trim().toLowerCase();
      const m = "ing:" + r.mainIngredient.trim().toLowerCase();
      if (seen.has(k) || (r.mainIngredient && seen.has(m))) return false;
      seen.add(k);
      if (r.mainIngredient) seen.add(m);
      return true;
    });
    if (unique.length === 0) throw new Error("Could not generate recipes, please try again");
    return unique.slice(0, count);
  });

export const generateDishImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ dishName: z.string().min(1), cuisine: z.string().default("") }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { image_url: null };
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-image-2",
          prompt: `Realistic food photography of ${data.dishName}, authentic ${data.cuisine || "South Asian"} home plating, warm natural light, appetizing, no text, no people`,
          size: "1024x1024",
          quality: "low",
          n: 1,
        }),
      });
      if (!res.ok) return { image_url: null };
      const json: any = await res.json();
      const item = json?.data?.[0];
      if (item?.b64_json) return { image_url: `data:image/png;base64,${item.b64_json}` as string };
      if (item?.url) return { image_url: item.url as string };
      return { image_url: null };
    } catch {
      return { image_url: null };
    }
  });

const saveInput = recipeSchema.extend({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  image_url: z.string().nullable().optional(),
});

export const saveGeneratedRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveInput.parse(input))
  .handler(async ({ data, context }) => {
    const existing = await context.supabase
      .from("recipes")
      .select("id")
      .eq("user_id", context.userId)
      .eq("dish_name", data.dishName)
      .maybeSingle();
    if (existing.data?.id) return { id: existing.data.id as string };

    const { data: saved, error } = await context.supabase
      .from("recipes")
      .insert({
        user_id: context.userId,
        dish_name: data.dishName,
        cuisine_type: data.cuisineType,
        meal_type: data.mealType,
        cooking_time_minutes: Math.round(data.cookingTimeMinutes),
        difficulty: data.difficulty,
        servings: Math.round(data.servings) || 1,
        calories: Math.round(data.calories),
        protein_g: data.proteinG,
        carbs_g: data.carbsG,
        fat_g: data.fatG,
        fiber_g: data.fiberG,
        ingredients: data.ingredients,
        instructions: data.instructions,
        variations: [],
        image_url: data.image_url ?? null,
        generation_input: { mealType: data.mealType },
        youtube_query: `${data.dishName} recipe`,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: saved.id as string };
  });
