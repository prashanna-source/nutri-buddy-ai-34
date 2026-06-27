import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { calculateTargets } from "@/lib/nutrition";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().min(1),
  age: z.number().int().positive().nullable(),
  gender: z.string().nullable(),
  height_cm: z.number().positive().nullable(),
  weight_kg: z.number().positive().nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  health_goals: z.array(z.string()),
  activity_level: z.string(),
  dietary_type: z.string(),
  cuisine_preferences: z.array(z.string()),
  food_preferences: z.array(z.string()),
  allergies: z.array(z.string()),
  health_conditions: z.array(z.string()),
  deficiencies: z.array(z.string()),
  onboarding_completed: z.boolean().optional(),
});

export const loadProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const targets = calculateTargets(data);
    const row = {
      id: context.userId,
      full_name: data.full_name,
      age: data.age ?? undefined,
      gender: data.gender ?? undefined,
      height_cm: data.height_cm ?? undefined,
      weight_kg: data.weight_kg ?? undefined,
      country: data.country ?? "Nepal",
      city: data.city ?? "",
      health_goals: data.health_goals,
      activity_level: data.activity_level,
      dietary_type: data.dietary_type,
      cuisine_preferences: data.cuisine_preferences,
      food_preferences: data.food_preferences,
      allergies: data.allergies,
      health_conditions: data.health_conditions,
      deficiencies: data.deficiencies,
      calorie_target: targets.calorie_target,
      protein_target_g: targets.protein_target_g,
      carbs_target_g: targets.carbs_target_g,
      fat_target_g: targets.fat_target_g,
      fiber_target_g: targets.fiber_target_g,
      onboarding_completed: data.onboarding_completed ?? true,
    };
    const { error } = await context.supabase.from("profiles").upsert(row);
    if (error) throw new Error(error.message);
    return { ok: true, targets };
  });
