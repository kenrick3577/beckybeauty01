/*
  # Fix appointments table RLS policies
  
  1. Changes
    - Drop existing appointment policies
    - Create new comprehensive policies for appointments table
    - Add helper function for admin checks
    - Ensure proper access control for appointments
    
  2. Security
    - Admins have full access to all appointments
    - Users can only manage their own appointments
    - Service role maintains full access
*/

-- Drop existing appointment policies
DROP POLICY IF EXISTS "Enable users to manage own appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can manage appointments" ON appointments;

-- Create helper function if it doesn't exist
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'admin' OR
        auth.users.raw_app_meta_data->>'is_admin' = 'true'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create new appointment policies
CREATE POLICY "Users can view own appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  is_admin() OR
  auth.jwt()->>'role' = 'service_role'
);

CREATE POLICY "Users can create own appointments"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR
  is_admin() OR
  auth.jwt()->>'role' = 'service_role'
);

CREATE POLICY "Users can update own appointments"
ON appointments FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR
  is_admin() OR
  auth.jwt()->>'role' = 'service_role'
)
WITH CHECK (
  user_id = auth.uid() OR
  is_admin() OR
  auth.jwt()->>'role' = 'service_role'
);

CREATE POLICY "Users can delete own appointments"
ON appointments FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() OR
  is_admin() OR
  auth.jwt()->>'role' = 'service_role'
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS appointments_user_id_idx ON appointments(user_id);
CREATE INDEX IF NOT EXISTS appointments_date_idx ON appointments(date);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status);

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