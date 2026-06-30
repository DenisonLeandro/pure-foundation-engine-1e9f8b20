-- =====================================================
-- Extend brand_profiles with visual identity fields
-- =====================================================
-- Add visual design configuration columns to brand_profiles
-- All columns nullable/default for safe backwards compatibility

ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS art_style text,
  ADD COLUMN IF NOT EXISTS layout_presets text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS font_title text,
  ADD COLUMN IF NOT EXISTS font_body text,
  ADD COLUMN IF NOT EXISTS color_roles jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reference_image_url text;
