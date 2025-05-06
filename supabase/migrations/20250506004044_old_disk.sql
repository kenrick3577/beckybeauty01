/*
  # Add service-images storage bucket
  
  1. Changes
    - Create storage bucket specifically for service images
    - Set proper bucket configuration 
    - Add storage policies for service image management
    
  2. Security
    - Only admins can upload and manage service images
    - Public can view service images
    - Proper file validation
*/

-- Create service-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'service-images',
    'service-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow admins to upload service images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow admins to update service images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow admins to delete service images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public to view service images" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create policy to allow admins to upload service images
CREATE POLICY "Allow admins to upload service images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'service-images' AND
    (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    ))
);

-- Create policy to allow admins to update service images
CREATE POLICY "Allow admins to update service images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'service-images' AND
    (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    ))
)
WITH CHECK (
    bucket_id = 'service-images' AND
    (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    ))
);

-- Create policy to allow admins to delete service images
CREATE POLICY "Allow admins to delete service images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'service-images' AND
    (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    ))
);

-- Create policy to allow public to view service images
CREATE POLICY "Allow public to view service images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'service-images');