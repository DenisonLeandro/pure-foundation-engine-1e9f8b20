-- =====================================================
-- Company Social Accounts — isolate PFM accounts per company
-- =====================================================
-- This table maps Post for Me (PFM) accounts to specific companies.
-- Multiple companies can share the same postforme_api_key, but each
-- company selects which accounts it wants to use.
--
-- Architecture:
-- - Company A has postforme_api_key "xxx" with accounts A1, A2 connected to PFM
-- - Company B shares postforme_api_key "xxx" but only uses account A1
-- - Company C also shares "xxx" and uses accounts A1, A2
--
-- This allows:
-- 1. Cost sharing (one API key for multiple companies)
-- 2. Account isolation (each company only sees/uses its selected accounts)

CREATE TABLE IF NOT EXISTS public.company_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- PFM account identifier (from Post for Me API response)
  pfm_account_id text NOT NULL,

  -- Account details (cached from PFM for quick access)
  platform text NOT NULL, -- 'instagram', 'tiktok', 'twitter', etc
  username text NOT NULL,
  full_name text,

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure no duplicate accounts per company
  UNIQUE(company_id, pfm_account_id)
);

-- Enable RLS
ALTER TABLE public.company_social_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Company members can view their company's accounts
CREATE POLICY "members can view company social accounts"
  ON public.company_social_accounts FOR SELECT
  TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

-- Managers (owner/admin) can insert accounts
CREATE POLICY "managers can add social accounts"
  ON public.company_social_accounts FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_members(company_id, auth.uid()));

-- Managers can update account details
CREATE POLICY "managers can update social accounts"
  ON public.company_social_accounts FOR UPDATE
  TO authenticated
  USING (public.can_manage_members(company_id, auth.uid()))
  WITH CHECK (public.can_manage_members(company_id, auth.uid()));

-- Managers can remove accounts
CREATE POLICY "managers can delete social accounts"
  ON public.company_social_accounts FOR DELETE
  TO authenticated
  USING (public.can_manage_members(company_id, auth.uid()));

-- Auto-update updated_at on modifications
CREATE TRIGGER trg_company_social_accounts_updated_at
  BEFORE UPDATE ON public.company_social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for fast lookups
CREATE INDEX idx_company_social_accounts_company
  ON public.company_social_accounts (company_id, platform);

CREATE INDEX idx_company_social_accounts_pfm_id
  ON public.company_social_accounts (pfm_account_id);
