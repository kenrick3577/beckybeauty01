/*
  # Fix Members Page Database Access

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new optimized policies for member access
    - Add indexes for better query performance
    - Update admin role metadata
    
  2. Security
    - Maintain proper access control
    - Optimize query performance
    - Fix infinite recursion issues
*/

-- Drop existing policies to avoid conflicts
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
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create optimized policies
CREATE POLICY "Enable registration"
ON users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin access"
ON users
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);
CREATE INDEX IF NOT EXISTS users_account_status_idx ON users(account_status);
CREATE INDEX IF NOT EXISTS users_account_type_idx ON users(account_type);

-- Update admin metadata
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'iceiceiceiceice5@gmail.com';

-- Update users table admin role
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceiceice5@gmail.com'
AND id IS NOT NULL;