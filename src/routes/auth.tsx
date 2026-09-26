import nutriaiMark from "@/assets/nutriai-mark.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { ensureUserProfile } from "@/lib/auth-client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — Food Veda" }, { name: "description", content: "Sign in to your personalized Food Veda nutrition dashboard." }, { property: "og:title", content: "Sign in — Food Veda" }, { property: "og:description", content: "Sign in to your personalized Food Veda nutrition dashboard." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // If already signed in, get out of here. _authenticated routes will route to onboarding/dashboard.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/dashboard", replace: true }); });
  }, [navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setFormError(null);
    setBusy(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) throw new Error("Enter your email address");
      if (mode !== "forgot" && !password) throw new Error("Enter your password");
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Password reset link sent — check your inbox");
        return;
      }
      if (mode === "signup") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) throw new Error("Enter a valid email address");
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) throw new Error("Password needs 8+ characters with an uppercase letter, a lowercase letter and a number");
        if (password !== confirm) throw new Error("Passwords do not match");
        const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("already") || msg.includes("registered")) {
            setFormError("This email is already registered. Try signing in instead.");
            toast.error("This email is already registered. Try signing in instead.");
            setMode("login");
            return;
          }
          throw error;
        }
        if (!data.user) throw new Error("Your account could not be created. Please try again.");
        if (!data.session) { toast.success("Check your email to confirm your account"); return; }
        await ensureUserProfile(data.user);
        toast.success("Welcome to Food Veda");
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("invalid")) throw new Error("Incorrect email or password");
        throw error;
      }
      if (!data.user) throw new Error("Sign-in did not complete. Please try again.");
      await ensureUserProfile(data.user);
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong — please try again";
      setFormError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function signInGoogle() {
    if (busy) return;
    setBusy(true);
    setFormError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth/callback`, extraParams: { prompt: "select_account" } });
      if (result.error) throw result.error;
      if (!result.redirected) {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) throw error ?? new Error("Google sign-in did not complete");
        await ensureUserProfile(data.user);
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign-in failed. Please try again.";
      setFormError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }


  return <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
    <section className="relative hidden overflow-hidden bg-primary p-14 text-primary-foreground lg:flex lg:flex-col lg:justify-between heritage-pattern">
      <div className="relative z-10 flex items-center gap-3"><img src={nutriaiMark} alt="NutriAI" className="size-12 rounded-2xl" /><span className="font-serif text-3xl">NutriAI</span></div>
      <div className="relative z-10 max-w-xl"><p className="mb-5 text-xs font-bold uppercase tracking-[.3em] text-accent">Personal nourishment, intelligently crafted</p><h1 className="font-serif text-6xl leading-[1.05]">Eat with clarity.<br/><em>Live with energy.</em></h1><p className="mt-7 max-w-lg text-lg text-primary-foreground/72">Personalized nutrition rooted in the foods, markets, and kitchens of Nepal and India.</p></div>
      <p className="relative z-10 text-sm text-primary-foreground/55">Health guidance made practical, local, and beautifully simple.</p>
    </section>
    <section className="flex items-center justify-center px-6 py-14"><div className="w-full max-w-md reveal">
      <div className="mb-10 flex items-center gap-3 lg:hidden"><img src={nutriaiMark} alt="NutriAI" className="size-11 rounded-xl"/><span className="font-serif text-2xl text-primary">NutriAI</span></div>
      <p className="text-xs font-bold uppercase tracking-[.25em] text-accent">Welcome to your table</p>
      <h2 className="mt-3 font-serif text-4xl">{mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}</h2>
      <p className="mt-3 text-muted-foreground">{mode === "forgot" ? "We’ll email you a secure reset link." : "Continue your personalized nutrition journey."}</p>
      {mode !== "forgot" && <Button type="button" variant="outline" size="lg" className="mt-8 w-full rounded-xl" onClick={signInGoogle}>Continue with Google</Button>}
      <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border"/>or use email<span className="h-px flex-1 bg-border"/></div>
      <form onSubmit={submit} className="space-y-4"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 rounded-xl bg-card" />{mode !== "forgot" && <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="h-12 rounded-xl bg-card" />}{mode === "signup" && <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" aria-label="Confirm password" className="h-12 rounded-xl bg-card" />}<Button type="submit" variant="premium" size="lg" className="h-12 w-full rounded-xl" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>{formError && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{formError}</p>}</form>
      <div className="mt-6 flex justify-between text-sm"><button type="button" className="text-primary hover:underline" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "Already have an account?" : "Create an account"}</button><button type="button" className="text-muted-foreground hover:text-primary" onClick={() => setMode(mode === "forgot" ? "login" : "forgot")}>{mode === "forgot" ? "Back to sign in" : "Forgot password?"}</button></div>
    </div></section>
  </main>;
}
