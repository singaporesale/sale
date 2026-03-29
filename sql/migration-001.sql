-- Migration: condition optional, draft status, categories setting
-- Run this in the Supabase SQL Editor

-- 1. Condition: remove default, clear existing values
ALTER TABLE items ALTER COLUMN condition DROP DEFAULT;
UPDATE items SET condition = NULL;

-- 2. Draft status: update check constraint
ALTER TABLE items DROP CONSTRAINT items_status_check;
ALTER TABLE items ADD CONSTRAINT items_status_check CHECK (status IN ('available', 'sold', 'reserved', 'draft'));

-- 3. Categories setting (seed from current list)
INSERT INTO site_settings (key, value) VALUES
  ('categories', '["Furniture","Electronics","Kitchen","Bedroom","Living Room","Bathroom","Books","Clothing","Sports","Kids","Decor","Other"]')
ON CONFLICT (key) DO NOTHING;
