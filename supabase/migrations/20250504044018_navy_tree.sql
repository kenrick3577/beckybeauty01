-- Drop existing policies to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;
END
$$;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Allow registration"
ON public.users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to read own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_app_meta_data->>'role' = 'admin' OR
      au.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
);

CREATE POLICY "Allow users to update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_app_meta_data->>'role' = 'admin' OR
      au.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
)
WITH CHECK (
  auth.uid() = id OR
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_app_meta_data->>'role' = 'admin' OR
      au.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
);

-- Update admin metadata
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'iceiceiceiceice5@gmail.com';

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'
)
WHERE email = 'iceiceiceiceice5@gmail.com';

-- Update users table admin role
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceiceice5@gmail.com'
AND id IS NOT NULL;