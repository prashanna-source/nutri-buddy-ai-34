import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { addRecipeToMeals, deleteRecipe, listRecipes } from "@/lib/recipes.functions";
import {
  generateDishImage,
  generateRecipeOptions,
  saveGeneratedRecipe,
  type GeneratedRecipe,
} from "@/lib/recipe-options.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookmarkPlus, Check, Clock, Flame, Plus, Sparkles, Trash2, Utensils, Youtube } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recipes")({ component: RecipesPage });

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const CUISINES = ["Any", "Indian", "Nepali", "Continental"];
const PREFERENCES = ["Balanced", "High Protein", "Low Carb", "Budget Friendly", "Light & Fibre Rich"];
const TIMES = [20, 30, 45, 60];
const RECENT_KEY = "foodveda:recent-dishes";

type MealType = (typeof MEAL_TYPES)[number];

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}
function pushRecent(names: string[]) {
  if (typeof window === "undefined") return;
  const merged = Array.from(new Set([...names, ...readRecent()])).slice(0, 60);
  localStorage.setItem(RECENT_KEY, JSON.stringify(merged));
}

/* ---- lazy dish images, max 3 in flight ---- */
const imageCache = new Map<string, string | null>();
let inFlight = 0;
const queue: (() => void)[] = [];
function runNext() {
  if (inFlight >= 3) return;
  const job = queue.shift();
  if (!job) return;
  inFlight += 1;
  job();
}
function fetchDishImage(dishName: string, cuisine: string): Promise<string | null> {
  if (imageCache.has(dishName)) return Promise.resolve(imageCache.get(dishName) ?? null);
  return new Promise((resolve) => {
    queue.push(() => {
      generateDishImage({ data: { dishName, cuisine } })
        .then((r) => {
          imageCache.set(dishName, r.image_url ?? null);
          resolve(r.image_url ?? null);
        })
        .catch(() => resolve(null))
        .finally(() => {
          inFlight -= 1;
          runNext();
        });
    });
    runNext();
  });
}

