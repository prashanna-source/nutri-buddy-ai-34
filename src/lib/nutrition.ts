// Pure nutrition utilities — safe for client and server.

export const ACTIVITY_MULTIPLIER: Record<string, number> = {
  "Sedentary": 1.2,
  "Lightly Active": 1.375,
  "Moderately Active": 1.55,
  "Very Active": 1.725,
};

export function cmToFeetInches(cm: number | null | undefined) {
  if (!cm || cm <= 0) return { feet: 0, inches: 0 };
  const totalInches = Math.round(cm / 2.54);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function feetInchesToCm(feet: number, inches: number) {
  return Math.round((feet * 12 + inches) * 2.54);
}

export function calculateBMR(opts: { gender: string; weightKg: number; heightCm: number; age: number }) {
  const base = 10 * opts.weightKg + 6.25 * opts.heightCm - 5 * opts.age;
  return Math.round(base + (opts.gender?.toLowerCase() === "male" ? 5 : -161));
}

export function calculateTargets(profile: {
  gender?: string | null;
  age?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  activity_level?: string | null;
  health_goals?: string[] | null;
}) {
  const age = Number(profile.age) || 30;
  const weightKg = Number(profile.weight_kg) || 65;
  const heightCm = Number(profile.height_cm) || 170;
  const bmr = calculateBMR({ gender: profile.gender ?? "female", weightKg, heightCm, age });
  const multiplier = ACTIVITY_MULTIPLIER[profile.activity_level ?? "Moderately Active"] ?? 1.55;
  const tdee = Math.round(bmr * multiplier);
  const goals = profile.health_goals ?? [];
  let adjustment = 0;
  if (goals.some((g) => /loss/i.test(g))) adjustment = -0.2;
  else if (goals.some((g) => /gain/i.test(g))) adjustment = 0.15;
  const calories = Math.round(tdee * (1 + adjustment));
  const proteinPerKg = goals.some((g) => /muscle|protein/i.test(g)) ? 2 : 1.6;
  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round((calories * 0.27) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  const fiber = Math.round((calories / 1000) * 14);
  return { bmr, tdee, calorie_target: calories, protein_target_g: protein, carbs_target_g: carbs, fat_target_g: fat, fiber_target_g: fiber };
}

export function hasBodyMetrics(profile: { age?: number | null; height_cm?: number | null; weight_kg?: number | null } | null | undefined) {
  return Boolean(profile && Number(profile.age) > 0 && Number(profile.height_cm) > 0 && Number(profile.weight_kg) > 0);
}

export function calculateBMI(heightCm?: number | null, weightKg?: number | null) {
  const h = Number(heightCm), w = Number(weightKg);
  if (!h || !w) return null;
  const bmi = w / Math.pow(h / 100, 2);
  const band = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : bmi < 30 ? "Overweight" : "Obese";
  return { value: Math.round(bmi * 10) / 10, band };
}

// ~35 ml per kg body weight, nudged up with activity.
export function waterTargetMl(weightKg?: number | null, activityLevel?: string | null) {
  const w = Number(weightKg) || 65;
  const bump = (ACTIVITY_MULTIPLIER[activityLevel ?? "Moderately Active"] ?? 1.55) - 1.2;
  return Math.round((w * 35 + bump * 500) / 50) * 50;
}
