import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: profile } = await supabase.from("profiles").select("id,full_name,onboarding_completed").eq("id", data.user.id).maybeSingle();
    const completed = !!profile?.onboarding_completed;
    const path = location.pathname;
    if (!completed && path !== "/onboarding") throw redirect({ to: "/onboarding" });
    if (completed && path === "/onboarding") throw redirect({ to: "/dashboard" });
    return { user: data.user, profileCompleted: completed };
  },
  component: () => <Outlet />,
});
