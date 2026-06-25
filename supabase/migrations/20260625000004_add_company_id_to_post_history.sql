-- =====================================================
-- Add company_id to post_history for multi-company isolation
-- =====================================================
-- Post history should be isolated by company, not just user.
-- This migration adds company_id (nullable) to maintain backward compatibility.

ALTER TABLE public.post_history
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- Backfill: Try to infer company_id from user_id
-- For users with exactly one company, link their posts to that company
UPDATE public.post_history ph
SET company_id = c.id
FROM (
  SELECT DISTINCT cm.user_id, c.id
  FROM public.company_members cm
  JOIN public.companies c ON c.id = cm.company_id
  WHERE cm.status = 'active'
  GROUP BY cm.user_id, c.id
  HAVING COUNT(DISTINCT cm.company_id) = 1
) as c
WHERE ph.user_id = c.user_id AND ph.company_id IS NULL;

-- Create index for company-based queries
CREATE INDEX IF NOT EXISTS idx_post_history_company
  ON public.post_history (company_id, created_at DESC);

-- Update RLS to include company isolation
-- Members can view posts from their company OR their own posts (backward compat)
DROP POLICY IF EXISTS "Users can read own posts" ON public.post_history;
CREATE POLICY "Users can read own posts and company posts"
  ON public.post_history FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  );

-- Managers can update posts from their company
DROP POLICY IF EXISTS "Users can update own posts" ON public.post_history;
CREATE POLICY "Users can update own posts and company posts"
  ON public.post_history FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.can_manage_members(company_id, auth.uid()))
  );

-- Insert policy: posts inherit company from creator's company_social_accounts
-- For now, allow inserts if user is authenticated (backend will set company_id)
CREATE POLICY "Users can insert own posts"
  ON public.post_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
