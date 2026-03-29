-- Singapore Relocation Sale — Database Schema
-- Applied via Supabase Management API

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  category TEXT NOT NULL,
  condition TEXT,
  dimensions TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved', 'draft')),
  open_to_offers BOOLEAN DEFAULT FALSE,
  original_item_url TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default settings
INSERT INTO site_settings (key, value) VALUES
  ('flash_sale_active', 'false'),
  ('flash_sale_discount', '30'),
  ('sale_end_date', '2026-04-25'),
  ('sale_start_date', '2026-04-10'),
  ('site_title', 'Whole Household Relocation Sale'),
  ('address', 'Your Address Here, Singapore'),
  ('address_maps_url', 'https://maps.google.com/?q=YOUR+ADDRESS'),
  ('whatsapp_number', '6587899064'),
  ('categories', '["Furniture","Electronics","Kitchen","Bedroom","Living Room","Bathroom","Books","Clothing","Sports","Kids","Decor","Other"]')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: items
CREATE POLICY "Public read items" ON items FOR SELECT USING (true);
CREATE POLICY "Authenticated insert items" ON items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update items" ON items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete items" ON items FOR DELETE TO authenticated USING (true);

-- RLS Policies: site_settings
CREATE POLICY "Public read settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated update settings" ON site_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Storage Policies: photos bucket
CREATE POLICY "Public photo read" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Authenticated photo upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos');
CREATE POLICY "Authenticated photo delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos');

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE site_settings;
