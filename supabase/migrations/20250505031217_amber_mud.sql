-- Create storage bucket for service images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload service images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images' AND
  (auth.jwt()->>'role' = 'service_role' OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  ))
);

-- Create policy to allow public to view service images
CREATE POLICY "Allow public to view service images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'service-images');

-- Create policy to allow admins to delete service images
CREATE POLICY "Allow admins to delete service images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-images' AND
  (auth.jwt()->>'role' = 'service_role' OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  ))
);