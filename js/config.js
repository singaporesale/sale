export const SUPABASE_URL = 'https://ftbvdeinxehpjjkahjeg.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0YnZkZWlueGVocGpqa2FoamVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2ODU5MDMsImV4cCI6MjA5MDI2MTkwM30.uzOUmemrys8TJGmIa16ZHbqIZ0IJDdVK53Kz0r-PQ0Y';

export const DEFAULT_CATEGORIES = [
  'Furniture',
  'Electronics',
  'Kitchen',
  'Bedroom',
  'Living Room',
  'Bathroom',
  'Books',
  'Clothing',
  'Sports',
  'Kids',
  'Decor',
  'Other'
];

export const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

export const SORT_OPTIONS = [
  { value: 'sort_order', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'best_deal', label: 'Best Deals' },
];

export const MAX_PHOTOS_PER_ITEM = 10;
export const IMAGE_MAX_WIDTH = 1200;
export const THUMB_MAX_WIDTH = 400;

export const SETTINGS_SCHEMA = {
  site_title:          { type: 'text', label: 'Site Title' },
  topbar_text:         { type: 'text', label: 'Topbar Logo Text' },
  payment_text:        { type: 'text', label: 'Payment Note (topbar)' },
  hero_subtitle:       { type: 'text', label: 'Hero Subtitle' },
  hero_button_text:    { type: 'text', label: 'Hero Button Text' },
  announcement_text:   { type: 'textarea', label: 'Announcement Banner Text' },
  flash_sale_active:   { type: 'boolean', label: 'Flash Sale Active' },
  flash_sale_discount: { type: 'number', label: 'Flash Sale Discount %', min: 5, max: 50 },
  show_countdown:      { type: 'boolean', label: 'Show Countdown Timer & Dates' },
  sale_start_date:     { type: 'date', label: 'Sale Start Date' },
  sale_end_date:       { type: 'date', label: 'Sale End Date' },
  delivery_title:      { type: 'text', label: 'Delivery Section Title' },
  delivery_1_title:    { type: 'text', label: 'Delivery Option 1 — Title' },
  delivery_1_desc:     { type: 'text', label: 'Delivery Option 1 — Description' },
  delivery_2_title:    { type: 'text', label: 'Delivery Option 2 — Title' },
  delivery_2_desc:     { type: 'text', label: 'Delivery Option 2 — Description' },
  delivery_3_title:    { type: 'text', label: 'Delivery Option 3 — Title' },
  delivery_3_desc:     { type: 'text', label: 'Delivery Option 3 — Description' },
  delivery_note:       { type: 'text', label: 'Delivery Note (bold red)' },
  address:             { type: 'textarea', label: 'Pickup Address' },
  address_maps_url:    { type: 'url', label: 'Google Maps URL' },
  whatsapp_number:     { type: 'tel', label: 'WhatsApp Number (with country code)' },
  footer_text:         { type: 'text', label: 'Footer Title' },
  footer_sub:          { type: 'text', label: 'Footer Subtitle' },
};
