-- =====================================================
-- Simplify company creation trigger
-- =====================================================
-- Remove API key inheritance logic from handle_new_company()
-- Keys are now pulled from user_configs at query time, not stored per company

CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Add creator as owner in company_members
  INSERT INTO public.company_members (company_id, user_id, role, status)
  VALUES (NEW.id, NEW.created_by, 'owner', 'active')
  ON CONFLICT (company_id, user_id) DO UPDATE
  SET role = 'owner', status = 'active'
  WHERE company_members.company_id = NEW.id AND company_members.user_id = NEW.created_by;

  -- Create empty company_configs row (for future use if needed)
  INSERT INTO public.company_configs (company_id)
  VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;

  RETURN NEW;
END;
$$;
