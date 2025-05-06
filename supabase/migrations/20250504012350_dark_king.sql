/*
  # Add User Table Indexes

  1. Changes
    - Add pg_trgm extension for text search capabilities
    - Create indexes for commonly searched fields
    - Add indexes for sorting operations
    - Create composite indexes for filtered queries
  
  2. Performance
    - Improves text search performance
    - Optimizes sorting operations
    - Enhances filtered query performance
*/

-- First create the required extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add btree indexes for exact matches and sorting
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);
CREATE INDEX IF NOT EXISTS users_last_login_idx ON users(last_login);
CREATE INDEX IF NOT EXISTS users_login_count_idx ON users(login_count);

-- Add composite btree indexes for filtered queries
CREATE INDEX IF NOT EXISTS users_role_status_idx ON users(role, account_status);
CREATE INDEX IF NOT EXISTS users_status_type_idx ON users(account_status, account_type);

-- Add trigram indexes for text search after extension is created
CREATE INDEX IF NOT EXISTS users_name_trgm_idx ON users USING gist(name gist_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON users USING gist(email gist_trgm_ops);
CREATE INDEX IF NOT EXISTS users_mobile_trgm_idx ON users USING gist(mobile gist_trgm_ops);