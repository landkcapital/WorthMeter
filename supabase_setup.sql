-- ============================================================
-- WorthMeter Tables Setup (public schema, safe to re-run)
-- Run this in the Supabase Dashboard SQL Editor
-- ============================================================

-- 1. Create targets table
CREATE TABLE IF NOT EXISTS public.targets (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  target_amount  numeric NOT NULL,
  target_date    timestamptz NOT NULL,
  start_amount   numeric NOT NULL DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

-- 2. Create penalties table
CREATE TABLE IF NOT EXISTS public.penalties (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  target_id   uuid REFERENCES public.targets(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  amount      numeric NOT NULL,
  reason      text,
  created_at  timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies (drop first so this script is re-runnable)
DROP POLICY IF EXISTS "Users can view own targets" ON public.targets;
DROP POLICY IF EXISTS "Users can insert own targets" ON public.targets;
DROP POLICY IF EXISTS "Users can update own targets" ON public.targets;
DROP POLICY IF EXISTS "Users can delete own targets" ON public.targets;
DROP POLICY IF EXISTS "Users can view own penalties" ON public.penalties;
DROP POLICY IF EXISTS "Users can insert own penalties" ON public.penalties;
DROP POLICY IF EXISTS "Users can update own penalties" ON public.penalties;
DROP POLICY IF EXISTS "Users can delete own penalties" ON public.penalties;

CREATE POLICY "Users can view own targets"
  ON public.targets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own targets"
  ON public.targets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own targets"
  ON public.targets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own targets"
  ON public.targets FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own penalties"
  ON public.penalties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own penalties"
  ON public.penalties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own penalties"
  ON public.penalties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own penalties"
  ON public.penalties FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Create non_negotiables table
CREATE TABLE IF NOT EXISTS public.non_negotiables (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  target_id   uuid REFERENCES public.targets(id) ON DELETE CASCADE NOT NULL,
  title       text NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- 6. Create daily_completions table
CREATE TABLE IF NOT EXISTS public.daily_completions (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  non_negotiable_id   uuid REFERENCES public.non_negotiables(id) ON DELETE CASCADE NOT NULL,
  completed_date      date NOT NULL,
  status              text NOT NULL DEFAULT 'completed',
  note                text,
  created_at          timestamptz DEFAULT now(),
  UNIQUE(non_negotiable_id, completed_date)
);

-- 7. Enable RLS on new tables
ALTER TABLE public.non_negotiables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies for non_negotiables
DROP POLICY IF EXISTS "Users can view own non_negotiables" ON public.non_negotiables;
DROP POLICY IF EXISTS "Users can insert own non_negotiables" ON public.non_negotiables;
DROP POLICY IF EXISTS "Users can update own non_negotiables" ON public.non_negotiables;
DROP POLICY IF EXISTS "Users can delete own non_negotiables" ON public.non_negotiables;

CREATE POLICY "Users can view own non_negotiables"
  ON public.non_negotiables FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own non_negotiables"
  ON public.non_negotiables FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own non_negotiables"
  ON public.non_negotiables FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own non_negotiables"
  ON public.non_negotiables FOR DELETE
  USING (auth.uid() = user_id);

-- 9. RLS policies for daily_completions
DROP POLICY IF EXISTS "Users can view own daily_completions" ON public.daily_completions;
DROP POLICY IF EXISTS "Users can insert own daily_completions" ON public.daily_completions;
DROP POLICY IF EXISTS "Users can update own daily_completions" ON public.daily_completions;
DROP POLICY IF EXISTS "Users can delete own daily_completions" ON public.daily_completions;

CREATE POLICY "Users can view own daily_completions"
  ON public.daily_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily_completions"
  ON public.daily_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_completions"
  ON public.daily_completions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily_completions"
  ON public.daily_completions FOR DELETE
  USING (auth.uid() = user_id);
