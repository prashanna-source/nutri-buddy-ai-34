# Nutri Pal

Build a Complete AI-Powered Personalized Nutrition & Healthy Recipe Web Application

Create a modern, production-ready, responsive web application called NutriAI.

Core Vision

The platform should act as a personal AI nutrition assistant that understands a user's profile, health goals, dietary preferences, deficiencies, allergies, and lifestyle, then generates personalized healthy recipes that help users achieve their goals.

The application should be designed for users from Nepal and India, so recipes should primarily use ingredients commonly available in typical households, local grocery stores, and local markets.

The UI should be modern, clean, mobile-friendly, and professional.

Authentication System

Implement complete authentication:

Email & Password Login

Google Login

Forgot Password

Secure Session Management

User Profile Storage

User Dashboard

After login, users should access their personalized dashboard.

User Onboarding & Health Profile

Create a multi-step onboarding flow.

Collect:

Personal Information

Full Name

Age

Gender

Height

Weight

Country

City

Health Goals

Multiple selection:

Weight Loss

Fat Loss

Muscle Gain

Weight Gain

Maintenance

Healthy Eating

Diabetes Management

Heart Health

Gut Health

High Protein

Low Carb

Low Fat

Improve Energy

Improve Immunity

Activity Level

Sedentary

Lightly Active

Moderately Active

Very Active

Dietary Type

Vegetarian

Vegan

Eggetarian

Non-Vegetarian

Jain

Pescatarian

Cuisine Preferences

Multi-select:

Indian

Nepali

South Indian

North Indian

Chinese

Thai

Italian

Continental

Mediterranean

Food Preferences

Spicy

Mild

Sweet

Savory

Allergies

Multiple selection:

Dairy

Peanuts

Tree Nuts

Soy

Wheat

Seafood

Eggs

Custom allergy option.

Health Conditions

Diabetes

High Blood Pressure

Thyroid

Cholesterol

PCOS

Gastric Issues

IBS

Custom option.

Nutritional Deficiencies

User can select:

Iron Deficiency

Vitamin D Deficiency

Vitamin B12 Deficiency

Calcium Deficiency

Protein Deficiency

Custom deficiency option.

Save everything inside user profile.

AI Recipe Generator

Create a powerful AI recipe generator.

Inputs:

Cuisine

Meal Type

Health Goal

Calories Target

Protein Target

Difficulty Level

Preparation Time

Available Ingredients

AI should generate recipes that:

Match health goals

Respect allergies

Respect dietary type

Respect health conditions

Use common ingredients found in Nepal and India

Avoid expensive or exotic ingredients

Generated recipe must include:

Dish Information

Dish Name

Cuisine Type

Estimated Cooking Time

Difficulty Level

Servings

Nutrition Information

Calories

Protein

Carbohydrates

Fat

Fiber

Ingredients List

Provide exact quantities.

Step-by-Step Instructions

Explain in simple layman language.

No chef jargon.

Every step should be beginner-friendly.

AI Food Image Generation

For every generated recipe:

Automatically generate a realistic food image.

Requirements:

High-quality food photography style

Realistic plating

Natural lighting

Appetizing presentation

Display image above recipe.

Recipe Variations

For every recipe generate 3 variations:

1. Quick Version

Faster preparation

Minimal cooking

2. High Protein Version

Increased protein

Same cuisine style

3. Budget Friendly Version

Cheapest ingredient alternatives

Maintain nutrition quality

Liquid Diet Alternative

Add special feature:

"Cannot Chew? Show Liquid Alternative"

When clicked:

Generate:

Smoothie

Soup

Shake

Blended Meal

that provides similar nutritional value.

Display:

Calories

Protein

Carbs

Fat

Recipe History

User profile should save:

All generated recipes

Saved recipes

Favorite recipes

Allow:

Search

Filter

Reopen recipe

AI Nutrition Chatbot

Include chatbot available throughout application.

User can ask:

How to cook recipe

Ingredient substitutions

Nutrition questions

Diet questions

Meal planning questions

Chatbot should understand user's profile and generated recipes.

Examples:

"I don't have paneer. What can I use?"

"Can I make this recipe without milk?"

"How can I increase protein in this meal?"

Use conversational AI responses.

Meal Tracker

Create a complete meal tracking system.

Daily Tracking:

Breakfast

Lunch

Dinner

Snacks

User can:

Add generated recipes directly

Add custom meals

Edit entries

Store everything.

Weekly Nutrition Dashboard

Create analytics dashboard.

Display:

Daily calories

Weekly calories

Protein consumed

Carbs consumed

Fat consumed

Fiber consumed

Use charts and visualizations.

Smart Deficiency Detection

At end of each day:

Analyze user's intake.

If goals are not met:

Show:

"Today's Nutrition Gap"

Example:

Protein short by 35g

Fiber short by 12g

Iron low

Provide recommendations.

Example:

"Drink a banana-peanut smoothie"

or

"Add 2 boiled eggs"

or

"Consume lentil soup"

AI Daily Recommendations

Every morning generate:

Recommended breakfast

Recommended lunch

Recommended dinner

Recommended snack

Based on:

User goals

Previous intake

Deficiencies

Saved preferences

YouTube Integration

Every generated recipe should include:

"Watch Similar Recipe"

Generate YouTube search link automatically using recipe keywords.

Examples:

Paneer Bhurji Healthy Version

High Protein Moong Dal Chilla

Clicking button should open YouTube search results.

Feedback System

Add feedback module.

For each recipe:

👍 Helpful

👎 Not Helpful

Additional feedback form:

Taste Rating

Ease Rating

Accuracy Rating

Suggestions

Store feedback in database.

Admin Dashboard

Create admin panel.

Features:

Total Users

Total Recipes Generated

Most Popular Recipes

Most Common Health Goals

Feedback Analytics

User Growth

Database Design

Create proper relational database schema.

Tables:

Users

Profiles

Recipes

SavedRecipes

Favorites

MealLogs

NutritionLogs

ChatHistory

Feedback

DailyRecommendations

AI Integrations

Use:

LLM

For:

Recipe generation

Chatbot

Recommendations

Image Generation Model

For:

Food image generation

Nutrition Engine

For:

Calories

Protein

Carbs

Fat

Fiber calculations

Tech Stack

Frontend:

React

TypeScript

Tailwind CSS

Shadcn UI

Backend:

Supabase

Authentication:

Supabase Auth

Database:

PostgreSQL

AI:

OpenAI APIs

Charts:

Recharts

State Management:

React Query

UX Requirements

Fast

Mobile-first

Modern

Clean

Professional

Responsive

Accessible

Use beautiful dashboard cards, charts, recipe cards, profile sections, and meal tracking pages.

The final application should feel like a premium AI nutrition platform, not a simple recipe generator.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nutri-buddy-ai-34.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/28c5a64e-bbb4-43f7-9370-c0f1cf8fa666).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
