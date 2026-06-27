import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteRecipe, generateRecipe, listRecipes } from "@/lib/recipes.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recipes")({ component: RecipesPage });

function RecipesPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: list, isLoading } = useQuery({ queryKey: ["recipes"], queryFn: () => listRecipes() });
  const [form, setForm] = useState({ mealType: "lunch", difficulty: "Easy", minutes: 30, ingredients: "" });
  const [current, setCurrent] = useState<any>(null);

  const gen = useMutation({
    mutationFn: () => generateRecipe({ data: { mealType: form.mealType, goal: "", difficulty: form.difficulty, minutes: Number(form.minutes), ingredients: form.ingredients } }),
    onSuccess: (r) => { setCurrent(r); qc.invalidateQueries({ queryKey: ["recipes"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });
  const del = useMutation({ mutationFn: (id: string) => deleteRecipe({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }) });

  return <AppShell userEmail={user.email ?? ""}>
    <div className="mx-auto max-w-5xl space-y-6 p-5 pb-28 md:p-9">
      <header><p className="text-xs font-bold uppercase tracking-[.25em] text-accent">Personalized AI</p><h1 className="mt-2 font-serif text-4xl">Recipe studio</h1></header>

      <section className="premium-card rounded-2xl p-6">
        <h2 className="font-serif text-xl">Generate a recipe tuned to your profile</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select className="h-10 rounded-md border border-input bg-card px-3" value={form.mealType} onChange={(e) => setForm({ ...form, mealType: e.target.value })}>{["breakfast", "lunch", "dinner", "snack"].map(x => <option key={x} value={x}>{x}</option>)}</select>
          <select className="h-10 rounded-md border border-input bg-card px-3" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>{["Easy", "Medium", "Hard"].map(x => <option key={x}>{x}</option>)}</select>
          <Input type="number" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: Number(e.target.value) })} placeholder="Max minutes" />
          <Input value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} placeholder="Ingredients on hand (optional)" />
        </div>
        <Button variant="saffron" className="mt-5 rounded-xl" disabled={gen.isPending} onClick={() => gen.mutate()}><Sparkles className="size-4" />{gen.isPending ? "Cooking up ideas…" : "Generate recipe"}</Button>
      </section>

      {current && <section className="premium-card rounded-2xl p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">{current.cuisineType}</p>
        <h2 className="mt-2 font-serif text-3xl">{current.dishName}</h2>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground"><span>{current.cookingTimeMinutes} min</span><span>{current.difficulty}</span><span>{current.calories} kcal</span><span>{current.proteinG}g protein</span><span>{current.fiberG}g fiber</span></div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div><h3 className="font-semibold">Ingredients</h3><ul className="mt-2 space-y-1 text-sm">{current.ingredients.map((i: any, k: number) => <li key={k}>• {i.quantity} {i.item}</li>)}</ul></div>
          <div><h3 className="font-semibold">Instructions</h3><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{current.instructions.map((s: string, k: number) => <li key={k}>{s}</li>)}</ol></div>
        </div>
        {current.variations?.length > 0 && <div className="mt-6"><h3 className="font-semibold">Variations</h3><div className="mt-2 grid gap-3 md:grid-cols-3">{current.variations.map((v: any, k: number) => <div key={k} className="rounded-xl border border-border bg-card p-3"><p className="font-medium">{v.name}</p><ul className="mt-1 text-xs text-muted-foreground">{v.changes.map((c: string, i: number) => <li key={i}>• {c}</li>)}</ul></div>)}</div></div>}
        {current.liquidAlternative && <div className="mt-6 rounded-xl bg-accent/14 p-4 ring-1 ring-accent/25"><p className="text-xs font-bold uppercase tracking-widest text-accent-foreground/60">Liquid alternative</p><p className="mt-1 font-medium">{current.liquidAlternative.name} <span className="text-xs text-muted-foreground">· {current.liquidAlternative.calories} kcal · {current.liquidAlternative.proteinG}g protein</span></p></div>}
      </section>}

      <section>
        <h2 className="font-serif text-2xl">Your recipe history</h2>
        {isLoading ? <p className="mt-3 text-muted-foreground">Loading…</p> : (list?.length ?? 0) === 0 ? <p className="mt-3 text-muted-foreground">No recipes yet. Generate your first one above.</p> : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {list!.map((r: any) => (
              <div key={r.id} className="premium-card flex items-start gap-3 rounded-2xl p-4">
                <div className="flex-1">
                  <p className="font-serif text-lg">{r.dish_name}</p>
                  <p className="text-xs text-muted-foreground">{r.cuisine_type} · {r.meal_type} · {r.calories} kcal · {r.cooking_time_minutes} min</p>
                </div>
                <button onClick={() => del.mutate(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  </AppShell>;
}
