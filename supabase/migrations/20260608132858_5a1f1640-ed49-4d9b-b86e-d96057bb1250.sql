-- Drop old narrow policies on storage.objects for the media bucket
DROP POLICY IF EXISTS "Users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own media" ON storage.objects;
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;

-- Keep a single public read for the bucket
CREATE POLICY "media_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated users to read/write/update/delete any object in the
-- media bucket as long as their uid appears in any segment of the path.
-- This covers {uid}/..., studio/{uid}/..., gallery/{uid}/..., carousel/{uid}/...
CREATE POLICY "media_authenticated_rw"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'media'
  AND (auth.uid())::text = ANY (storage.foldername(name))
)
WITH CHECK (
  bucket_id = 'media'
  AND (auth.uid())::text = ANY (storage.foldername(name))
);