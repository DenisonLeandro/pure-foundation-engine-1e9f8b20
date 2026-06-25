-- =====================================================
-- Create company_social_accounts table
-- =====================================================
-- Track social media accounts per company
-- Isolates account access by company

CREATE TABLE IF NOT EXISTS public.company_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pfm_account_id text NOT NULL,
  platform text NOT NULL,
  username text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(company_id, pfm_account_id),
  UNIQUE(company_id, platform, username)
);

CREATE INDEX IF NOT EXISTS idx_company_social_accounts_company
  ON public.company_social_accounts(company_id);

CREATE INDEX IF NOT EXISTS idx_company_social_accounts_pfm_account
  ON public.company_social_accounts(pfm_account_id);

ALTER TABLE public.company_social_accounts ENABLE ROW LEVEL SECURITY;

-- Members can view accounts from their company
CREATE POLICY "members can view company social accounts"
  ON public.company_social_accounts FOR SELECT
  TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

-- Managers can manage accounts in their company
CREATE POLICY "managers can manage company social accounts"
  ON public.company_social_accounts FOR ALL
  TO authenticated
  USING (public.can_manage_members(company_id, auth.uid()))
  WITH CHECK (public.can_manage_members(company_id, auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_social_accounts TO authenticated;
GRANT ALL ON public.company_social_accounts TO service_role;
