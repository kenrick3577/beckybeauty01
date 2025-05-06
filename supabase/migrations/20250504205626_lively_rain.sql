/*
  # Reorganize RLS Policies for All Tables
  
  1. Changes
    - Drop all existing policies
    - Enable RLS on all tables
    - Create new policies for:
      - User registration and profile management
      - Appointment management
      - Order management
      - Service and product access
    
  2. Security
    - Admin has full access to all tables
    - Users can only access their own data
    - Public can view services and products
    - New users can register
*/

-- First ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'admin' OR
        auth.users.raw_app_meta_data->>'is_admin' = 'true'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users Table Policies
CREATE POLICY "Enable public registration"
ON users FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable users to read own profile"
ON users FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  is_admin() OR
  auth.jwt()->>'role' = 'service_role'
);

CREATE POLICY "Enable users to update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable admin full access to users"
ON users FOR ALL
TO authenticated
USING (is_admin() OR auth.jwt()->>'role' = 'service_role')
WITH CHECK (is_admin() OR auth.jwt()->>'role' = 'service_role');

-- Appointments Table Policies
CREATE POLICY "Enable users to manage own appointments"
ON appointments FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  is_admin() OR
  auth.jwt()->>'role' = 'service_role'
)
WITH CHECK (
  user_id = auth.uid() OR
  is_admin() OR
  auth.jwt()->>'role' = 'service_role'
);

-- Services Table Policies
CREATE POLICY "Enable public to view services"
ON services FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable admin to manage services"
ON services FOR ALL
TO authenticated
USING (is_admin() OR auth.jwt()->>'role' = 'service_role')
WITH CHECK (is_admin() OR auth.jwt()->>'role' = 'service_role');

-- Products Table Policies
CREATE POLICY "Enable public to view products"
ON products FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable admin to manage products"
ON products FOR ALL
TO authenticated
USING (is_admin() OR auth.jwt()->>'role' = 'service_role')
WITH CHECK (is_admin() OR auth.jwt()->>'role' = 'service_role');

-- Orders Table Policies
CREATE POLICY "Enable users to manage own orders"
ON orders FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  is_admin() OR
  auth.jwt()->>'role' = 'service_role'
)
WITH CHECK (
  user_id = auth.uid() OR
  is_admin() OR
  auth.jwt()->>'role' = 'service_role'
);

-- Order Items Table Policies
CREATE POLICY "Enable users to manage own order items"
ON order_items FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND (
      orders.user_id = auth.uid() OR
      is_admin() OR
      auth.jwt()->>'role' = 'service_role'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND (
      orders.user_id = auth.uid() OR
      is_admin() OR
      auth.jwt()->>'role' = 'service_role'
    )
  )
);

-- Update admin metadata
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'iceiceiceiceice5@gmail.com';

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'
)
WHERE email = 'iceiceiceiceice5@gmail.com';

-- Update users table admin role
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceiceice5@gmail.com'
AND id IS NOT NULL;