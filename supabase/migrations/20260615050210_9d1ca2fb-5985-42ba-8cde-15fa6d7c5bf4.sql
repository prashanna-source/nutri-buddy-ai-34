CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  age integer,
  gender text,
  height_cm numeric(6,2),
  weight_kg numeric(6,2),
  country text NOT NULL DEFAULT 'Nepal',
  city text NOT NULL DEFAULT '',
  health_goals text[] NOT NULL DEFAULT '{}',
  activity_level text,
  dietary_type text,
  cuisine_preferences text[] NOT NULL DEFAULT '{}',
  food_preferences text[] NOT NULL DEFAULT '{}',
  allergies text[] NOT NULL DEFAULT '{}',
  custom_allergies text[] NOT NULL DEFAULT '{}',
  health_conditions text[] NOT NULL DEFAULT '{}',
  custom_conditions text[] NOT NULL DEFAULT '{}',
  deficiencies text[] NOT NULL DEFAULT '{}',
  custom_deficiencies text[] NOT NULL DEFAULT '{}',
  calorie_target integer NOT NULL DEFAULT 2000,
  protein_target_g integer NOT NULL DEFAULT 75,
  carbs_target_g integer NOT NULL DEFAULT 250,
  fat_target_g integer NOT NULL DEFAULT 65,
  fiber_target_g integer NOT NULL DEFAULT 30,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dish_name text NOT NULL,
  cuisine_type text NOT NULL,
  meal_type text NOT NULL,
  cooking_time_minutes integer NOT NULL,
  difficulty text NOT NULL,
  servings integer NOT NULL DEFAULT 1,
  calories integer NOT NULL,
  protein_g numeric(8,2) NOT NULL,
  carbs_g numeric(8,2) NOT NULL,
  fat_g numeric(8,2) NOT NULL,
  fiber_g numeric(8,2) NOT NULL,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  instructions jsonb NOT NULL DEFAULT '[]'::jsonb,
  variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  liquid_alternative jsonb,
  image_url text,
  generation_input jsonb NOT NULL DEFAULT '{}'::jsonb,
  youtube_query text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recipes" ON public.recipes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX recipes_user_created_idx ON public.recipes(user_id, created_at DESC);
CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.saved_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_recipes TO authenticated;
GRANT ALL ON public.saved_recipes TO service_role;
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved recipes" ON public.saved_recipes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  logged_on date NOT NULL DEFAULT CURRENT_DATE,
  meal_type public.meal_type NOT NULL,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  meal_name text NOT NULL,
  servings numeric(6,2) NOT NULL DEFAULT 1,
  calories integer NOT NULL DEFAULT 0,
  protein_g numeric(8,2) NOT NULL DEFAULT 0,
  carbs_g numeric(8,2) NOT NULL DEFAULT 0,
  fat_g numeric(8,2) NOT NULL DEFAULT 0,
  fiber_g numeric(8,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_logs TO authenticated;
GRANT ALL ON public.meal_logs TO service_role;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own meal logs" ON public.meal_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX meal_logs_user_date_idx ON public.meal_logs(user_id, logged_on DESC);
CREATE TRIGGER meal_logs_updated_at BEFORE UPDATE ON public.meal_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  logged_on date NOT NULL DEFAULT CURRENT_DATE,
  calories integer NOT NULL DEFAULT 0,
  protein_g numeric(8,2) NOT NULL DEFAULT 0,
  carbs_g numeric(8,2) NOT NULL DEFAULT 0,
  fat_g numeric(8,2) NOT NULL DEFAULT 0,
  fiber_g numeric(8,2) NOT NULL DEFAULT 0,
  detected_gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, logged_on)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_logs TO authenticated;
GRANT ALL ON public.nutrition_logs TO service_role;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own nutrition logs" ON public.nutrition_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER nutrition_logs_updated_at BEFORE UPDATE ON public.nutrition_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ai_message_id text,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chat messages" ON public.chat_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX chat_messages_user_created_idx ON public.chat_messages(user_id, created_at);

CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  helpful boolean,
  taste_rating integer CHECK (taste_rating BETWEEN 1 AND 5),
  ease_rating integer CHECK (ease_rating BETWEEN 1 AND 5),
  accuracy_rating integer CHECK (accuracy_rating BETWEEN 1 AND 5),
  suggestions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own feedback" ON public.feedback FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.daily_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recommendation_date date NOT NULL DEFAULT CURRENT_DATE,
  meals jsonb NOT NULL DEFAULT '{}'::jsonb,
  rationale text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, recommendation_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_recommendations TO authenticated;
GRANT ALL ON public.daily_recommendations TO service_role;
ALTER TABLE public.daily_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recommendations" ON public.daily_recommendations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;