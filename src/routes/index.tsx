import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutriAI — Personalized Nutrition & Healthy Recipes" },
      { name: "description", content: "AI-powered personalized nutrition, healthy Indian and Nepali recipes, meal tracking, and practical daily guidance." },
      { property: "og:title", content: "NutriAI — Personalized Nutrition" },
      { property: "og:description", content: "Personalized healthy recipes and nutrition guidance for Nepal and India." },
    ],
  }),
  beforeLoad: () => { throw redirect({ to: "/auth" }); },
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return null;
}
