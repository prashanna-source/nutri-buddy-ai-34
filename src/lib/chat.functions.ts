import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import type { UIMessage } from "ai";

export const loadChat = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("chat_messages").select("ai_message_id,role,parts").eq("user_id", context.userId).order("created_at");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row, index) => ({ id: row.ai_message_id ?? `saved-${index}`, role: row.role as UIMessage["role"], parts: row.parts as UIMessage["parts"] }));
  });