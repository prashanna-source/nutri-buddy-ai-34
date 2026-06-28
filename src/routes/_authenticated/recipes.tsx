import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addRecipeToMeals, deleteRecipe, generateRecipe, listRecipes } from "@/lib/recipes.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recipes")({ component: RecipesPage });

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
const CUISINES = ["Indian", "Nepali", "Chinese", "Italian", "Mediterranean", "Continental", "Thai"];
const PREFERENCES = ["Balanced", "High Protein", "Low Carb", "Budget Friendly", "Quick Meal"];
const INGREDIENT_SUGGESTIONS = [
  "Rice", "Paneer", "Onion", "Tomato", "Spinach", "Eggs", "Milk", "Dal", "Chicken",
  "Yogurt", "Potato", "Cauliflower", "Chickpeas", "Oats", "Soy Chunks", "Tofu",
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"}`}
    >
      {children}
    </button>
  );
}

function RecipesPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: list, isLoading } = useQuery({ queryKey: ["recipes"], queryFn: () => listRecipes() });

  const [mealType, setMealType] = useState<typeof MEAL_TYPES[number]>("lunch");
  const [difficulty, setDifficulty] = useState<typeof DIFFICULTIES[number]>("Easy");
  const [cuisine, setCuisine] = useState("Indian");
  const [preference, setPreference] = useState("Balanced");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [current, setCurrent] = useState<any>(null);

  function addIngredient(value: string) {
    const v = value.trim();
    if (!v) return;
    if (ingredients.includes(v)) return;
    setIngredients([...ingredients, v]);
    setIngredientInput("");
  }
  function toggleSuggestion(s: string) {
    setIngredients(ingredients.includes(s) ? ingredients.filter((x) => x !== s) : [...ingredients, s]);
  }

  const gen = useMutation({
    mutationFn: () => generateRecipe({ data: { mealType, difficulty, cuisine, preference, ingredients } }),
    onSuccess: (r) => {
      setCurrent(r);
      qc.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Recipe ready & saved to your history");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteRecipe({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
  const addMeal = useMutation({
    mutationFn: (recipeId: string) => addRecipeToMeals({ data: { recipeId, mealType } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily"] });
      toast.success("Added to today's meals");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not log meal"),
  });

  return (
    <AppShell userEmail={user.email ?? ""}>
      <div className="mx-auto max-w-5xl space-y-8 p-5 pb-28 md:p-9">
        <header>
          <p className="text-xs font-bold uppercase tracking-[.25em] text-accent">Personalized AI</p>
          <h1 className="mt-2 font-serif text-4xl">Recipe studio</h1>
          <p className="mt-2 text-muted-foreground">Tell us what you have. The AI will time and tune everything to your profile.</p>
        </header>

        <section className="premium-card space-y-6 rounded-2xl p-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Meal type</p>
            <div className="flex flex-wrap gap-2">{MEAL_TYPES.map((m) => <Chip key={m} active={mealType === m} onClick={() => setMealType(m)}>{m[0].toUpperCase() + m.slice(1)}</Chip>)}</div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Difficulty</p>
            <div className="flex flex-wrap gap-2">{DIFFICULTIES.map((d) => <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>{d}</Chip>)}</div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Cuisine</p>
            <div className="flex flex-wrap gap-2">{CUISINES.map((c) => <Chip key={c} active={cuisine === c} onClick={() => setCuisine(c)}>{c}</Chip>)}</div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Preference</p>
            <div className="flex flex-wrap gap-2">{PREFERENCES.map((p) => <Chip key={p} active={preference === p} onClick={() => setPreference(p)}>{p}</Chip>)}</div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Ingredients on hand</p>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing) => (
                <span key={ing} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground">
                  {ing}
                  <button onClick={() => setIngredients(ingredients.filter((x) => x !== ing))} className="hover:opacity-70"><X className="size-3" /></button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addIngredient(ingredientInput); } }}
                placeholder="Type an ingredient and press Enter"
              />
              <Button type="button" variant="outline" onClick={() => addIngredient(ingredientInput)}><Plus className="size-4" /></Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {INGREDIENT_SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => toggleSuggestion(s)}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${ingredients.includes(s) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  {ingredients.includes(s) && <Check className="size-3" />} {s}
                </button>
              ))}
            </div>
          </div>

          <Button variant="saffron" size="lg" className="w-full rounded-xl" disabled={gen.isPending} onClick={() => gen.mutate()}>
            <Sparkles className="size-4" />
            {gen.isPending ? "Cooking up your recipe…" : "Generate recipe"}
          </Button>
        </section>

        {current && (
          <section className="premium-card overflow-hidden rounded-2xl">
            {current.image_url && <img src={current.image_url} alt={current.dishName} className="h-72 w-full object-cover" />}
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">{current.cuisineType}</p>
              <h2 className="mt-2 font-serif text-3xl">{current.dishName}</h2>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>{current.cookingTimeMinutes} min</span>
                <span>{current.difficulty}</span>
                <span>{current.calories} kcal</span>
                <span>{current.proteinG}g protein</span>
                <span>{current.carbsG}g carbs</span>
                <span>{current.fatG}g fat</span>
                <span>{current.fiberG}g fiber</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="premium" onClick={() => addMeal.mutate(current.id)} disabled={addMeal.isPending}>
                  <Plus className="size-4" />Add to today's meals
                </Button>
                <span className="inline-flex items-center gap-2 rounded-full bg-chart-2/15 px-3 py-1.5 text-xs font-medium text-chart-2">
                  <Check className="size-3.5" /> Saved to history
                </span>
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold">Ingredients</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {current.ingredients.map((i: any, k: number) => <li key={k}>• {i.quantity} {i.item}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">Instructions</h3>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                    {current.instructions.map((s: string, k: number) => <li key={k}>{s}</li>)}
                  </ol>
                </div>
              </div>
              {current.variations?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold">Variations</h3>
                  <div className="mt-2 grid gap-3 md:grid-cols-3">
                    {current.variations.map((v: any, k: number) => (
                      <div key={k} className="rounded-xl border border-border bg-card p-3">
                        <p className="font-medium">{v.name}</p>
                        <ul className="mt-1 text-xs text-muted-foreground">
                          {v.changes.map((c: string, i: number) => <li key={i}>• {c}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {current.liquidAlternative && (
                <div className="mt-6 rounded-xl bg-accent/14 p-4 ring-1 ring-accent/25">
                  <p className="text-xs font-bold uppercase tracking-widest text-accent-foreground/60">Liquid alternative</p>
                  <p className="mt-1 font-medium">{current.liquidAlternative.name}{" "}
                    <span className="text-xs text-muted-foreground">· {current.liquidAlternative.calories} kcal · {current.liquidAlternative.proteinG}g protein</span>
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-serif text-2xl">Your recipe history</h2>
          {isLoading ? (
            <p className="mt-3 text-muted-foreground">Loading…</p>
          ) : (list?.length ?? 0) === 0 ? (
            <p className="mt-3 text-muted-foreground">No recipes yet. Generate your first one above.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {list!.map((r: any) => (
                <div key={r.id} className="premium-card overflow-hidden rounded-2xl">
                  {r.image_url && <img src={r.image_url} alt={r.dish_name} className="h-40 w-full object-cover" />}
                  <div className="flex items-start gap-3 p-4">
                    <div className="flex-1">
                      <p className="font-serif text-lg">{r.dish_name}</p>
                      <p className="text-xs text-muted-foreground">{r.cuisine_type} · {r.meal_type} · {r.calories} kcal · {r.cooking_time_minutes} min</p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => addMeal.mutate(r.id)} disabled={addMeal.isPending}>
                          <Plus className="size-3.5" />Log
                        </Button>
                      </div>
                    </div>
                    <button onClick={() => del.mutate(r.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
