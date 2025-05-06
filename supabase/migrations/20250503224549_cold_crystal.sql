/*
  # Fix admin user update policy

  1. Changes
    - Add a policy that allows admins to update any user data
    - This policy is required to let admin users edit other users' profiles
  
  2. Security
    - Only users with admin role can update other users' information
    - Regular users can still only update their own data
*/

-- Create a policy that allows admins to update any user's data
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