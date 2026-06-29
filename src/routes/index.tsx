import nutriaiMark from "@/assets/nutriai-mark.png";
import { Button } from "@/components/ui/button";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ChefHat, LineChart, MessageCircle, Salad, Sparkles, Target, Utensils } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutriAI — Your Personal AI Nutrition Coach" },
      { name: "description", content: "AI-powered personalized nutrition. Generate healthy Indian and Nepali recipes, track meals, and reach your health goals." },
      { property: "og:title", content: "NutriAI — Your Personal AI Nutrition Coach" },
      { property: "og:description", content: "Personalized nutrition, AI recipes, calorie & macro tracking, and progress analytics." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: ChefHat, title: "AI Recipe Generation", desc: "Authentic Indian & Nepali dishes tuned to your goals, allergies, and daily targets." },
  { icon: Target, title: "Personalized Nutrition", desc: "Calorie and macro targets calculated from your body, activity, and health goals." },
  { icon: Utensils, title: "Meal Planning & Logging", desc: "One-click logging for breakfast, lunch, dinner, and snacks across your day." },
  { icon: LineChart, title: "Progress Analytics", desc: "Beautiful charts surface trends in energy, protein, hydration, and weight." },
  { icon: MessageCircle, title: "AI Nutrition Assistant", desc: "Chat with a profile-aware coach for live food swaps and practical guidance." },
  { icon: Salad, title: "Smart Recommendations", desc: "Daily food suggestions based on what nutrients you still need today." },
];

const steps = [
  { n: "01", title: "Create your health profile", desc: "Share your goals, lifestyle, allergies, and medical context in one short flow." },
  { n: "02", title: "Generate personalized recipes", desc: "Get real, household-friendly dishes tuned to your body and your kitchen." },
  { n: "03", title: "Track meals & achieve goals", desc: "Log what you eat, watch your macros and weight trend toward your target." },
];

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={nutriaiMark} alt="NutriAI" className="size-9 rounded-xl" />
            <span className="font-serif text-2xl text-primary">NutriAI</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-primary">Features</a>
            <a href="#how" className="hover:text-primary">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Login</Link></Button>
            <Button asChild variant="premium" size="sm"><Link to="/auth">Get started</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-secondary/40 via-background to-background" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-accent" />
              AI-powered nutrition, rooted in your kitchen
            </div>
            <h1 className="mt-6 font-serif text-5xl leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
              Your personal <em className="text-primary">AI nutrition coach</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              NutriAI generates personalized healthy recipes, tracks your nutrition, monitors your meals,
              and helps you reach your health goals — built around the foods cooked in Indian and Nepali homes.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild variant="premium" size="lg" className="rounded-xl">
                <Link to="/auth">Get started <ArrowRight className="size-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl">
                <Link to="/auth">Login</Link>
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">Free to start · No credit card required</p>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-accent/20 via-primary/10 to-transparent blur-2xl" />
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/10">
              <img src="/og-hero.jpg" onError={(e) => { (e.currentTarget as HTMLImageElement).src = new URL("../assets/paneer-moong-salad.jpg", import.meta.url).href; }} alt="A vibrant healthy bowl" className="aspect-[4/5] w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-accent">What you get</p>
          <h2 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">Everything you need to eat with clarity.</h2>
          <p className="mt-4 text-muted-foreground">Six tools, one calm dashboard. Designed for daily use, not a one-time experiment.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 font-serif text-xl text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-secondary/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-accent">How it works</p>
            <h2 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">Three steps to a calmer plate.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-border bg-card p-7">
                <span className="font-serif text-5xl text-accent/60">{s.n}</span>
                <h3 className="mt-3 font-serif text-2xl text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground sm:px-16">
          <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,.4), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.3), transparent 40%)" }} />
          <p className="text-xs font-bold uppercase tracking-[.3em] text-accent">Start free today</p>
          <h2 className="mx-auto mt-4 max-w-2xl font-serif text-4xl leading-tight sm:text-5xl">Create your free account and meet your AI nutrition coach.</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="saffron" size="lg" className="rounded-xl">
              <Link to="/auth">Create free account <ArrowRight className="size-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <img src={nutriaiMark} alt="" className="size-6 rounded-md" />
            <span>© {new Date().getFullYear()} NutriAI. Eat with clarity.</span>
          </div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-primary">Features</a>
            <a href="#how" className="hover:text-primary">How it works</a>
            <Link to="/auth" className="hover:text-primary">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
