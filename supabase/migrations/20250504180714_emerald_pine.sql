/*
  # Add created_at to order_items table
  
  1. Changes
    - Add created_at column to order_items table
    - Set default value to now()
    - Backfill existing records
    
  2. Performance
    - Add index on created_at for better query performance
*/

-- Add created_at column
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS order_items_created_at_idx ON order_items(created_at);

-- Backfill created_at for existing records
UPDATE order_items
SET created_at = orders.created_at
FROM orders
WHERE order_items.order_id = orders.id
AND order_items.created_at IS NULL;