/*
  # Fix recursive policies for users table

  1. Changes
    - Drop existing policies that may cause recursion
    - Create new, simplified policies that prevent recursion
    - Maintain security while avoiding policy loops
    
  2. Security
    - Maintain RLS enabled
    - Allow users to manage their own data
    - Allow admins to manage all user data
    - Allow public registration
*/

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow registration" ON users;
DROP POLICY IF EXISTS "Allow users to read own data" ON users;
DROP POLICY IF EXISTS "Allow users to update own data" ON users;

-- Create new, simplified policies
CREATE POLICY "Enable read access for authenticated users"
ON users FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (
      au.raw_app_meta_data->>'role' = 'admin' OR 
      au.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
);

CREATE POLICY "Enable insert for registration"
ON users FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add separate policy for admin access
CREATE POLICY "Enable admin access"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (
      au.raw_app_meta_data->>'role' = 'admin' OR 
      au.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
);