import nutriaiMark from "@/assets/nutriai-mark.png";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, BookOpen, ChefHat, CircleUserRound, Home, UtensilsCrossed } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/dashboard", label: "Today", icon: Home },
  { to: "/recipes", label: "Recipes", icon: ChefHat },
  { to: "/meals", label: "Meal tracker", icon: UtensilsCrossed },
  { to: "/profile", label: "Profile", icon: CircleUserRound },
] as const;

export function AppShell({ userEmail, children }: { userEmail: string; children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const path = useRouterState({ select: (s) => s.location.pathname });
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-primary/10 bg-primary px-5 py-7 text-primary-foreground lg:flex lg:flex-col">
        <Link to="/dashboard" className="flex items-center gap-3 px-2"><img src={nutriaiMark} alt="NutriAI" className="size-11 rounded-xl bg-card" /><span className="font-serif text-2xl">NutriAI</span></Link>
        <nav className="mt-12 space-y-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${path === to ? "bg-primary-foreground/12 text-primary-foreground" : "text-primary-foreground/65 hover:bg-primary-foreground/8 hover:text-primary-foreground"}`}>
              <Icon className="size-4" />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-primary-foreground/8 p-4">
          <p className="truncate text-xs text-primary-foreground/65">{userEmail}</p>
          <Button variant="outline" size="sm" className="mt-3 w-full rounded-lg bg-transparent text-primary-foreground hover:bg-primary-foreground/10" onClick={signOut}>Sign out</Button>
        </div>
      </aside>
      <main className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-primary/8 bg-background/85 px-5 backdrop-blur-xl lg:hidden">
          <Link to="/dashboard" className="flex items-center gap-2"><img src={nutriaiMark} alt="NutriAI" className="size-8 rounded-lg" /><span className="font-serif text-lg text-primary">NutriAI</span></Link>
          <Button variant="outline" size="icon" className="rounded-full" onClick={signOut}><CircleUserRound /></Button>
        </header>
        {children}
        <nav className="fixed inset-x-4 bottom-4 z-40 flex justify-around rounded-2xl bg-primary p-2 text-primary-foreground shadow-2xl lg:hidden">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`flex flex-col items-center rounded-xl p-2 text-[10px] ${path === to ? "bg-primary-foreground/15" : "opacity-80"}`}>
              <Icon className="size-5" />{label.split(" ")[0]}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}

export { BarChart3, BookOpen };