function DishImage({ recipe, className }: { recipe: GeneratedRecipe; className?: string }) {
  const [src, setSrc] = useState<string | null>(imageCache.get(recipe.dishName) ?? null);
  useEffect(() => {
    let alive = true;
    if (!src) fetchDishImage(recipe.dishName, recipe.cuisineType).then((u) => alive && setSrc(u));
    return () => {
      alive = false;
    };
  }, [recipe.dishName]);
  if (src) return <img src={src} alt={recipe.dishName} className={className} loading="lazy" />;
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-primary/15 via-accent/10 to-muted ${className}`}>
      <Utensils className="size-7 animate-pulse text-primary/50" />
    </div>
  );
}

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

  const [mealType, setMealType] = useState<MealType>("lunch");
  const [cuisine, setCuisine] = useState("Any");
  const [preference, setPreference] = useState("Balanced");
  const [maxMinutes, setMaxMinutes] = useState(45);
  const [options, setOptions] = useState<GeneratedRecipe[]>([]);
  const [open, setOpen] = useState<GeneratedRecipe | null>(null);
  const modeRef = useRef<"options" | "surprise">("options");

  const gen = useMutation({
    mutationFn: (mode: "options" | "surprise") => {
      modeRef.current = mode;
      return generateRecipeOptions({
        data: { mode, mealType, cuisine, preference, maxMinutes, exclude: readRecent() },
      });
    },
    onSuccess: (recipes) => {
      pushRecent(recipes.map((r) => r.dishName));
      if (modeRef.current === "surprise") {
        setOptions(recipes);
        setOpen(recipes[0] ?? null);
        toast.success("Something new for you ✨");
      } else {
        setOptions(recipes);
        toast.success(`${recipes.length} personalised ideas ready`);
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });

  const persist = useCallback(
    async (r: GeneratedRecipe) => {
      const image_url = imageCache.get(r.dishName) ?? null;
      const { id } = await saveGeneratedRecipe({ data: { ...r, mealType, image_url } });
      qc.invalidateQueries({ queryKey: ["recipes"] });
      return id;
    },
    [mealType, qc],
  );

  const save = useMutation({
    mutationFn: persist,
    onSuccess: () => toast.success("Saved to your recipe history"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const logNew = useMutation({
    mutationFn: async (r: GeneratedRecipe) => {
      const id = await persist(r);
      await addRecipeToMeals({ data: { recipeId: id, mealType } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily"] });
      qc.invalidateQueries({ queryKey: ["week"] });
      toast.success("Logged to today's meals");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not log meal"),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteRecipe({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
  const logSaved = useMutation({
    mutationFn: (recipeId: string) => addRecipeToMeals({ data: { recipeId, mealType } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily"] });
      toast.success("Added to today's meals");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not log meal"),
  });

  const busy = gen.isPending;

  return (
    <AppShell userEmail={user.email ?? ""}>
      <div className="mx-auto max-w-6xl space-y-8 p-5 pb-28 md:p-9">
        <header>
          <p className="text-xs font-bold uppercase tracking-[.25em] text-accent">Personalized AI</p>
          <h1 className="mt-2 font-serif text-4xl">Recipe studio</h1>
          <p className="mt-2 text-muted-foreground">
            Ten genuinely different Indian &amp; Nepali ideas at a time, matched to your profile, goals and allergies.
          </p>
        </header>

        <section className="premium-card space-y-6 rounded-2xl p-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Meal type</p>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((m) => (
                <Chip key={m} active={mealType === m} onClick={() => setMealType(m)}>
                  {m[0].toUpperCase() + m.slice(1)}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Cuisine</p>
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((c) => (
                <Chip key={c} active={cuisine === c} onClick={() => setCuisine(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Nutrition preference</p>
            <div className="flex flex-wrap gap-2">
              {PREFERENCES.map((p) => (
                <Chip key={p} active={preference === p} onClick={() => setPreference(p)}>
                  {p}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Cooking time</p>
            <div className="flex flex-wrap gap-2">
              {TIMES.map((t) => (
                <Chip key={t} active={maxMinutes === t} onClick={() => setMaxMinutes(t)}>
                  Under {t} min
                </Chip>
              ))}
            </div>
          </div>
          <p className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
            <Check className="mr-1 inline size-3 text-primary" />
            No ingredient list needed — recipes use everyday Indian &amp; Nepali household ingredients and avoid anything you're allergic to.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="saffron" size="lg" className="w-full rounded-xl" disabled={busy} onClick={() => gen.mutate("options")}>
              <Sparkles className="size-4" />
              {busy && modeRef.current === "options" ? "Finding 10 ideas…" : "Give Me Options"}
            </Button>
            <Button variant="premium" size="lg" className="w-full rounded-xl" disabled={busy} onClick={() => gen.mutate("surprise")}>
              <Sparkles className="size-4" />
              {busy && modeRef.current === "surprise" ? "Thinking…" : "Surprise Me ✨"}
            </Button>
          </div>
        </section>

        {busy && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: modeRef.current === "surprise" ? 1 : 6 }).map((_, i) => (
              <div key={i} className="premium-card h-64 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        )}

        {!busy && options.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-serif text-2xl">
              {options.length === 1 ? "Your surprise pick" : `${options.length} recommendations for you`}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {options.map((r) => (
                <article key={r.dishName} className="premium-card flex flex-col overflow-hidden rounded-2xl">
                  <DishImage recipe={r} className="h-40 w-full object-cover" />
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-accent">{r.cuisineType}</p>
                    <h3 className="mt-1 font-serif text-lg leading-tight">{r.dishName}</h3>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Flame className="size-3.5" />{Math.round(r.calories)} kcal</span>
                      <span>{Math.round(r.proteinG)}g protein</span>
                      <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{r.cookingTimeMinutes} min</span>
                    </div>
                    <Button variant="outline" className="mt-4 w-full rounded-xl" onClick={() => setOpen(r)}>
                      View Recipe
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-serif text-2xl">Your recipe history</h2>
          {isLoading ? (
            <p className="mt-3 text-muted-foreground">Loading…</p>
          ) : (list?.length ?? 0) === 0 ? (
            <p className="mt-3 text-muted-foreground">Nothing saved yet — generate some ideas above.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {list!.map((r: any) => (
                <div key={r.id} className="premium-card overflow-hidden rounded-2xl">
                  {r.image_url && <img src={r.image_url} alt={r.dish_name} className="h-40 w-full object-cover" />}
                  <div className="flex items-start gap-3 p-4">
                    <div className="flex-1">
                      <p className="font-serif text-lg">{r.dish_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.cuisine_type} · {r.meal_type} · {r.calories} kcal · {r.cooking_time_minutes} min
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => logSaved.mutate(r.id)} disabled={logSaved.isPending}>
                          <Plus className="size-3.5" />Log
                        </Button>
                      </div>
                    </div>
                    <button onClick={() => del.mutate(r.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete recipe">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
          {open && (
            <div>
              <DishImage recipe={open} className="h-56 w-full object-cover" />
              <div className="space-y-5 p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-accent">
                    {open.cuisineType}{open.region ? ` · ${open.region}` : ""}
                  </p>
                  <h2 className="mt-1 font-serif text-3xl">{open.dishName}</h2>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>{open.cookingTimeMinutes} min</span>
                    <span>{open.difficulty}</span>
                    <span>{open.servings} servings</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[
                    ["Calories", `${Math.round(open.calories)}`],
                    ["Protein", `${Math.round(open.proteinG)}g`],
                    ["Carbs", `${Math.round(open.carbsG)}g`],
                    ["Fat", `${Math.round(open.fatG)}g`],
                    ["Fiber", `${Math.round(open.fiberG)}g`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-muted/40 p-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                      <p className="mt-1 font-semibold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold">Ingredients</h3>
                    <ul className="mt-2 space-y-1 text-sm">
                      {open.ingredients.map((i, k) => (
                        <li key={k}>• {i.quantity} {i.item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold">Instructions</h3>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                      {open.instructions.map((s, k) => (
                        <li key={k}>{s}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="premium" onClick={() => logNew.mutate(open)} disabled={logNew.isPending}>
                    <Plus className="size-4" />Log This Meal
                  </Button>
                  <Button variant="outline" onClick={() => save.mutate(open)} disabled={save.isPending}>
                    <BookmarkPlus className="size-4" />Save Recipe
                  </Button>
                  <a
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:border-primary/40"
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${open.dishName} recipe`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Youtube className="size-4" />Watch Similar Recipe
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
