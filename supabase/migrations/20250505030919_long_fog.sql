/*
  # Add image_url column to services table
  
  1. Changes
    - Add image_url column to services table
    - Set default value to placeholder image
    - Make column nullable
*/

-- Add image_url column if it doesn't exist
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS image_url text DEFAULT 'https://images.pexels.com/photos/3738339/pexels-photo-3738339.jpeg?auto=compress&cs=tinysrgb&w=1600';

-- Update existing services to have the default image if image_url is null
UPDATE services 
SET image_url = 'https://images.pexels.com/photos/3738339/pexels-photo-3738339.jpeg?auto=compress&cs=tinysrgb&w=1600'
WHERE image_url IS NULL;