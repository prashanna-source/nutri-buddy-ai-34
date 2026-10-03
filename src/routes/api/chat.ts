import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        const url = process.env.SUPABASE_URL;
        const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        const aiKey = process.env.LOVABLE_API_KEY;
        if (!token || !url || !publicKey) return new Response("Unauthorized", { status: 401 });
        if (!aiKey) return new Response("AI service is not configured", { status: 500 });

        const client = createClient(url, publicKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
        const { data: claims, error: authError } = await client.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (authError || !userId) return new Response("Unauthorized", { status: 401 });

        const raw = await request.text();
        if (raw.length > 200_000) return new Response("Request too large", { status: 413 });
        let body: { messages?: UIMessage[] };
        try { body = JSON.parse(raw); } catch { return new Response("Invalid JSON", { status: 400 }); }
        if (!Array.isArray(body.messages) || body.messages.length === 0) return new Response("Messages are required", { status: 400 });
        if (body.messages.length > 60) body.messages = body.messages.slice(-60);
        const { data: profile } = await client.from("profiles").select("health_goals,dietary_type,allergies,health_conditions,deficiencies,country,city").eq("id", userId).maybeSingle();
        const { createNutriAiProvider } = await import("@/lib/ai-gateway.server");
        const gateway = createNutriAiProvider(aiKey);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: `You are NutriAI, a careful nutrition assistant for Nepal and India. Give practical, affordable, locally available suggestions in simple language. Never diagnose or replace medical care. User profile: ${JSON.stringify(profile ?? {})}`,
          messages: await convertToModelMessages(body.messages),
        });
        return result.toUIMessageStreamResponse({
          originalMessages: body.messages,
          onFinish: async ({ messages }) => {
            const rows = messages.map((message) => ({ user_id: userId, ai_message_id: message.id, role: message.role, parts: message.parts }));
            const { error } = await client.from("chat_messages").delete().eq("user_id", userId);
            if (!error && rows.length) {
              const { error: insertError } = await client.from("chat_messages").insert(rows);
              if (insertError) console.error("Chat persistence failed", insertError.message);
            } else if (error) console.error("Chat persistence failed", error.message);
          },
        });
      },
    },
  },
});