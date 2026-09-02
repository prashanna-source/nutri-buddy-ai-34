import nutriaiMark from "@/assets/nutriai-mark.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { feetInchesToCm } from "@/lib/nutrition";
import { saveProfile } from "@/lib/profile.functions";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({ component: Onboarding });

const goals = ["Weight Loss", "Fat Loss", "Muscle Gain", "Weight Gain", "Maintenance", "Healthy Eating", "Diabetes Management", "Heart Health", "Gut Health", "High Protein", "Low Carb", "Improve Energy", "Improve Immunity"];
const cuisines = ["Nepali (Hill)", "Newari", "Terai / Madhesi", "Thakali", "Himalayan / Tibetan", "North Indian", "South Indian", "Bengali", "Gujarati", "Maharashtrian", "Punjabi", "Rajasthani", "Indo-Chinese"];
const stapleFoods = ["Dal bhat", "Roti / Chapati", "Dhindo", "Brown rice", "Red rice", "Millet (kodo)", "Buckwheat (phapar)", "Poha", "Idli / Dosa", "Upma", "Paratha", "Khichdi", "Sel roti", "Chiura (beaten rice)"];
const proteinFoods = ["Moong dal", "Masoor dal", "Kalo dal (urad)", "Rajma", "Chana / Chickpeas", "Kwati (mixed beans)", "Paneer", "Tofu / Soya chunks", "Eggs", "Curd / Dahi", "Buffalo meat", "Chicken", "Mutton", "Fish (rohu/trout)", "Peanuts", "Sattu"];
const vegFoods = ["Saag (mustard greens)", "Palak", "Gundruk", "Bhindi", "Karela", "Lauki", "Pumpkin (farsi)", "Cauliflower", "Bamboo shoot (tama)", "Radish (mula)", "Beans", "Sweet potato", "Tarul (yam)", "Mushroom"];
const flavourFoods = ["Achar (tomato/mula)", "Golbheda ko achar", "Coconut chutney", "Sambar", "Kadhi", "Jhol (thin curry)", "Sukuti", "Momo", "Chowmein", "Curd rice", "Roasted soybean", "Fruits & seasonal chaat"];
const allergiesList = ["Dairy", "Peanuts", "Tree Nuts", "Soy", "Wheat / Gluten", "Seafood", "Eggs", "Mustard", "Sesame"];
const conditions = ["Diabetes", "High Blood Pressure", "Thyroid", "Cholesterol", "PCOS", "Gastric Issues", "IBS", "Fatty Liver", "Uric Acid / Gout", "Kidney Concerns"];
const deficiencies = ["Iron Deficiency", "Vitamin D Deficiency", "Vitamin B12 Deficiency", "Calcium Deficiency", "Protein Deficiency", "Zinc Deficiency", "Folate Deficiency"];


