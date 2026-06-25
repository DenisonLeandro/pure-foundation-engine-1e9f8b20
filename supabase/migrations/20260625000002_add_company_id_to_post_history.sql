-- =====================================================
-- Add company_id to post_history for company isolation
-- =====================================================

ALTER TABLE public.post_history
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- Backfill: For users with single company, link posts to that company
UPDATE public.post_history ph
SET company_id = (
  SELECT cm.company_id
  FROM public.company_members cm
  WHERE cm.user_id = ph.user_id
    AND cm.status = 'active'
  LIMIT 1
)
WHERE ph.company_id IS NULL
  AND ph.user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.user_id = ph.user_id AND cm.status = 'active'
  );

-- Create index for company queries
CREATE INDEX IF NOT EXISTS idx_post_history_company_created
  ON public.post_history(company_id, created_at DESC);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can read own posts" ON public.post_history;
DROP POLICY IF EXISTS "Users can update own posts" ON public.post_history;

CREATE POLICY "Users can read own posts and company posts"
  ON public.post_history FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  );

CREATE POLICY "Users can update own posts and company posts"
  ON public.post_history FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.can_manage_members(company_id, auth.uid()))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.can_manage_members(company_id, auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert own posts" ON public.post_history;
CREATE POLICY "Users can insert own posts"
  ON public.post_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
