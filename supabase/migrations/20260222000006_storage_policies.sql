-- Migration: Storage Bucket and Policies for Travel Documents

-- 1. Create the bucket (Safe to run multiple times)
-- Note: In some environments, this might need to be done via the Dashboard or API, 
-- but we include the SQL record for metadata and policy context.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Clear existing policies to avoid duplicates during development
DELETE FROM storage.policies WHERE bucket_id = 'documents';

-- 3. Policy: Authenticated users can upload files
CREATE POLICY "Users can upload travel documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Aprovadores can view documents in their department
-- This is more complex because it requires joining with the profiles table via the folder name (which is user_id)
CREATE POLICY "Approvers can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles AS p_owner
    JOIN public.profiles AS p_viewer ON p_viewer.id = auth.uid()
    WHERE p_owner.id::text = (storage.foldername(name))[1]
    AND p_viewer.departamento = p_owner.departamento
    AND p_viewer.cargo IN ('Chefia', 'Subsecretário', 'Secretário', 'DAD')
  )
);

-- 6. Policy: Users can delete their own documents (only if needed)
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
