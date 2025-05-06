/*
  # Seed Initial Data for Becky Beauty Salon

  1. Data Population
     - Sample services
     - Sample products

  This migration adds initial data to make the application functional from the start.
*/

-- Insert Services
INSERT INTO services (name, description, duration, price)
VALUES
  ('Women''s Haircut & Style', 'A complete haircut and styling service customized to your preferences.', 60, 85),
  ('Men''s Haircut', 'A classic or modern haircut tailored to your style.', 30, 45),
  ('Hair Coloring', 'Full hair coloring service with premium products.', 120, 120),
  ('Highlights', 'Partial or full highlights to enhance your natural color.', 90, 100),
  ('Manicure', 'Classic manicure with cuticle care, shaping, and polish.', 45, 35),
  ('Pedicure', 'Relaxing pedicure with foot scrub, massage, and polish.', 60, 50),
  ('Facial Treatment', 'Deep cleansing facial customized for your skin type.', 60, 80),
  ('Makeup Application', 'Professional makeup application for any occasion.', 45, 65),
  ('Eyebrow Shaping', 'Professional eyebrow shaping to frame your face.', 15, 20),
  ('Full Body Massage', 'Relaxing massage to relieve stress and tension.', 60, 90)
ON CONFLICT DO NOTHING;

-- Insert Products
INSERT INTO products (name, description, price, image_url, stock)
VALUES
  ('Luxury Shampoo', 'Premium shampoo for all hair types.', 24.99, 'https://images.pexels.com/photos/3321416/pexels-photo-3321416.jpeg?auto=compress&cs=tinysrgb&w=1600', 50),
  ('Repairing Conditioner', 'Deep conditioning treatment for damaged hair.', 26.99, 'https://images.pexels.com/photos/3788293/pexels-photo-3788293.jpeg?auto=compress&cs=tinysrgb&w=1600', 45),
  ('Hydrating Face Mask', 'Intense hydration for dry or tired skin.', 19.99, 'https://images.pexels.com/photos/3619853/pexels-photo-3619853.jpeg?auto=compress&cs=tinysrgb&w=1600', 30),
  ('Anti-Aging Serum', 'Powerful serum to reduce fine lines and wrinkles.', 59.99, 'https://images.pexels.com/photos/5389859/pexels-photo-5389859.jpeg?auto=compress&cs=tinysrgb&w=1600', 25),
  ('Volumizing Hair Spray', 'Lightweight spray for added volume and hold.', 18.99, 'https://images.pexels.com/photos/4110343/pexels-photo-4110343.jpeg?auto=compress&cs=tinysrgb&w=1600', 40),
  ('Nail Polish Set', 'Set of 3 premium nail polishes in trendy colors.', 34.99, 'https://images.pexels.com/photos/5659034/pexels-photo-5659034.jpeg?auto=compress&cs=tinysrgb&w=1600', 20),
  ('Luxe Body Lotion', 'Rich and hydrating body lotion with natural oils.', 29.99, 'https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=1600', 35),
  ('Exfoliating Scrub', 'Gentle exfoliating scrub for smooth, radiant skin.', 22.99, 'https://images.pexels.com/photos/7262897/pexels-photo-7262897.jpeg?auto=compress&cs=tinysrgb&w=1600', 30),
  ('Hair Repair Mask', 'Intensive weekly treatment for damaged hair.', 32.99, 'https://images.pexels.com/photos/7262888/pexels-photo-7262888.jpeg?auto=compress&cs=tinysrgb&w=1600', 25),
  ('Aromatic Bath Bombs', 'Set of 4 luxurious bath bombs with essential oils.', 26.99, 'https://images.pexels.com/photos/3997993/pexels-photo-3997993.jpeg?auto=compress&cs=tinysrgb&w=1600', 15)
ON CONFLICT DO NOTHING;