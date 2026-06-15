
-- ============ companies ============
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  segment text,
  logo_url text,
  primary_color text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ============ company_members ============
CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','editor')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','removed')),
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE INDEX idx_company_members_user ON public.company_members(user_id);
CREATE INDEX idx_company_members_company ON public.company_members(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- ============ company_invites ============
CREATE TABLE public.company_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','editor')),
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_invites_company ON public.company_invites(company_id);
CREATE INDEX idx_company_invites_email ON public.company_invites(email);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_invites TO authenticated;
GRANT ALL ON public.company_invites TO service_role;
ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

-- ============ helper functions ============
CREATE OR REPLACE FUNCTION public.is_company_member(_company uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = _company AND user_id = _user AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_company_role(_company uuid, _user uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.company_members
  WHERE company_id = _company AND user_id = _user AND status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_members(_company uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = _company AND user_id = _user
      AND status = 'active' AND role IN ('owner','admin')
  );
$$;

-- ============ trigger: criador vira owner ============
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.company_members (company_id, user_id, role, status)
  VALUES (NEW.id, NEW.created_by, 'owner', 'active');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_company_created_owner
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.handle_new_company();

CREATE TRIGGER trg_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_company_members_updated_at
BEFORE UPDATE ON public.company_members
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ RLS: companies ============
CREATE POLICY "members can view their companies" ON public.companies
FOR SELECT TO authenticated
USING (public.is_company_member(id, auth.uid()));

CREATE POLICY "authenticated can create companies" ON public.companies
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "owners and admins can update company" ON public.companies
FOR UPDATE TO authenticated
USING (public.get_company_role(id, auth.uid()) IN ('owner','admin'))
WITH CHECK (public.get_company_role(id, auth.uid()) IN ('owner','admin'));

-- ============ RLS: company_members ============
CREATE POLICY "members can view their company members" ON public.company_members
FOR SELECT TO authenticated
USING (public.is_company_member(company_id, auth.uid()));

-- INSERT: only via trigger (security definer) or backend (service_role bypasses RLS).
-- No INSERT policy for authenticated => blocked from client.

CREATE POLICY "managers can update members" ON public.company_members
FOR UPDATE TO authenticated
USING (
  public.can_manage_members(company_id, auth.uid())
  AND user_id <> auth.uid()
  AND (
    public.get_company_role(company_id, auth.uid()) = 'owner'
    OR role = 'editor'
  )
)
WITH CHECK (
  public.can_manage_members(company_id, auth.uid())
  AND user_id <> auth.uid()
  AND role IN ('admin','editor')
);

CREATE POLICY "managers can remove members" ON public.company_members
FOR DELETE TO authenticated
USING (
  public.can_manage_members(company_id, auth.uid())
  AND user_id <> auth.uid()
  AND (
    public.get_company_role(company_id, auth.uid()) = 'owner'
    OR role = 'editor'
  )
);

-- ============ RLS: company_invites ============
CREATE POLICY "managers can view invites" ON public.company_invites
FOR SELECT TO authenticated
USING (public.can_manage_members(company_id, auth.uid()));

CREATE POLICY "managers can update invites" ON public.company_invites
FOR UPDATE TO authenticated
USING (public.can_manage_members(company_id, auth.uid()))
WITH CHECK (public.can_manage_members(company_id, auth.uid()));

-- INSERT and accept happen via Edge Function with service_role.
