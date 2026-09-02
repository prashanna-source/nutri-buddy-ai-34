import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cmToFeetInches, feetInchesToCm } from "@/lib/nutrition";
import { loadProfile, saveProfile } from "@/lib/profile.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({ component: ProfilePage });

const goalsList = ["Weight Loss", "Fat Loss", "Muscle Gain", "Weight Gain", "Maintenance", "High Protein", "Heart Health", "Diabetes Management", "Gut Health", "Improve Energy"];
const cuisines = ["Nepali (Hill)", "Newari", "Terai / Madhesi", "Thakali", "Himalayan / Tibetan", "North Indian", "South Indian", "Bengali", "Gujarati", "Maharashtrian", "Punjabi", "Rajasthani", "Indo-Chinese"];
const foodGroups: { title: string; items: string[] }[] = [
  { title: "Staples", items: ["Dal bhat", "Roti / Chapati", "Dhindo", "Brown rice", "Red rice", "Millet (kodo)", "Buckwheat (phapar)", "Poha", "Idli / Dosa", "Upma", "Paratha", "Khichdi", "Sel roti", "Chiura (beaten rice)"] },
  { title: "Protein sources", items: ["Moong dal", "Masoor dal", "Kalo dal (urad)", "Rajma", "Chana / Chickpeas", "Kwati (mixed beans)", "Paneer", "Tofu / Soya chunks", "Eggs", "Curd / Dahi", "Buffalo meat", "Chicken", "Mutton", "Fish (rohu/trout)", "Peanuts", "Sattu"] },
  { title: "Vegetables & greens", items: ["Saag (mustard greens)", "Palak", "Gundruk", "Bhindi", "Karela", "Lauki", "Pumpkin (farsi)", "Cauliflower", "Bamboo shoot (tama)", "Radish (mula)", "Beans", "Sweet potato", "Tarul (yam)", "Mushroom"] },
  { title: "Sides & flavours", items: ["Achar (tomato/mula)", "Golbheda ko achar", "Coconut chutney", "Sambar", "Kadhi", "Jhol (thin curry)", "Sukuti", "Momo", "Chowmein", "Curd rice", "Roasted soybean", "Fruits & seasonal chaat"] },
  { title: "Taste profile", items: ["Spicy", "Mild", "Sweet", "Savory", "Tangy", "Low oil"] },
];
const allergiesList = ["Dairy", "Peanuts", "Tree Nuts", "Soy", "Wheat / Gluten", "Seafood", "Eggs", "Mustard", "Sesame"];
const conditions = ["Diabetes", "High Blood Pressure", "Thyroid", "Cholesterol", "PCOS", "Gastric Issues", "IBS", "Fatty Liver", "Uric Acid / Gout", "Kidney Concerns"];
const deficiencies = ["Iron Deficiency", "Vitamin D Deficiency", "Vitamin B12 Deficiency", "Calcium Deficiency", "Protein Deficiency", "Zinc Deficiency", "Folate Deficiency"];


