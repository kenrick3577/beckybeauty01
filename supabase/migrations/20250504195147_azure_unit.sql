-- First ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
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

-- Users table policies
CREATE POLICY "Enable registration"
ON public.users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_app_meta_data->>'role' = 'admin' OR
      au.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
);

CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin access"
ON public.users
FOR ALL
TO authenticated
USING (
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_app_meta_data->>'role' = 'admin' OR
      au.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
);

-- Appointments table policies
CREATE POLICY "Users can manage own appointments"
ON public.appointments
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_app_meta_data->>'role' = 'admin' OR
      au.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_app_meta_data->>'role' = 'admin' OR
      au.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
);

-- Services table policies (publicly viewable)
CREATE POLICY "Public can view services"
ON public.services
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin can manage services"
ON public.services
FOR ALL
TO authenticated
USING (
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_app_meta_data->>'role' = 'admin' OR
      au.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
);

-- Products table policies (publicly viewable)
CREATE POLICY "Public can view products"
ON public.products
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin can manage products"
ON public.products
FOR ALL
TO authenticated
USING (
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_app_meta_data->>'role' = 'admin' OR
      au.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
);

-- Orders table policies
CREATE POLICY "Users can manage own orders"
ON public.orders
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_app_meta_data->>'role' = 'admin' OR
      au.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_app_meta_data->>'role' = 'admin' OR
      au.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
);

-- Order items table policies
CREATE POLICY "Users can manage own order items"
ON public.order_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND (
      orders.user_id = auth.uid() OR
      auth.jwt()->>'role' = 'service_role' OR
      EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid()
        AND (
          au.raw_app_meta_data->>'role' = 'admin' OR
          au.raw_app_meta_data->>'is_admin' = 'true'
        )
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND (
      orders.user_id = auth.uid() OR
      auth.jwt()->>'role' = 'service_role' OR
      EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid()
        AND (
          au.raw_app_meta_data->>'role' = 'admin' OR
          au.raw_app_meta_data->>'is_admin' = 'true'
        )
      )
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