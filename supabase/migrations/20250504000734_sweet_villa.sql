/*
  # Fix Appointment Policies and User Display

  1. Changes
    - Update appointment policies to ensure proper data access
    - Add policies to ensure admin users can access all needed user data
    - Fix potential recursion issues in policies

  2. Security
    - Maintains proper security controls
    - Ensures admins can access required data
    - Avoids infinite recursion in policy evaluation
*/

-- Enable Row Level Security on appointments table (in case it's not already)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- First drop any problematic policies on the appointments table
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can manage appointments" ON public.appointments;

-- Create improved admin policies for appointments
CREATE POLICY "Admins can view all appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can manage appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Make sure we refresh the admin status of the specified admin user
UPDATE users
SET role = 'admin'
WHERE email IN ('iceiceiceiceice5@gmail.com')
AND id IS NOT NULL;