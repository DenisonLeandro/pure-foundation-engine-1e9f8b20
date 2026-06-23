CREATE UNIQUE INDEX IF NOT EXISTS creations_unique_per_company_prompt
ON public.creations (company_id, md5(prompt))
WHERE prompt IS NOT NULL AND company_id IS NOT NULL;