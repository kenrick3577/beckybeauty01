/*
  # Update Services for Eyelash Studio
  
  1. Changes
    - Clear existing services
    - Add new eyelash-specific services
    - Update default images to eyelash-related ones
    
  2. Data
    - Classic Lash Extensions
    - Volume Lash Extensions
    - Mega Volume Lash Extensions
    - Lash Lift & Tint
    - Lash Removal
*/

-- First, remove existing services
DELETE FROM services;

-- Insert new eyelash services
INSERT INTO services (name, description, duration, price, image_url)
VALUES
  (
    'Classic Lash Extensions',
    'One-by-one lash extension application for a natural, enhanced look. Perfect for first-time clients and those seeking subtle enhancement.',
    120,
    89.99,
    'https://images.pexels.com/photos/3738339/pexels-photo-3738339.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ),
  (
    'Volume Lash Extensions',
    'Multiple lightweight extensions per natural lash creating a fuller, more dramatic appearance. Ideal for those wanting more volume.',
    150,
    129.99,
    'https://images.pexels.com/photos/3738333/pexels-photo-3738333.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ),
  (
    'Mega Volume Lash Extensions',
    'Maximum volume and drama with multiple ultra-fine extensions per natural lash. Perfect for special occasions or those desiring maximum impact.',
    180,
    169.99,
    'https://images.pexels.com/photos/3738366/pexels-photo-3738366.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ),
  (
    'Lash Lift & Tint',
    'Natural lash enhancement using a lifting technique and tint to create the appearance of longer, darker lashes without extensions.',
    60,
    69.99,
    'https://images.pexels.com/photos/3738375/pexels-photo-3738375.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ),
  (
    'Lash Removal',
    'Professional and safe removal of eyelash extensions using specialized products to protect natural lashes.',
    30,
    29.99,
    'https://images.pexels.com/photos/3738374/pexels-photo-3738374.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ),
  (
    'Lash Fill - 2 Weeks',
    'Maintenance service for existing lash extensions, recommended every 2-3 weeks to maintain fullness.',
    90,
    59.99,
    'https://images.pexels.com/photos/3738377/pexels-photo-3738377.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ),
  (
    'Hybrid Lash Extensions',
    'A perfect blend of classic and volume techniques for a textured, dimensional look.',
    135,
    149.99,
    'https://images.pexels.com/photos/3738380/pexels-photo-3738380.jpeg?auto=compress&cs=tinysrgb&w=1600'
  );