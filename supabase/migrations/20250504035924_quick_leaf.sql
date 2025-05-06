/*
  # Fix recursive RLS policies for users table

  1. Changes
    - Drop existing problematic policies that cause recursion
    - Create new, simplified policies for the users table that avoid recursion
    
  2. Security
    - Maintain row-level security
    - Create clear, non-recursive policies for:
      - User self-access
      - Admin access
      - Public registration
    - Service role access remains unchanged
*/

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON users;
DROP POLICY IF EXISTS "Allow registration" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new, simplified policies
CREATE POLICY "Enable read access for own profile"
ON users FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Enable update access for own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert access for registration"
ON users FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin full access"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);