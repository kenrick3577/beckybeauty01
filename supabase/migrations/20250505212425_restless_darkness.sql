/*
  # Fix RLS policies and functions with proper dependency handling
  
  1. Changes
    - Drop functions with CASCADE to handle dependencies
    - Recreate functions and policies in correct order
    - Fix policy naming and consistency
    
  2. Security
    - Maintain proper access control
    - Fix admin role handling
    - Preserve existing security model
*/

-- Drop existing functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.get_user_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile(uuid, text, text, text, text) CASCADE;

-- Disable RLS temporarily on all tables to avoid conflicts
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
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

-- Create or replace the is_admin function for consistent admin detection
CREATE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    -- Check if user has admin role in users table
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Check if user has admin role in JWT claims
    (auth.jwt() ->> 'role')::text = 'service_role'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user profile
CREATE FUNCTION public.get_user_profile(user_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_data json;
BEGIN
  SELECT json_build_object(
    'id', u.id,
    'name', u.name,
    'email', u.email,
    'mobile', u.mobile,
    'role', u.role,
    'created_at', u.created_at,
    'last_login', u.last_login,
    'login_count', u.login_count,
    'account_status', u.account_status,
    'account_type', u.account_type
  ) INTO profile_data
  FROM users u
  WHERE u.id = user_id;
  
  RETURN profile_data;
END;
$$;

-- Create a function to create user profile
CREATE FUNCTION public.create_user_profile(
  user_id uuid,
  user_email text,
  user_name text,
  user_mobile text,
  user_role text DEFAULT 'user'
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User already exists'
    );
  END IF;

  -- Insert new user
  INSERT INTO users (
    id,
    email,
    name,
    mobile,
    role,
    created_at,
    account_status,
    account_type
  ) VALUES (
    user_id,
    user_email,
    user_name,
    user_mobile,
    user_role,
    now(),
    'active',
    'basic'
  );

  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'User profile created successfully'
  );
END;
$$;

-- Re-enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create new policies for users table
CREATE POLICY "Enable public registration"
ON public.users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can read all users"
ON public.users
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admin can update all users"
ON public.users
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (is_admin());

-- Create policies for appointments table
CREATE POLICY "Users can view their own appointments"
ON public.appointments
FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Users can make appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR is_admin() OR (auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Users can update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR is_admin() OR (auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK (user_id = auth.uid() OR is_admin() OR (auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Users can delete appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR is_admin() OR (auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Enable admin full access to appointments"
ON public.appointments
FOR ALL
TO authenticated
USING (is_admin() OR (auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK (is_admin() OR (auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create policies for services table
CREATE POLICY "Enable public to view services"
ON public.services
FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable admin to manage services"
ON public.services
FOR ALL
TO authenticated
USING (is_admin() OR (auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK (is_admin() OR (auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create policies for products table
CREATE POLICY "Enable public to view products"
ON public.products
FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable admin to manage products"
ON public.products
FOR ALL
TO authenticated
USING (is_admin() OR (auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK (is_admin() OR (auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create policies for orders table
CREATE POLICY "Enable users to manage own orders"
ON public.orders
FOR ALL
TO authenticated
USING (user_id = auth.uid() OR is_admin() OR (auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK (user_id = auth.uid() OR is_admin() OR (auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create policies for order_items table
CREATE POLICY "Enable users to manage own order items"
ON public.order_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND (orders.user_id = auth.uid() OR is_admin() OR (auth.jwt() ->> 'role'::text) = 'service_role'::text)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND (orders.user_id = auth.uid() OR is_admin() OR (auth.jwt() ->> 'role'::text) = 'service_role'::text)
  )
);

-- Create policies for audit_logs table
CREATE POLICY "Only admins can read audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Update admin metadata for specific users
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