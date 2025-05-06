/*
  # Fix Admin Access and Financial Data Issues
  
  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies for proper admin access
    - Add created_at column to order_items if missing
    - Add necessary indexes for performance
    
  2. Security
    - Maintain RLS protection
    - Ensure admins can access all user data
    - Preserve user data privacy
*/

-- First ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;
END
$$;

-- Create new policies
CREATE POLICY "Enable registration"
ON users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id OR
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);

-- Add created_at to order_items if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE order_items ADD COLUMN created_at timestamptz DEFAULT now();
    
    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS order_items_created_at_idx ON order_items(created_at);
    
    -- Backfill created_at from orders table
    UPDATE order_items
    SET created_at = orders.created_at
    FROM orders
    WHERE order_items.order_id = orders.id
    AND order_items.created_at IS NULL;
  END IF;
END $$;

-- Update admin metadata
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'iceiceiceiceice5@gmail.com';

-- Update users table admin role
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceiceice5@gmail.com'
AND id IS NOT NULL;