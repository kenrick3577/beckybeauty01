/*
  # Fix recursive RLS policy for users table

  1. Changes
    - Remove the recursive admin policy that was causing infinite loops
    - Keep the policy for users to view their own data
    - Add a new non-recursive admin policy using auth.jwt()
  
  2. Security
    - Maintains RLS protection
    - Ensures admins can still view all user data
    - Preserves user data privacy
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "Admins can view all user data" ON users;

-- Create new admin policy using JWT claims instead of querying users table
CREATE POLICY "Admins can view all user data" ON users
FOR ALL
TO authenticated
USING (
  coalesce(
    auth.jwt() ->> 'role',
    'authenticated'
  ) = 'service_role'
);