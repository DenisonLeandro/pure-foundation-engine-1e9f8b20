CREATE POLICY "managers can create invites"
ON public.company_invites
FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_members(company_id, auth.uid()));

CREATE POLICY "managers can delete invites"
ON public.company_invites
FOR DELETE
TO authenticated
USING (public.can_manage_members(company_id, auth.uid()));