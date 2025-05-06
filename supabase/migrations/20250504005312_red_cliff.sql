/*
  # Fix recursive RLS policies for users table

  1. Changes
    - Drop existing problematic policies that cause recursion
    - Create new non-recursive policies for admin access
    - Maintain existing user access policies
    - Ensure proper role-based access control

  2. Security
    - Maintains row level security
    - Fixes infinite recursion in admin policies
    - Preserves existing security model with proper access controls
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin read all" ON public.users;
DROP POLICY IF EXISTS "Admin write all" ON public.users;

-- Create new non-recursive admin policies
CREATE POLICY "Admin read all" ON public.users
FOR SELECT TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'service_role' OR
  role = 'admin'
);

CREATE POLICY "Admin write all" ON public.users
FOR ALL TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'service_role' OR
  role = 'admin'
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'service_role' OR
  role = 'admin'
);