function chip(active: boolean, label: string, onClick: () => void) {
  return <button type="button" key={label} onClick={onClick} className={`rounded-full border px-3 py-1.5 text-xs ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{label}</button>;
}

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => loadProfile() });
  const [form, setForm] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const { feet, inches } = cmToFeetInches(Number(profile.height_cm));
    setForm({ ...profile, feet, inches });
  }, [profile]);

  function toggle(key: string, val: string) {
    setForm((f: any) => ({ ...f, [key]: (f[key] ?? []).includes(val) ? f[key].filter((x: string) => x !== val) : [...(f[key] ?? []), val] }));
  }

  async function save() {
    setBusy(true);
    try {
      const height_cm = form.feet || form.inches ? feetInchesToCm(Number(form.feet) || 0, Number(form.inches) || 0) : null;
      await saveProfile({ data: {
        full_name: form.full_name ?? "", age: Number(form.age) || null, gender: form.gender ?? null,
        height_cm, weight_kg: Number(form.weight_kg) || null, country: form.country ?? null, city: form.city ?? null,
        health_goals: form.health_goals ?? [], activity_level: form.activity_level ?? "Moderately Active",
        dietary_type: form.dietary_type ?? "Vegetarian", cuisine_preferences: form.cuisine_preferences ?? [],
        food_preferences: form.food_preferences ?? [], allergies: form.allergies ?? [],
        health_conditions: form.health_conditions ?? [], deficiencies: form.deficiencies ?? [],
        onboarding_completed: true,
      }});
      toast.success("Profile updated. Targets recalculated.");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    finally { setBusy(false); }
  }

  return <AppShell userEmail={user.email ?? ""}>
    <div className="mx-auto max-w-3xl space-y-6 p-5 pb-28 md:p-9">
      <header><p className="text-xs font-bold uppercase tracking-[.25em] text-accent">Your nutrition profile</p><h1 className="mt-2 font-serif text-4xl">Profile & preferences</h1></header>
      {isLoading || !form ? <p className="text-muted-foreground">Loading…</p> : <>
        <section className="premium-card space-y-4 rounded-2xl p-6">
          <h2 className="font-serif text-xl">Basics</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" />
            <Input type="number" value={form.age ?? ""} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Age" />
            <div className="flex gap-2">
              <Input type="number" value={form.feet ?? ""} onChange={(e) => setForm({ ...form, feet: e.target.value })} placeholder="Feet" />
              <Input type="number" value={form.inches ?? ""} onChange={(e) => setForm({ ...form, inches: e.target.value })} placeholder="Inches" />
            </div>
            <Input type="number" value={form.weight_kg ?? ""} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} placeholder="Weight (kg)" />
            <select className="h-10 rounded-md border border-input bg-card px-3" value={form.gender ?? ""} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="">Gender</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select>
            <Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
            <select className="h-10 rounded-md border border-input bg-card px-3" value={form.activity_level ?? "Moderately Active"} onChange={(e) => setForm({ ...form, activity_level: e.target.value })}>{["Sedentary", "Lightly Active", "Moderately Active", "Very Active"].map(x => <option key={x}>{x}</option>)}</select>
            <select className="h-10 rounded-md border border-input bg-card px-3" value={form.dietary_type ?? "Vegetarian"} onChange={(e) => setForm({ ...form, dietary_type: e.target.value })}>{["Vegetarian", "Vegan", "Eggetarian", "Non-Vegetarian", "Jain", "Pescatarian"].map(x => <option key={x}>{x}</option>)}</select>
          </div>
        </section>
        <section className="premium-card space-y-3 rounded-2xl p-6"><h2 className="font-serif text-xl">Health goals</h2><div className="flex flex-wrap gap-2">{goalsList.map(g => chip((form.health_goals ?? []).includes(g), g, () => toggle("health_goals", g)))}</div></section>
        <section className="premium-card space-y-3 rounded-2xl p-6"><h2 className="font-serif text-xl">Cuisines</h2><div className="flex flex-wrap gap-2">{cuisines.map(g => chip((form.cuisine_preferences ?? []).includes(g), g, () => toggle("cuisine_preferences", g)))}</div></section>
        <section className="premium-card space-y-3 rounded-2xl p-6"><h2 className="font-serif text-xl">Allergies</h2><div className="flex flex-wrap gap-2">{allergiesList.map(g => chip((form.allergies ?? []).includes(g), g, () => toggle("allergies", g)))}</div></section>
        <section className="premium-card space-y-3 rounded-2xl p-6"><h2 className="font-serif text-xl">Health conditions</h2><div className="flex flex-wrap gap-2">{conditions.map(g => chip((form.health_conditions ?? []).includes(g), g, () => toggle("health_conditions", g)))}</div></section>
        <section className="premium-card space-y-3 rounded-2xl p-6"><h2 className="font-serif text-xl">Deficiencies</h2><div className="flex flex-wrap gap-2">{deficiencies.map(g => chip((form.deficiencies ?? []).includes(g), g, () => toggle("deficiencies", g)))}</div></section>
        <section className="premium-card rounded-2xl p-6">
          <h2 className="font-serif text-xl">Your daily targets</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4 text-sm">
            <div><p className="text-muted-foreground">Calories</p><p className="text-xl font-bold">{profile?.calorie_target ?? "—"}</p></div>
            <div><p className="text-muted-foreground">Protein</p><p className="text-xl font-bold">{profile?.protein_target_g ?? "—"}g</p></div>
            <div><p className="text-muted-foreground">Carbs</p><p className="text-xl font-bold">{profile?.carbs_target_g ?? "—"}g</p></div>
            <div><p className="text-muted-foreground">Fat</p><p className="text-xl font-bold">{profile?.fat_target_g ?? "—"}g</p></div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Recalculated automatically when you save.</p>
        </section>
        <Button variant="saffron" size="lg" className="w-full rounded-xl" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save profile"}</Button>
      </>}
    </div>
  </AppShell>;
}
