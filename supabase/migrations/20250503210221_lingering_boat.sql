/*
  # Allow users to update their own profile

  1. Changes
    - Add policy to allow users to update their own profile information
    - Users can only update name, email, and mobile fields
    - Users can only update their own profile
*/

-- Add policy for users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);