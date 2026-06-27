import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const mealSchema = z.object({
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  meal_name: z.string().min(1),
  servings: z.number().positive().default(1),
  calories: z.number().nonnegative(),
  protein_g: z.number().nonnegative().default(0),
  carbs_g: z.number().nonnegative().default(0),
  fat_g: z.number().nonnegative().default(0),
  fiber_g: z.number().nonnegative().default(0),
  recipe_id: z.string().uuid().nullable().optional(),
  logged_on: z.string().optional(),
});

function today() { return new Date().toISOString().slice(0, 10); }

async function refreshDaily(ctx: { supabase: any; userId: string }, logged_on: string) {
  const { data: rows } = await ctx.supabase.from("meal_logs").select("calories,protein_g,carbs_g,fat_g,fiber_g").eq("user_id", ctx.userId).eq("logged_on", logged_on);
  const totals = (rows ?? []).reduce((a: any, r: any) => ({ calories: a.calories + (r.calories || 0), protein_g: a.protein_g + Number(r.protein_g || 0), carbs_g: a.carbs_g + Number(r.carbs_g || 0), fat_g: a.fat_g + Number(r.fat_g || 0), fiber_g: a.fiber_g + Number(r.fiber_g || 0) }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });
  await ctx.supabase.from("nutrition_logs").upsert({ user_id: ctx.userId, logged_on, ...totals }, { onConflict: "user_id,logged_on" });
}

export const logMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => mealSchema.parse(input))
  .handler(async ({ data, context }) => {
    const logged_on = data.logged_on ?? today();
    const { error } = await context.supabase.from("meal_logs").insert({ user_id: context.userId, ...data, logged_on });
    if (error) throw new Error(error.message);
    await refreshDaily(context, logged_on);
    return { ok: true };
  });

export const deleteMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase.from("meal_logs").select("logged_on").eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    const { error } = await context.supabase.from("meal_logs").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    if (row?.logged_on) await refreshDaily(context, row.logged_on);
    return { ok: true };
  });

export const getDailyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const todayStr = today();
    const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    const [meals, week] = await Promise.all([
      context.supabase.from("meal_logs").select("*").eq("user_id", context.userId).eq("logged_on", todayStr).order("created_at"),
      context.supabase.from("nutrition_logs").select("logged_on,calories,protein_g").eq("user_id", context.userId).gte("logged_on", weekAgo).order("logged_on"),
    ]);
    const todayTotals = (meals.data ?? []).reduce((a: any, r: any) => ({ calories: a.calories + (r.calories || 0), protein_g: a.protein_g + Number(r.protein_g || 0), carbs_g: a.carbs_g + Number(r.carbs_g || 0), fat_g: a.fat_g + Number(r.fat_g || 0), fiber_g: a.fiber_g + Number(r.fiber_g || 0) }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });
    return { meals: meals.data ?? [], todayTotals, week: week.data ?? [] };
  });
