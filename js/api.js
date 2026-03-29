import { sb } from './supabase-client.js';

// --- Items ---

export async function fetchItems() {
  const { data, error } = await sb
    .from('items')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchItem(id) {
  const { data, error } = await sb
    .from('items')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createItem(item) {
  const { data, error } = await sb
    .from('items')
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(id, updates) {
  const { data, error } = await sb
    .from('items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItem(id) {
  const { error } = await sb
    .from('items')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --- Settings ---

export async function fetchSettings() {
  const { data, error } = await sb
    .from('site_settings')
    .select('*');
  if (error) throw error;
  const map = {};
  for (const row of data) {
    map[row.key] = row.value;
  }
  return map;
}

export async function updateSetting(key, value) {
  const { error } = await sb
    .from('site_settings')
    .upsert({ key, value: String(value) }, { onConflict: 'key' });
  if (error) throw error;
}

export async function updateSettings(settingsMap) {
  const promises = Object.entries(settingsMap).map(([key, value]) =>
    updateSetting(key, value)
  );
  await Promise.all(promises);
}

// --- Storage ---

export async function uploadPhoto(itemId, file, index) {
  const path = `items/${itemId}/${Date.now()}-${index}.webp`;
  const { error } = await sb.storage
    .from('photos')
    .upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type || 'image/webp',
      upsert: false,
    });
  if (error) throw error;
  const { data } = sb.storage.from('photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function deletePhoto(url) {
  const match = url.match(/\/photos\/(.+)$/);
  if (!match) return;
  const path = decodeURIComponent(match[1]);
  const { error } = await sb.storage.from('photos').remove([path]);
  if (error) throw error;
}

// --- Auth ---

export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

// --- Realtime ---

export function subscribeItems(callback) {
  return sb
    .channel('public-items')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, callback)
    .subscribe();
}

export function subscribeSettings(callback) {
  return sb
    .channel('public-settings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, callback)
    .subscribe();
}
