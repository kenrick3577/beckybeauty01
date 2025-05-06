/*
  # Add insert policy for users table

  1. Changes
    - Add RLS policy to allow users to create their own profile during signup
    - Policy ensures users can only insert rows where their auth.uid matches the id column

  2. Security
    - Policy is restricted to INSERT operations only
    - Users can only create their own profile (auth.uid must match id)
    - Maintains existing policies for other operations
*/

-- Add policy to allow users to create their own profile during signup
CREATE POLICY "Users can create their own profile" 
ON public.users
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);