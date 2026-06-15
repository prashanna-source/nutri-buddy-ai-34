import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/generate-image")({
  server: { handlers: { POST: async ({ request }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return new Response("AI service is not configured", { status: 500 });
    const { dishName } = await request.json() as { dishName?: string };
    if (!dishName) return new Response("Dish name is required", { status: 400 });
    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "openai/gpt-image-2", prompt: `Realistic premium food photography of ${dishName}, authentic Indian or Nepali household ingredients, refined natural plating, warm window light, appetizing, no text, no people`, quality: "low", size: "1024x1024", n: 1, stream: true, partial_images: 1 }) });
    if (!upstream.ok || !upstream.body) return new Response(await upstream.text(), { status: upstream.status });
    return new Response(upstream.body, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  } } } },
});