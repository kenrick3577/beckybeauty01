/*
  # Ensure Admin Account Exists
  
  1. Changes
    - Check if the admin user with specified email exists
    - If exists, ensure it has admin role
    - If not, this doesn't create a new account (must register through normal flow)
  
  2. Security
    - Only affects the specific admin email
    - Maintains existing security model
*/

-- Make sure the user with this email is set as admin
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceiceice5@gmail.com'
AND id IS NOT NULL;

-- If the user doesn't exist yet, this won't do anything
-- They'll need to register through the normal flow first