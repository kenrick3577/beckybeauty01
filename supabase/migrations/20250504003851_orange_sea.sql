/*
  # Add User Tracking Fields
  
  1. New Columns
    - last_login: Track when users last logged in
    - login_count: Track number of times users have logged in
    - account_status: Track if account is active/inactive
    - account_type: Track user subscription level
    - metadata: Store additional user metadata as JSONB
  
  2. Security
    - Maintain existing RLS policies
    - Add default values for new columns
*/

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login timestamptz,
ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'inactive')),
ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'basic' CHECK (account_type IN ('basic', 'premium', 'enterprise')),
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Update existing users to have default values
UPDATE users SET
  account_status = 'active',
  account_type = 'basic',
  login_count = 0
WHERE account_status IS NULL;