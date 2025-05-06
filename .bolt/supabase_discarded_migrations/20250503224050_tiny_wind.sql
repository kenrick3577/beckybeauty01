/*
  # Set up iceiceiceice@msn.com as admin user
  
  1. Changes
    - Promotes the user with email iceiceiceice@msn.com to admin role
    - Ensures proper admin privileges for this account
  
  2. Security
    - Only updates the specific user
    - Maintains existing RLS policies
*/

-- Update the user with email iceiceiceice@msn.com to be an admin
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceice@msn.com';

-- If the user doesn't exist yet, we won't create them - they need to sign up through the normal flow first
-- The update will only apply if the user exists