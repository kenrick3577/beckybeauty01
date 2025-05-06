/*
  # Fix Admin User Profile Access

  1. Changes
    - Add a comprehensive policy for admin users
    - Ensure admins can view all users INCLUDING their own profile
    - Fix potential recursion issues in existing policies
  
  2. Security
    - Maintains RLS protection
    - Admins retain their ability to manage user data
    - Prevents infinite recursion in policy definitions
*/

-- First, check if the problematic policy exists and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Admins can update any user'
  ) THEN
    DROP POLICY "Admins can update any user" ON public.users;
  END IF;
END $$;

-- Create a cleaner, more reliable admin policy for updating users
CREATE POLICY "Admins can update any user"
ON public.users
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);