
CREATE OR REPLACE FUNCTION public.count_active_owners(_company uuid)
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.company_members
  WHERE company_id = _company AND status = 'active' AND role = 'owner';
$$;

DROP POLICY IF EXISTS "managers can update members" ON public.company_members;
DROP POLICY IF EXISTS "managers can remove members" ON public.company_members;

CREATE POLICY "managers can update members"
ON public.company_members
FOR UPDATE
TO authenticated
USING (
  public.can_manage_members(company_id, auth.uid())
  AND user_id <> auth.uid()
  AND role <> 'owner'
  AND (
    public.get_company_role(company_id, auth.uid()) = 'owner'
    OR role = 'editor'
  )
)
WITH CHECK (
  public.can_manage_members(company_id, auth.uid())
  AND user_id <> auth.uid()
  AND role IN ('admin','editor')
  AND (
    public.get_company_role(company_id, auth.uid()) = 'owner'
    OR role = 'editor'
  )
);

CREATE POLICY "managers can remove members"
ON public.company_members
FOR DELETE
TO authenticated
USING (
  public.can_manage_members(company_id, auth.uid())
  AND user_id <> auth.uid()
  AND role <> 'owner'
  AND (
    public.get_company_role(company_id, auth.uid()) = 'owner'
    OR role = 'editor'
  )
);
