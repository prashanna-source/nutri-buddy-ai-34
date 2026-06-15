import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
export const loadChat = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("chat_messages").select("ai_message_id,role,parts").eq("user_id", context.userId).order("created_at");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row, index) => {
      const rawParts = Array.isArray(row.parts) ? row.parts : [];
      const parts = rawParts.flatMap((part) => {
        if (part && typeof part === "object" && "type" in part && part.type === "text" && "text" in part && typeof part.text === "string") return [{ type: "text" as const, text: part.text }];
        return [];
      });
      return { id: row.ai_message_id ?? `saved-${index}`, role: row.role === "user" ? "user" as const : "assistant" as const, parts };
    });
  });