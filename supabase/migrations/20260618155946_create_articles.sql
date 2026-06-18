-- Articles table for publishing news/articles to the website
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  category TEXT,
  linked_creation_id UUID REFERENCES public.creations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, linked, published
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_company_id ON public.articles(company_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_by ON public.articles(created_by);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_linked_creation_id ON public.articles(linked_creation_id);

-- RLS: Enable row level security
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Company members can read articles from their company (except published ones which are public)
CREATE POLICY "Company members can read articles"
  ON public.articles FOR SELECT TO authenticated
  USING (
    company_id IS NOT NULL
    AND public.is_company_member(company_id, auth.uid())
  );

-- Public read policy: anyone can read published articles
CREATE POLICY "Public read published articles"
  ON public.articles FOR SELECT TO anon
  USING (status = 'published');

-- Also allow authenticated users to read published articles
CREATE POLICY "Authenticated read published articles"
  ON public.articles FOR SELECT TO authenticated
  USING (status = 'published');

-- Company members can insert articles
CREATE POLICY "Company members can insert articles"
  ON public.articles FOR INSERT TO authenticated
  WITH CHECK (
    company_id IS NOT NULL
    AND public.is_company_member(company_id, auth.uid())
    AND created_by = auth.uid()
  );

-- Owners/admins update any, creators update own
CREATE POLICY "Owners/admins update any, creators update own"
  ON public.articles FOR UPDATE TO authenticated
  USING (
    company_id IS NOT NULL
    AND (
      public.can_manage_members(company_id, auth.uid())
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (
    company_id IS NOT NULL
    AND public.is_company_member(company_id, auth.uid())
  );

-- Owners/admins can delete articles
CREATE POLICY "Owners/admins can delete articles"
  ON public.articles FOR DELETE TO authenticated
  USING (
    company_id IS NOT NULL
    AND public.can_manage_members(company_id, auth.uid())
  );
