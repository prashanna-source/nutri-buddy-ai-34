import paneerSalad from "@/assets/paneer-moong-salad.jpg";
import nutriaiMark from "@/assets/nutriai-mark.png";
import { AppShell } from "@/components/app-shell";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { loadChat } from "@/lib/chat.functions";
import { getDailyData } from "@/lib/meals.functions";
import { calculateBMI, calculateTargets, hasBodyMetrics, waterTargetMl } from "@/lib/nutrition";

import { loadProfile } from "@/lib/profile.functions";
import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Activity, HeartPulse, MessageCircle, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user } = Route.useRouteContext();
  const [initial, setInitial] = useState<UIMessage[]>([]);
  const [ready, setReady] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { loadChat().then((saved) => setInitial(saved as UIMessage[])).catch(() => setInitial([])).finally(() => setReady(true)); }, []);
  const tokenTransport = useMemo(() => new DefaultChatTransport({ api: "/api/chat", prepareSendMessagesRequest: async ({ messages }) => { const { data } = await supabase.auth.getSession(); const headers: Record<string, string> = {}; if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`; return { body: { messages }, headers }; } }), []);
  if (!ready) return <div className="flex min-h-screen items-center justify-center"><Shimmer>Preparing your nutrition desk…</Shimmer></div>;
  return <DashboardContent initial={initial} transport={tokenTransport} userEmail={user.email ?? ""} inputRef={inputRef} />;
}

function DashboardContent({ initial, transport, userEmail, inputRef }: { initial: UIMessage[]; transport: DefaultChatTransport<UIMessage>; userEmail: string; inputRef: React.RefObject<HTMLTextAreaElement | null> }) {
  const { messages, sendMessage, status, stop } = useChat({ id: "nutrition-assistant", messages: initial, transport, onError: (error) => toast.error(error.message) });
  useEffect(() => { inputRef.current?.focus(); }, [status, inputRef]);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => loadProfile() });
  const { data: daily } = useQuery({ queryKey: ["daily"], queryFn: () => getDailyData(), refetchOnWindowFocus: true });

  const firstName = profile?.full_name?.split(" ")[0] || userEmail.split("@")[0] || "friend";
  const totals = daily?.todayTotals ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  const metricsReady = hasBodyMetrics(profile);
  // Real Mifflin–St Jeor derivation from the saved profile; stored targets are the source of truth.
  const derived = useMemo(() => (profile ? calculateTargets(profile) : null), [profile]);
  const calTarget = profile?.calorie_target ?? derived?.calorie_target ?? 2000;
  const proTarget = profile?.protein_target_g ?? derived?.protein_target_g ?? 100;
  const fiberTarget = profile?.fiber_target_g ?? derived?.fiber_target_g ?? 28;
  const carbTarget = profile?.carbs_target_g ?? derived?.carbs_target_g ?? 250;
  const bmi = calculateBMI(profile?.height_cm, profile?.weight_kg);
  const water = waterTargetMl(profile?.weight_kg, profile?.activity_level);
  const proteinGap = Math.max(0, proTarget - Math.round(Number(totals.protein_g)));
  const calorieGap = Math.max(0, calTarget - totals.calories);


  const chartData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const map = new Map<string, number>();
    (daily?.week ?? []).forEach((r: any) => map.set(r.logged_on, r.calories || 0));
    const out: { day: string; kcal: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      out.push({ day: days[d.getDay()], kcal: map.get(d.toISOString().slice(0, 10)) ?? 0 });
    }
    return out;
  }, [daily]);

  const cards = [
    { t: "Calories", v: String(totals.calories), s: `/ ${calTarget}`, p: Math.min(100, (totals.calories / Math.max(1, calTarget)) * 100), c: "bg-primary" },
    { t: "Protein", v: `${Math.round(Number(totals.protein_g))}g`, s: `/ ${proTarget}g`, p: Math.min(100, (Number(totals.protein_g) / Math.max(1, proTarget)) * 100), c: "bg-accent" },
    { t: "Carbs", v: `${Math.round(Number(totals.carbs_g))}g`, s: `/ ${profile?.carbs_target_g ?? 250}g`, p: Math.min(100, (Number(totals.carbs_g) / Math.max(1, profile?.carbs_target_g ?? 250)) * 100), c: "bg-chart-2" },
    { t: "Fiber", v: `${Math.round(Number(totals.fiber_g))}g`, s: `/ ${fiberTarget}g`, p: Math.min(100, (Number(totals.fiber_g) / Math.max(1, fiberTarget)) * 100), c: "bg-chart-3" },
  ];

  return <AppShell userEmail={userEmail}>
    <div className="mx-auto max-w-[1500px] p-5 pb-28 md:p-9">
      <section className="reveal flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.25em] text-accent">Your daily nourishment</p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">Namaste, <em>{firstName}.</em></h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{proteinGap > 0 ? `You’re ${proteinGap}g of protein away from today’s target.` : "Protein target hit. Beautiful work."}</p>
        </div>
        <Link to="/meals"><Button variant="saffron" size="lg" className="rounded-full"><Plus />Log a meal</Button></Link>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.75fr)]">
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((x) => (
              <div key={x.t} className="premium-card rounded-2xl p-5">
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-muted-foreground">{x.t}</p>
                <p className="mt-3 text-2xl font-bold">{x.v} <span className="text-xs font-medium text-muted-foreground">{x.s}</span></p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${x.c}`} style={{ width: `${x.p}%` }} /></div>
              </div>
            ))}
          </section>

          <section className="relative min-h-[300px] overflow-hidden rounded-[2rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
            <div className="relative z-10 max-w-[58%] p-7 md:p-10">
              <span className="rounded-full bg-primary-foreground/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-accent">AI recommended</span>
              <h2 className="mt-5 font-serif text-3xl leading-tight md:text-4xl">Generate a recipe for {proteinGap > 0 ? "more protein" : "today’s remaining calories"}</h2>
              <p className="mt-4 text-sm text-primary-foreground/66">Personalized to your goals, allergies and pantry staples.</p>
              <Link to="/recipes"><Button variant="saffron" className="mt-7 rounded-full">Open recipe studio</Button></Link>
            </div>
            <img src={paneerSalad} alt="Healthy bowl" width={800} height={1024} className="absolute inset-y-0 right-0 h-full w-[47%] object-cover [mask-image:linear-gradient(to_right,transparent,black_35%)]" />
          </section>

          <section className="grid gap-6 md:grid-cols-[1.25fr_.75fr]">
            <div className="premium-card rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Weekly energy</p><h3 className="mt-1 font-serif text-2xl">Calories logged</h3></div>
                <Activity className="text-primary" />
              </div>
              <div className="mt-4 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="nutrition" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--color-primary)" stopOpacity=".35" /><stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" /></linearGradient></defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="kcal" stroke="var(--color-primary)" strokeWidth={3} fill="url(#nutrition)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-3xl bg-accent/14 p-6 ring-1 ring-accent/25">
              <HeartPulse className="text-accent-foreground" />
              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-accent-foreground/60">Today’s nutrition gap</p>
              <h3 className="mt-2 font-serif text-2xl">{proteinGap > 0 ? `Protein short by ${proteinGap}g` : calorieGap > 200 ? `${calorieGap} kcal remaining` : "On track today"}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{proteinGap > 0 ? "Try moong dal soup with paneer, or two boiled eggs." : "Keep it gentle — sip warm water with lemon."}</p>
            </div>
          </section>
        </div>

        <aside className="premium-card flex min-h-[640px] flex-col overflow-hidden rounded-3xl">
          <div className="flex items-center gap-3 border-b border-border p-5">
            <img src={nutriaiMark} alt="NutriAI assistant" className="size-10 rounded-xl" />
            <div><h2 className="font-serif text-xl">Nutrition concierge</h2><p className="text-xs text-muted-foreground">Profile-aware • always available</p></div>
            <span className="ml-auto size-2.5 rounded-full bg-chart-2" />
          </div>
          <Conversation className="min-h-0">
            <ConversationContent className="gap-5 p-5">
              {messages.length === 0 && <ConversationEmptyState icon={<MessageCircle className="size-8 text-primary" />} title="Ask NutriAI" description="Try: How can I increase protein in dal bhat?" />}
              {messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent className={message.role === "user" ? "bg-primary text-primary-foreground" : ""}>
                    {message.parts.map((part, i) => part.type === "text" ? <MessageResponse key={i}>{part.text}</MessageResponse> : null)}
                  </MessageContent>
                </Message>
              ))}
              {status === "submitted" && <Shimmer className="text-muted-foreground">Thinking with your health profile…</Shimmer>}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          <div className="border-t border-border bg-card/60 p-4">
            <PromptInput onSubmit={async ({ text }) => { if (!text.trim()) return; await sendMessage({ text }); inputRef.current?.focus(); }}>
              <PromptInputTextarea ref={inputRef} placeholder="Ask about swaps, macros, cooking…" className="min-h-20" />
              <PromptInputFooter className="justify-end"><PromptInputSubmit status={status} onStop={stop} /></PromptInputFooter>
            </PromptInput>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">Guidance only — consult a clinician for medical decisions.</p>
          </div>
        </aside>
      </div>
    </div>
  </AppShell>;
}