function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "", age: "", gender: "", feet: "", inches: "", weight_kg: "",
    country: "Nepal", city: "",
    health_goals: [] as string[], activity_level: "Moderately Active", dietary_type: "Vegetarian",
    cuisine_preferences: [] as string[], food_preferences: [] as string[],
    allergies: [] as string[], health_conditions: [] as string[], deficiencies: [] as string[],
  });
  const toggle = (key: "health_goals" | "cuisine_preferences" | "food_preferences" | "allergies" | "health_conditions" | "deficiencies", value: string) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value] }));
  const choice = (key: Parameters<typeof toggle>[0], items: string[]) => (
    <div className="flex flex-wrap gap-2">{items.map((item) => (
      <button type="button" key={item} onClick={() => toggle(key, item)} className={`rounded-full border px-4 py-2.5 text-sm transition ${form[key].includes(item) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"}`}>
        {form[key].includes(item) && <Check className="mr-1 inline size-3" />}{item}
      </button>
    ))}</div>
  );

  async function finish() {
    if (!form.full_name) { toast.error("Please enter your name"); setStep(0); return; }
    setBusy(true);
    try {
      const height_cm = form.feet || form.inches ? feetInchesToCm(Number(form.feet) || 0, Number(form.inches) || 0) : null;
      await saveProfile({ data: {
        full_name: form.full_name, age: Number(form.age) || null, gender: form.gender || null,
        height_cm, weight_kg: Number(form.weight_kg) || null,
        country: form.country, city: form.city,
        health_goals: form.health_goals, activity_level: form.activity_level, dietary_type: form.dietary_type,
        cuisine_preferences: form.cuisine_preferences, food_preferences: form.food_preferences,
        allergies: form.allergies, health_conditions: form.health_conditions, deficiencies: form.deficiencies,
        onboarding_completed: true,
      }});
      toast.success("Your plan is ready");
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile");
    } finally { setBusy(false); }
  }

  return <main className="min-h-screen p-5 md:p-10"><div className="mx-auto max-w-5xl">
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3"><img src={nutriaiMark} alt="NutriAI" className="size-11 rounded-xl" /><span className="font-serif text-2xl text-primary">NutriAI</span></div>
      <span className="text-sm text-muted-foreground">Step {step + 1} of 4</span>
    </header>
    <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-all" style={{ width: `${(step + 1) * 25}%` }} /></div>
    <section className="premium-card mt-8 rounded-[2rem] p-6 md:p-10">
      <p className="text-xs font-bold uppercase tracking-[.25em] text-accent">Build your nutrition blueprint</p>
      <h1 className="mt-3 font-serif text-4xl">{["Tell us about you", "What are you working toward?", "Your kitchen, your preferences", "Health guardrails"][step]}</h1>
      <p className="mt-3 mb-8 text-muted-foreground">We use this only to personalize recipes, targets, and daily guidance.</p>

      {step === 0 && <div className="grid gap-4 md:grid-cols-2">
        <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" className="h-12" />
        <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Age" className="h-12" />
        <div className="flex gap-2">
          <Input type="number" min={0} max={8} value={form.feet} onChange={(e) => setForm({ ...form, feet: e.target.value })} placeholder="Feet" className="h-12" />
          <Input type="number" min={0} max={11} value={form.inches} onChange={(e) => setForm({ ...form, inches: e.target.value })} placeholder="Inches" className="h-12" />
        </div>
        <Input type="number" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} placeholder="Weight (kg)" className="h-12" />
        <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="h-12" />
        <select className="h-12 rounded-md border border-input bg-card px-3" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}><option>Nepal</option><option>India</option></select>
        <select className="h-12 rounded-md border border-input bg-card px-3" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
          <option value="">Gender</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option>
        </select>
      </div>}

      {step === 1 && <div className="space-y-7">
        <div><h2 className="mb-3 font-semibold">Health goals</h2>{choice("health_goals", goals)}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Activity level<select className="mt-2 h-12 w-full rounded-md border border-input bg-card px-3" value={form.activity_level} onChange={(e) => setForm({ ...form, activity_level: e.target.value })}>{["Sedentary", "Lightly Active", "Moderately Active", "Very Active"].map(x => <option key={x}>{x}</option>)}</select></label>
          <label className="text-sm font-medium">Dietary type<select className="mt-2 h-12 w-full rounded-md border border-input bg-card px-3" value={form.dietary_type} onChange={(e) => setForm({ ...form, dietary_type: e.target.value })}>{["Vegetarian", "Vegan", "Eggetarian", "Non-Vegetarian", "Jain", "Pescatarian"].map(x => <option key={x}>{x}</option>)}</select></label>
        </div>
      </div>}

      {step === 2 && <div className="space-y-7">
        <div><h2 className="mb-3 font-semibold">Cuisine preferences</h2>{choice("cuisine_preferences", cuisines)}</div>
        <div><h2 className="mb-3 font-semibold">Food preferences</h2>{choice("food_preferences", ["Spicy", "Mild", "Sweet", "Savory"])}</div>
      </div>}

      {step === 3 && <div className="space-y-7">
        <div><h2 className="mb-3 font-semibold">Allergies</h2>{choice("allergies", allergiesList)}</div>
        <div><h2 className="mb-3 font-semibold">Health conditions</h2>{choice("health_conditions", conditions)}</div>
        <div><h2 className="mb-3 font-semibold">Nutritional deficiencies</h2>{choice("deficiencies", deficiencies)}</div>
      </div>}

      <footer className="mt-10 flex justify-between">
        <Button variant="ghost" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}><ArrowLeft />Back</Button>
        <Button variant={step === 3 ? "saffron" : "premium"} disabled={busy} onClick={() => step === 3 ? finish() : setStep(step + 1)}>{busy ? "Saving…" : step === 3 ? "Create my plan" : "Continue"}<ArrowRight /></Button>
      </footer>
    </section>
  </div></main>;
}
