import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutriAI — Personalized Nutrition & Healthy Recipes" },
      { name: "description", content: "AI-powered personalized nutrition, healthy Indian and Nepali recipes, meal tracking, and practical daily guidance." },
    ],
  }),
  beforeLoad: () => { throw redirect({ to: "/dashboard" }); },
  component: () => null,
});
