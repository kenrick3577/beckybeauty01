/*
  # Allow admin profile editing
  
  1. Changes
    - Add policy to allow admins to update their own profiles
    - Modify existing update policy to handle both admin and regular users
  
  2. Security
    - Maintains RLS security while allowing admins to edit their profiles
    - Preserves existing user permissions
*/

-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create new update policy that allows both regular users and admins to update their own profiles
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);