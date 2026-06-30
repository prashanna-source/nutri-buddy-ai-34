import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteMeal, getWeekData, logMeal, updateMeal } from "@/lib/meals.functions";
import { loadProfile } from "@/lib/profile.functions";
import { addRecipeToMeals, listRecipes } from "@/lib/recipes.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChefHat, ChevronLeft, ChevronRight, Download, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meals")({ component: MealsPage });

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = typeof MEAL_TYPES[number];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}
function ymd(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtRange(start: Date) {
  const end = addDays(start, 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

type EditingMeal = {
  id?: string;
  meal_type: MealType;
  meal_name: string;
  servings: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  fiber_g: string;
  logged_on: string;
};

function emptyMeal(date: string, type: MealType): EditingMeal {
  return { meal_type: type, meal_name: "", servings: "1", calories: "", protein_g: "", carbs_g: "", fat_g: "", fiber_g: "", logged_on: date };
}

function MealsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [selectedIdx, setSelectedIdx] = useState<number>(() => (new Date().getDay() + 6) % 7);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekStartStr = ymd(weekStart);
  const selectedDate = ymd(days[selectedIdx]);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => loadProfile() });
  const { data: weekData, isLoading } = useQuery({
    queryKey: ["week-meals", weekStartStr],
    queryFn: () => getWeekData({ data: { weekStart: weekStartStr } }),
  });
  const { data: recipes } = useQuery({ queryKey: ["recipes"], queryFn: () => listRecipes() });

  const targets = {
    calories: profile?.calorie_target ?? 2000,
    protein_g: profile?.protein_target_g ?? 100,
    carbs_g: profile?.carbs_target_g ?? 250,
    fat_g: profile?.fat_target_g ?? 70,
    fiber_g: profile?.fiber_target_g ?? 30,
  };

  const mealsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    days.forEach((d) => map.set(ymd(d), []));
    (weekData?.meals ?? []).forEach((m: any) => {
      const arr = map.get(m.logged_on) ?? [];
      arr.push(m);
      map.set(m.logged_on, arr);
    });
    return map;
  }, [weekData, days]);

  function dayTotals(date: string) {
    const arr = mealsByDay.get(date) ?? [];
    return arr.reduce(
      (a, r) => ({
        calories: a.calories + (r.calories || 0),
        protein_g: a.protein_g + Number(r.protein_g || 0),
        carbs_g: a.carbs_g + Number(r.carbs_g || 0),
        fat_g: a.fat_g + Number(r.fat_g || 0),
        fiber_g: a.fiber_g + Number(r.fiber_g || 0),
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
    );
  }

  const selectedMeals = mealsByDay.get(selectedDate) ?? [];
  const selectedTotals = dayTotals(selectedDate);

  const weeklyChart = days.map((d, i) => {
    const t = dayTotals(ymd(d));
    return {
      day: DAY_LABELS[i],
      Calories: t.calories,
      Target: targets.calories,
    };
  });

  // Mutations
  const [editing, setEditing] = useState<EditingMeal | null>(null);
  const [picker, setPicker] = useState<{ open: boolean; mealType: MealType } | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (m: EditingMeal) => {
      const payload = {
        meal_type: m.meal_type,
        meal_name: m.meal_name,
        servings: Number(m.servings) || 1,
        calories: Math.round(Number(m.calories) || 0),
        protein_g: Number(m.protein_g) || 0,
        carbs_g: Number(m.carbs_g) || 0,
        fat_g: Number(m.fat_g) || 0,
        fiber_g: Number(m.fiber_g) || 0,
        logged_on: m.logged_on,
      };
      if (m.id) await updateMeal({ data: { id: m.id, ...payload } });
      else await logMeal({ data: payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["week-meals"] });
      qc.invalidateQueries({ queryKey: ["daily"] });
      setEditing(null);
      toast.success("Meal saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteMeal({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["week-meals"] });
      qc.invalidateQueries({ queryKey: ["daily"] });
      toast.success("Meal removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete"),
  });

  const recipeMutation = useMutation({
    mutationFn: ({ recipeId, mealType }: { recipeId: string; mealType: MealType }) =>
      addRecipeToMeals({ data: { recipeId, mealType, logged_on: selectedDate } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["week-meals"] });
      qc.invalidateQueries({ queryKey: ["daily"] });
      setPicker(null);
      toast.success("Recipe added to your meals");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add recipe"),
  });

  // Recommendations
  const remaining = {
    calories: Math.max(0, targets.calories - selectedTotals.calories),
    protein_g: Math.max(0, targets.protein_g - selectedTotals.protein_g),
    carbs_g: Math.max(0, targets.carbs_g - selectedTotals.carbs_g),
    fat_g: Math.max(0, targets.fat_g - selectedTotals.fat_g),
    fiber_g: Math.max(0, targets.fiber_g - selectedTotals.fiber_g),
  };
  const recommendations = useMemo(() => {
    const out: string[] = [];
    if (remaining.protein_g > 25) out.push(`Add ~${Math.round(remaining.protein_g)}g protein — try paneer bhurji, sprouts chaat, dal tadka or a glass of milk.`);
    if (remaining.fiber_g > 10) out.push(`Boost fibre by ~${Math.round(remaining.fiber_g)}g with seasonal salad, fruit, or a chapati of multigrain atta.`);
    if (remaining.calories > 400 && remaining.protein_g < 10) out.push(`You still have ${Math.round(remaining.calories)} kcal — pick a balanced khichdi or vegetable pulao with curd.`);
    if (selectedTotals.calories > targets.calories + 150) out.push("You are slightly over today — keep dinner light: clear soup, salad, or chaas.");
    if ((profile?.deficiencies ?? []).includes("Iron")) out.push("Iron focus: include palak, beetroot, sprouts or jaggery + nuts today.");
    if ((profile?.health_conditions ?? []).includes("Diabetes")) out.push("Diabetes-friendly: keep refined carbs low — choose millet roti, sabzi and dal.");
    if (out.length === 0) out.push("Beautifully balanced day so far — keep portions mindful.");
    return out.slice(0, 4);
  }, [remaining, selectedTotals, targets, profile]);

  return (
    <AppShell userEmail={user.email ?? ""}>
      <div className="mx-auto max-w-6xl space-y-6 p-5 pb-28 md:p-9">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.25em] text-accent">Weekly tracker</p>
            <h1 className="mt-2 font-serif text-4xl">Meal tracker</h1>
            <p className="mt-1 text-sm text-muted-foreground">Plan, log and review the whole week — calories and macros stay in sync.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { setWeekStart(addDays(weekStart, -7)); }}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2 text-sm font-medium">{fmtRange(weekStart)}</span>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { setWeekStart(addDays(weekStart, 7)); }}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" size="sm" className="ml-1 rounded-full" onClick={() => { const w = startOfWeek(new Date()); setWeekStart(w); setSelectedIdx((new Date().getDay() + 6) % 7); }}>Today</Button>
          </div>
        </header>

        {/* Weekly summary */}
        <section className="premium-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl">Weekly summary</h2>
            <p className="text-xs text-muted-foreground">Target: {targets.calories} kcal/day</p>
          </div>
          <div className="mt-4 grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChart}>
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
                  <Bar dataKey="Calories" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-7 gap-1.5 md:grid-cols-1">
              {days.map((d, i) => {
                const t = dayTotals(ymd(d));
                const pct = Math.min(100, Math.round((t.calories / Math.max(1, targets.calories)) * 100));
                const met = pct >= 80 && pct <= 110;
                const active = i === selectedIdx;
                return (
                  <button key={i} onClick={() => setSelectedIdx(i)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{DAY_LABELS[i]}</p>
                      <p className="text-sm font-medium">{t.calories} <span className="text-xs text-muted-foreground">kcal</span></p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${met ? "bg-primary/10 text-primary" : pct > 110 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{pct}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Day picker (mobile tabs) */}
        <section className="flex flex-wrap gap-2">
          {days.map((d, i) => (
            <button key={i} onClick={() => setSelectedIdx(i)}
              className={`flex flex-col items-center rounded-2xl border px-4 py-2 text-sm transition ${i === selectedIdx ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{DAY_LABELS[i]}</span>
              <span className="font-serif text-lg leading-tight">{d.getDate()}</span>
            </button>
          ))}
        </section>

        {/* Day macro cards */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { l: "Calories", v: selectedTotals.calories, t: targets.calories, u: "" },
            { l: "Protein", v: Math.round(selectedTotals.protein_g), t: targets.protein_g, u: "g" },
            { l: "Carbs", v: Math.round(selectedTotals.carbs_g), t: targets.carbs_g, u: "g" },
            { l: "Fat", v: Math.round(selectedTotals.fat_g), t: targets.fat_g, u: "g" },
            { l: "Fiber", v: Math.round(selectedTotals.fiber_g), t: targets.fiber_g, u: "g" },
          ].map((x) => {
            const pct = Math.min(100, (x.v / Math.max(1, x.t)) * 100);
            return (
              <div key={x.l} className="premium-card rounded-2xl p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{x.l}</p>
                <p className="mt-2 text-xl font-bold">{x.v}{x.u} <span className="text-xs font-medium text-muted-foreground">/ {x.t}{x.u}</span></p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                {x.l === "Calories" && (
                  <p className="mt-1 text-[11px] text-muted-foreground">{Math.max(0, x.t - x.v)} kcal remaining</p>
                )}
              </div>
            );
          })}
        </section>

        {/* Meal sections */}
        <section className="grid gap-4 md:grid-cols-2">
          {MEAL_TYPES.map((type) => {
            const items = selectedMeals.filter((m: any) => m.meal_type === type);
            return (
              <div key={type} className="premium-card rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg capitalize">{type}</h3>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => setPicker({ open: true, mealType: type })}>
                      <ChefHat className="mr-1 size-3.5" /> Recipe
                    </Button>
                    <Button size="sm" variant="saffron" className="rounded-full" onClick={() => setEditing(emptyMeal(selectedDate, type))}>
                      <Plus className="mr-1 size-3.5" /> Custom
                    </Button>
                  </div>
                </div>
                {items.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">Nothing logged yet.</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {items.map((m: any) => (
                      <li key={m.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium">{m.meal_name}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {m.calories} kcal · {Math.round(Number(m.protein_g))}P / {Math.round(Number(m.carbs_g))}C / {Math.round(Number(m.fat_g))}F
                            {m.servings && Number(m.servings) !== 1 ? ` · ${m.servings}x` : ""}
                          </p>
                        </div>
                        <button className="rounded-md p-1 text-muted-foreground hover:text-primary" onClick={() => setEditing({
                          id: m.id, meal_type: m.meal_type, meal_name: m.meal_name,
                          servings: String(m.servings ?? 1),
                          calories: String(m.calories ?? 0),
                          protein_g: String(m.protein_g ?? 0),
                          carbs_g: String(m.carbs_g ?? 0),
                          fat_g: String(m.fat_g ?? 0),
                          fiber_g: String(m.fiber_g ?? 0),
                          logged_on: m.logged_on,
                        })}><Pencil className="size-4" /></button>
                        <button className="rounded-md p-1 text-muted-foreground hover:text-destructive" onClick={() => delMutation.mutate(m.id)}><Trash2 className="size-4" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>

        {/* Recommendations */}
        <section className="premium-card rounded-3xl p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            <h2 className="font-serif text-xl">Smart suggestions for {days[selectedIdx].toLocaleDateString(undefined, { weekday: "long" })}</h2>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {recommendations.map((r, i) => (
              <li key={i} className="rounded-xl border border-border/60 bg-card/60 p-3 text-sm">{r}</li>
            ))}
          </ul>
        </section>

        {isLoading && <p className="text-center text-sm text-muted-foreground">Loading week…</p>}
      </div>

      {/* Edit / Custom dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit meal" : "Log a meal"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 md:grid-cols-2">
              <select className="h-10 rounded-md border border-input bg-card px-3 md:col-span-2" value={editing.meal_type} onChange={(e) => setEditing({ ...editing, meal_type: e.target.value as MealType })}>
                {MEAL_TYPES.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
              </select>
              <Input className="md:col-span-2" value={editing.meal_name} onChange={(e) => setEditing({ ...editing, meal_name: e.target.value })} placeholder="What did you eat?" />
              <Input type="number" value={editing.calories} onChange={(e) => setEditing({ ...editing, calories: e.target.value })} placeholder="Calories (kcal)" />
              <Input type="number" step="0.5" value={editing.servings} onChange={(e) => setEditing({ ...editing, servings: e.target.value })} placeholder="Servings" />
              <Input type="number" value={editing.protein_g} onChange={(e) => setEditing({ ...editing, protein_g: e.target.value })} placeholder="Protein (g)" />
              <Input type="number" value={editing.carbs_g} onChange={(e) => setEditing({ ...editing, carbs_g: e.target.value })} placeholder="Carbs (g)" />
              <Input type="number" value={editing.fat_g} onChange={(e) => setEditing({ ...editing, fat_g: e.target.value })} placeholder="Fat (g)" />
              <Input type="number" value={editing.fiber_g} onChange={(e) => setEditing({ ...editing, fiber_g: e.target.value })} placeholder="Fiber (g)" />
              <Input type="date" className="md:col-span-2" value={editing.logged_on} onChange={(e) => setEditing({ ...editing, logged_on: e.target.value })} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="saffron" disabled={!editing?.meal_name || !editing?.calories || saveMutation.isPending} onClick={() => editing && saveMutation.mutate(editing)}>
              {saveMutation.isPending ? "Saving…" : "Save meal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipe picker */}
      <Dialog open={!!picker?.open} onOpenChange={(o) => { if (!o) setPicker(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add a NutriAI recipe to {picker?.mealType}</DialogTitle>
          </DialogHeader>
          {(recipes?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No saved recipes yet. Generate one from the Recipes page first.</p>
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto">
              {(recipes ?? []).map((r: any) => (
                <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
                  {r.image_url ? <img src={r.image_url} alt="" className="size-12 rounded-lg object-cover" /> : <div className="size-12 rounded-lg bg-muted" />}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{r.dish_name}</p>
                    <p className="text-[11px] text-muted-foreground">{r.calories} kcal · {Math.round(Number(r.protein_g))}P / {Math.round(Number(r.carbs_g))}C / {Math.round(Number(r.fat_g))}F · {r.cuisine_type}</p>
                  </div>
                  <Button size="sm" variant="saffron" disabled={recipeMutation.isPending} onClick={() => picker && recipeMutation.mutate({ recipeId: r.id, mealType: picker.mealType })}>
                    <Plus className="mr-1 size-3.5" /> Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPicker(null)}><X className="mr-1 size-3.5" /> Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
