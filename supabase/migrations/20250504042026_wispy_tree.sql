/*
  # Update users table RLS policies

  1. Changes
    - Enable RLS on users table (if not already enabled)
    - Add policies for:
      - Users can read their own profile
      - Users can update their own profile
      - Admins can read and manage all profiles
      - Service role has full access
      - Public can insert during registration

  2. Security
    - Ensures users can only access their own data
    - Admins maintain full access
    - Service role bypasses RLS
    - Maintains existing registration flow
*/

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "enable_insert_for_registration" ON users;
    DROP POLICY IF EXISTS "enable_select_for_users" ON users;
    DROP POLICY IF EXISTS "enable_update_for_users" ON users;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create new policies
CREATE POLICY "Users can read own profile"
    ON users
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id 
        OR (
            EXISTS (
                SELECT 1 FROM users u 
                WHERE u.id = auth.uid() 
                AND u.role = 'admin'
            )
        )
        OR (auth.jwt()->>'role' = 'service_role')
    );

CREATE POLICY "Users can update own profile"
    ON users
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id 
        OR (
            EXISTS (
                SELECT 1 FROM users u 
                WHERE u.id = auth.uid() 
                AND u.role = 'admin'
            )
        )
        OR (auth.jwt()->>'role' = 'service_role')
    )
    WITH CHECK (
        auth.uid() = id 
        OR (
            EXISTS (
                SELECT 1 FROM users u 
                WHERE u.id = auth.uid() 
                AND u.role = 'admin'
            )
        )
        OR (auth.jwt()->>'role' = 'service_role')
    );

CREATE POLICY "Allow registration insert"
    ON users
    FOR INSERT
    TO public
    WITH CHECK (auth.uid() = id);

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS users_id_idx ON users(id);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);