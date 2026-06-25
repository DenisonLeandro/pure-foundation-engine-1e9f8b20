-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type text NOT NULL DEFAULT 'owner' CHECK (account_type IN ('owner','employee')),
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Prevent account_type changes after insert
CREATE OR REPLACE FUNCTION public.prevent_account_type_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.account_type IS DISTINCT FROM NEW.account_type THEN
    RAISE EXCEPTION 'account_type não pode ser alterado';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_lock_account_type
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_account_type_change();

-- 3. Create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _account_type text;
BEGIN
  _account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'owner');
  IF _account_type NOT IN ('owner','employee') THEN
    _account_type := 'owner';
  END IF;
  INSERT INTO public.profiles (user_id, account_type, display_name)
  VALUES (NEW.id, _account_type, NULLIF(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- 4. Backfill: existing users default to 'owner'
INSERT INTO public.profiles (user_id, account_type, display_name)
SELECT u.id, 'owner', NULLIF(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

-- 5. Helper: is current user an owner-type account?
CREATE OR REPLACE FUNCTION public.is_owner_account(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT account_type = 'owner' FROM public.profiles WHERE user_id = _user_id), true);
$$;

-- 6. Restrict company creation to owner accounts
DROP POLICY IF EXISTS "Companies insert own" ON public.companies;
DROP POLICY IF EXISTS "Users can create their own companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

CREATE POLICY "Owner accounts can create companies" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_owner_account(auth.uid()));

-- 7. Restrict user_configs writes to owner accounts (read remains as-is)
DROP POLICY IF EXISTS "Users can insert own config" ON public.user_configs;
DROP POLICY IF EXISTS "Users can update own config" ON public.user_configs;

CREATE POLICY "Owner accounts insert own config" ON public.user_configs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_owner_account(auth.uid()));

CREATE POLICY "Owner accounts update own config" ON public.user_configs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.is_owner_account(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_owner_account(auth.uid()));
