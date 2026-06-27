import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteMeal, getDailyData, logMeal } from "@/lib/meals.functions";
import { loadProfile } from "@/lib/profile.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meals")({ component: MealsPage });

const TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

function MealsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => loadProfile() });
  const { data, isLoading } = useQuery({ queryKey: ["daily"], queryFn: () => getDailyData() });
  const [form, setForm] = useState({ meal_type: "breakfast" as typeof TYPES[number], meal_name: "", servings: "1", calories: "", protein_g: "", carbs_g: "", fat_g: "", fiber_g: "" });

  const log = useMutation({
    mutationFn: () => logMeal({ data: {
      meal_type: form.meal_type, meal_name: form.meal_name, servings: Number(form.servings) || 1,
      calories: Number(form.calories) || 0, protein_g: Number(form.protein_g) || 0,
      carbs_g: Number(form.carbs_g) || 0, fat_g: Number(form.fat_g) || 0, fiber_g: Number(form.fiber_g) || 0,
    }}),
    onSuccess: () => { toast.success("Meal logged"); setForm({ ...form, meal_name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "", fiber_g: "" }); qc.invalidateQueries({ queryKey: ["daily"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not log"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteMeal({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily"] }),
  });

  const totals = data?.todayTotals ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  const calTarget = profile?.calorie_target ?? 2000;
  const proTarget = profile?.protein_target_g ?? 100;

  return <AppShell userEmail={user.email ?? ""}>
    <div className="mx-auto max-w-4xl space-y-6 p-5 pb-28 md:p-9">
      <header><p className="text-xs font-bold uppercase tracking-[.25em] text-accent">Today</p><h1 className="mt-2 font-serif text-4xl">Meal tracker</h1></header>

      <section className="grid gap-3 sm:grid-cols-4">
        {[
          { l: "Calories", v: totals.calories, t: calTarget, u: "" },
          { l: "Protein", v: Math.round(Number(totals.protein_g)), t: proTarget, u: "g" },
          { l: "Carbs", v: Math.round(Number(totals.carbs_g)), t: profile?.carbs_target_g ?? 250, u: "g" },
          { l: "Fat", v: Math.round(Number(totals.fat_g)), t: profile?.fat_target_g ?? 70, u: "g" },
        ].map((x) => (
          <div key={x.l} className="premium-card rounded-2xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{x.l}</p>
            <p className="mt-2 text-xl font-bold">{x.v}{x.u} <span className="text-xs font-medium text-muted-foreground">/ {x.t}{x.u}</span></p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (x.v / Math.max(1, x.t)) * 100)}%` }} /></div>
          </div>
        ))}
      </section>

      <section className="premium-card rounded-2xl p-6">
        <h2 className="font-serif text-xl">Log a meal</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select className="h-10 rounded-md border border-input bg-card px-3" value={form.meal_type} onChange={(e) => setForm({ ...form, meal_type: e.target.value as any })}>{TYPES.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}</select>
          <Input value={form.meal_name} onChange={(e) => setForm({ ...form, meal_name: e.target.value })} placeholder="What did you eat?" />
          <Input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="Calories (kcal)" />
          <Input type="number" value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} placeholder="Protein (g)" />
          <Input type="number" value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: e.target.value })} placeholder="Carbs (g)" />
          <Input type="number" value={form.fat_g} onChange={(e) => setForm({ ...form, fat_g: e.target.value })} placeholder="Fat (g)" />
          <Input type="number" value={form.fiber_g} onChange={(e) => setForm({ ...form, fiber_g: e.target.value })} placeholder="Fiber (g)" />
          <Input type="number" step="0.5" value={form.servings} onChange={(e) => setForm({ ...form, servings: e.target.value })} placeholder="Servings" />
        </div>
        <Button variant="saffron" className="mt-5 w-full rounded-xl" disabled={log.isPending || !form.meal_name || !form.calories} onClick={() => log.mutate()}>{log.isPending ? "Logging…" : "Log meal"}</Button>
      </section>

      <section className="premium-card rounded-2xl p-6">
        <h2 className="font-serif text-xl">Today’s meals</h2>
        {isLoading ? <p className="mt-3 text-muted-foreground">Loading…</p> : (data?.meals.length ?? 0) === 0 ? (
          <p className="mt-3 text-muted-foreground">No meals logged yet.</p>
        ) : <ul className="mt-4 divide-y divide-border">
          {data!.meals.map((m: any) => (
            <li key={m.id} className="flex items-center gap-3 py-3">
              <div className="flex-1">
                <p className="font-medium">{m.meal_name} <span className="text-xs text-muted-foreground">· {m.meal_type}</span></p>
                <p className="text-xs text-muted-foreground">{m.calories} kcal · {Math.round(Number(m.protein_g))}g protein</p>
              </div>
              <button onClick={() => remove.mutate(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>}
      </section>
    </div>
  </AppShell>;
}
