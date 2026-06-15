import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: ResetPassword });
function ResetPassword() {
  const [password, setPassword] = useState(""); const navigate = useNavigate();
  return <main className="flex min-h-screen items-center justify-center px-6"><form className="premium-card w-full max-w-md rounded-3xl p-8" onSubmit={async (e) => { e.preventDefault(); const { error } = await supabase.auth.updateUser({ password }); if (error) toast.error(error.message); else { toast.success("Password updated"); navigate({ to: "/auth" }); } }}><h1 className="font-serif text-4xl">Choose a new password</h1><p className="mt-2 text-muted-foreground">Use at least eight characters.</p><Input className="mt-7 h-12" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /><Button className="mt-4 w-full" variant="premium">Update password</Button></form></main>;
}