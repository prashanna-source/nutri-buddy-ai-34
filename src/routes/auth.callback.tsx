import nutriaiMark from "@/assets/nutriai-mark.png";
import { ensureUserProfile } from "@/lib/auth-client";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing in — Food Veda" },
      { name: "description", content: "Completing your secure Food Veda sign-in." },
      { property: "og:title", content: "Signing in — Food Veda" },
      { property: "og:description", content: "Completing your secure Food Veda sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const finish = async () => {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("error_description") ?? params.get("error");
      if (oauthError) throw new Error(oauthError);

      // The session can land a moment after this page loads — wait up to 10s for it.
      let user = (await supabase.auth.getSession()).data.session?.user;
      if (!user) {
        user = await new Promise<typeof user>((resolve) => {
          const t = setTimeout(() => { sub.data.subscription.unsubscribe(); resolve(undefined); }, 10000);
          const sub = supabase.auth.onAuthStateChange((_e, session) => {
            if (session?.user) { clearTimeout(t); sub.data.subscription.unsubscribe(); resolve(session.user); }
          });
        });
      }
      if (!user) {
        const verified = await supabase.auth.getUser();
        if (verified.error) throw verified.error;
        user = verified.data.user ?? undefined;
      }
      if (!user) throw new Error("Google sign-in did not complete. Please try again.");
      await ensureUserProfile(user);
      if (active) navigate({ to: "/dashboard", replace: true });
    };
    finish().catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not complete sign-in");
    });
    return () => { active = false; };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center">
        <img src={nutriaiMark} alt="Food Veda" className="mx-auto size-14 rounded-2xl" />
        <h1 className="mt-5 font-serif text-3xl">{error ? "Sign-in needs attention" : "Completing your sign-in…"}</h1>
        {error ? (
          <div className="mt-4">
            <p role="alert" className="text-sm text-destructive">{error}</p>
            <a href="/auth" className="mt-5 inline-block text-sm font-medium text-primary hover:underline">Return to sign in</a>
          </div>
        ) : <p className="mt-2 text-sm text-muted-foreground">You’ll be taken to your dashboard shortly.</p>}
      </div>
    </main>
  );
}