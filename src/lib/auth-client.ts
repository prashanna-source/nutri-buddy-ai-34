import { supabase } from "@/integrations/supabase/client";

export async function ensureUserProfile(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) return;

  const metadataName = typeof user.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name
    : typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : "";
  const fallbackName = user.email?.split("@")[0] ?? "Food Veda member";
  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    full_name: metadataName || fallbackName,
    onboarding_completed: true,
  });
  if (error && error.code !== "23505") throw error;
}