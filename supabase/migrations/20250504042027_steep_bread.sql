/*
  # Fix recursive policies for users table

  1. Changes
    - Drop existing policies that may cause recursion
    - Create new, simplified policies that avoid recursion by using auth.uid() directly
    - Ensure policies maintain security while preventing infinite loops
    
  2. Security
    - Maintain row-level security
    - Users can only access their own data
    - Admins can access all data
    - Service role has full access
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "enable_insert_for_registration" ON "public"."users";
DROP POLICY IF EXISTS "enable_select_for_users" ON "public"."users";
DROP POLICY IF EXISTS "enable_update_for_users" ON "public"."users";

-- Create new, simplified policies
CREATE POLICY "Allow users to insert their own record"
ON "public"."users"
FOR INSERT 
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to view their own record"
ON "public"."users"
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND au.raw_app_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Allow users to update their own record"
ON "public"."users"
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR 
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND au.raw_app_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id OR 
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND au.raw_app_meta_data->>'role' = 'admin'
  )
);