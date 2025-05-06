/*
  # Initial Schema Setup for Becky Beauty Salon

  1. New Tables
     - `users`: Store user information
     - `services`: Available beauty services
     - `appointments`: Customer appointments
     - `products`: Beauty products for shop
     - `orders`: Customer orders
     - `order_items`: Items within orders

  2. Security
     - Enable RLS on all tables
     - Add policies for authenticated users
*/

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  mobile text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  duration integer NOT NULL,
  price decimal NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price decimal NOT NULL,
  image_url text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  total decimal NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL,
  price decimal NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- User Policies
CREATE POLICY "Users can view their own data" 
  ON users FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all user data" 
  ON users FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Services Policies (publicly viewable)
CREATE POLICY "Anyone can view services" 
  ON services FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "Admins can manage services" 
  ON services FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Appointments Policies
CREATE POLICY "Users can view their own appointments" 
  ON appointments FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create appointments" 
  ON appointments FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all appointments" 
  ON appointments FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage appointments" 
  ON appointments FOR UPDATE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Products Policies (publicly viewable)
CREATE POLICY "Anyone can view products" 
  ON products FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "Admins can manage products" 
  ON products FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Orders Policies
CREATE POLICY "Users can view their own orders" 
  ON orders FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" 
  ON orders FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" 
  ON orders FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Order Items Policies
CREATE POLICY "Users can view their own order items" 
  ON order_items FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can create order items" 
  ON order_items FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all order items" 
  ON order_items FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));