/*
  # Fix Appointment Policies for Admin Access
  
  1. Changes
    - Drop existing appointment policies to avoid conflicts
    - Create new policies that properly handle admin access
    - Ensure admins can view and manage all appointments
    - Maintain existing user access controls
    
  2. Security
    - Maintains proper row-level security
    - Preserves user data privacy
    - Enables admin functionality
*/

-- First ensure RLS is enabled
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'appointments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.appointments', pol.policyname);
    END LOOP;
END
$$;

-- Create new comprehensive policies

-- Allow users to view their own appointments
CREATE POLICY "Users can view own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to create appointments
CREATE POLICY "Users can create appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all appointments
CREATE POLICY "Admins can view all appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow admins to manage all appointments
CREATE POLICY "Admins can manage all appointments"
ON public.appointments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Ensure service role has access
CREATE POLICY "Service role has full access"
ON public.appointments
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');