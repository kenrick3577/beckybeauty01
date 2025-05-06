/*
  # Fix admin update policy and set admin user
  
  1. Changes
    - Drop the admin update policy if it exists to avoid conflicts
    - Recreate the policy to allow admins to update any user
    - Set specific user email as admin
  
  2. Security
    - Maintains proper admin permissions
    - Ensures specific user has admin access
*/

-- Drop the policy if it exists to avoid the "already exists" error
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;

-- Create a policy that allows admins to update any user's data
CREATE POLICY "Admins can update any user"
ON public.users
FOR UPDATE
TO authenticated
USING (
  (SELECT users_1.role FROM users users_1 WHERE users_1.id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT users_1.role FROM users users_1 WHERE users_1.id = auth.uid()) = 'admin'
);

-- Update specific admin users
UPDATE users
SET role = 'admin'
WHERE email IN ('iceiceiceiceice5@gmail.com') 
AND id IS NOT NULL;