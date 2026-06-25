-- =====================================================
-- Enable multi-company invites
-- =====================================================
-- Allow users to be invited to multiple companies at once.
--
-- New table: company_invite_companies (many-to-many)
-- Links a single invite to multiple companies.
--
-- Backward compatibility:
-- - Old invites have company_id set, new ones will use this table
-- - Accept logic must check both

CREATE TABLE IF NOT EXISTS public.company_invite_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES public.company_invites(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(invite_id, company_id)
);

ALTER TABLE public.company_invite_companies ENABLE ROW LEVEL SECURITY;

-- Managers can view invites they created (via invite FK)
CREATE POLICY "managers can view company invite companies"
  ON public.company_invite_companies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_invites ci
      WHERE ci.id = invite_id
        AND public.can_manage_members(ci.company_id, auth.uid())
    )
  );

-- Managers can add companies to their invites
CREATE POLICY "managers can add companies to invites"
  ON public.company_invite_companies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_invites ci
      WHERE ci.id = invite_id
        AND public.can_manage_members(company_id, auth.uid())
    )
  );

-- Managers can remove companies from invites
CREATE POLICY "managers can remove companies from invites"
  ON public.company_invite_companies FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_invites ci
      WHERE ci.id = invite_id
        AND public.can_manage_members(company_id, auth.uid())
    )
  );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_company_invite_companies_invite
  ON public.company_invite_companies (invite_id);

CREATE INDEX IF NOT EXISTS idx_company_invite_companies_company
  ON public.company_invite_companies (company_id);
