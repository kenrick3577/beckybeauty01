/*
  # Fix Appointment Policies for Admin Access
  
  1. Changes
    - Drop existing appointment policies
    - Create new policies that properly handle admin access
    - Ensure proper data access for appointments table
    
  2. Security
    - Maintains RLS protection
    - Allows admins to view all appointments
    - Preserves user data privacy
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON public.appointments;

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create new policies
-- Allow users to view their own appointments
CREATE POLICY "Users can view their own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Allow users to create appointments
CREATE POLICY "Users can create appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Allow admins to view all appointments
CREATE POLICY "Admins can view all appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Allow admins to manage appointments
CREATE POLICY "Admins can manage appointments"
ON public.appointments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);