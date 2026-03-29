import { store } from './store.js';
import { fetchItems, fetchSettings, subscribeItems, subscribeSettings } from './api.js';
import { renderFilterBar, renderItemGrid, renderItemModal, renderFlashBanner, renderHero, renderCategorySidebar, getEffectivePrice, getSavingsPercent } from './components.js';
import { initCountdown } from './countdown.js';
import { esc } from './utils.js';

// --- Filter Logic ---

function applyFilters() {
  let items = store.get('items');
  const f = store.get('filters');
  const settings = store.get('settings');

  // Never show draft items on the public storefront
  items = items.filter(i => i.status !== 'draft');

  if (f.availableOnly) {
    items = items.filter(i => i.status === 'available');
  }

  if (f.category !== 'all') {
    items = items.filter(i => i.category === f.category);
  }

  if (f.search.trim()) {
    const terms = f.search.toLowerCase().split(/\s+/);
    items = items.filter(i => {
      const text = `${i.name} ${i.brand || ''} ${i.description || ''} ${i.category}`.toLowerCase();
      return terms.every(t => text.includes(t));
    });
  }

  // Sort: sold items always go to the end
  const available = items.filter(i => i.status !== 'sold');
  const sold = items.filter(i => i.status === 'sold');

  const sortFn = (a, b) => {
    switch (f.sort) {
      case 'price_asc': return getEffectivePrice(a, settings) - getEffectivePrice(b, settings);
      case 'price_desc': return getEffectivePrice(b, settings) - getEffectivePrice(a, settings);
      case 'newest': return new Date(b.created_at) - new Date(a.created_at);
      case 'best_deal': return getSavingsPercent(b, settings) - getSavingsPercent(a, settings);
      default: return (a.sort_order || 0) - (b.sort_order || 0);
    }
  };

  available.sort(sortFn);
  sold.sort(sortFn);

  store.set('filteredItems', [...available, ...sold]);
}

// --- Routing ---

function handleRoute() {
  const hash = location.hash.slice(1) || '/';

  if (hash.startsWith('/item/')) {
    const id = hash.replace('/item/', '');
    const items = store.get('items');
    const item = items.find(i => i.id === id);
    if (item) {
      renderItemModal(item);
    }
  }
}

// --- Render ---

function render() {
  const filterBar = document.getElementById('filter-bar');
  const gridContainer = document.getElementById('grid-container');
  const flashBanner = document.getElementById('flash-banner');
  const sidebar = document.getElementById('category-sidebar');

  renderFlashBanner(flashBanner);
  renderCategorySidebar(sidebar, onFilterChange);
  renderFilterBar(filterBar, onFilterChange);
  renderItemGrid(gridContainer);
}

function onFilterChange() {
  applyFilters();
  const gridContainer = document.getElementById('grid-container');
  const sidebar = document.getElementById('category-sidebar');
  renderItemGrid(gridContainer);
  renderCategorySidebar(sidebar, onFilterChange);
}

// --- Apply Text Settings to static HTML ---

function applyTextSettings() {
  const settings = store.get('settings');
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el && value) el.textContent = value;
  };
  const title = settings.topbar_text || settings.site_title;
  set('topbar-logo-text', title);
  set('topbar-paynow', settings.payment_text);
  set('delivery-title', settings.delivery_title);
  set('delivery-1-title', settings.delivery_1_title);
  set('delivery-1-desc', settings.delivery_1_desc);
  set('delivery-2-title', settings.delivery_2_title);
  set('delivery-2-desc', settings.delivery_2_desc);
  set('delivery-3-title', settings.delivery_3_title);
  set('delivery-3-desc', settings.delivery_3_desc);
  set('delivery-note', settings.delivery_note);
  set('footer-text', settings.footer_text);
  set('footer-sub', settings.footer_sub);
  // Update browser tab title
  if (settings.site_title) {
    document.title = settings.site_title;
  }
  // Update WhatsApp FAB
  const fab = document.getElementById('fab-whatsapp');
  if (fab && settings.whatsapp_number) {
    fab.href = `https://wa.me/${settings.whatsapp_number}`;
  }
  // Apply color theme
  document.body.classList.remove('theme-rose', 'theme-sage', 'theme-lavender', 'theme-warm');
  if (settings.theme) {
    document.body.classList.add(`theme-${settings.theme}`);
  }
}

// --- Top Bar Countdown ---

function initTopBarCountdown() {
  const settings = store.get('settings');
  const el = document.getElementById('topbar-countdown');
  if (!el) return;
  if (settings.show_countdown === 'true' && settings.sale_end_date) {
    initCountdown(settings.sale_end_date, el, true);
  } else {
    el.textContent = '';
  }
}

// --- Realtime ---

function setupRealtime() {
  subscribeItems((payload) => {
    let items = store.get('items');
    if (payload.eventType === 'INSERT') {
      // Deduplicate: don't add if already exists
      if (!items.find(i => i.id === payload.new.id)) {
        items = [...items, payload.new];
      }
    } else if (payload.eventType === 'UPDATE') {
      items = items.map(i => i.id === payload.new.id ? payload.new : i);
    } else if (payload.eventType === 'DELETE') {
      items = items.filter(i => i.id !== payload.old.id);
    }
    store.set('items', items);
    applyFilters();
    render();
  });

  subscribeSettings((payload) => {
    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
      const settings = store.get('settings');
      store.set('settings', { ...settings, [payload.new.key]: payload.new.value });
      applyTextSettings();
      renderHero(document.getElementById('hero'));
      applyFilters();
      render();
      initTopBarCountdown();
    }
  });
}

// --- Init ---

async function init() {
  try {
    // Fetch fresh data (skip cache to avoid stale duplicates)
    const [items, settings] = await Promise.all([fetchItems(), fetchSettings()]);

    store.set('settings', settings);
    store.set('items', items);
    store.set('loading', false);

    sessionStorage.setItem('sg-sale-settings', JSON.stringify(settings));

    applyTextSettings();
    renderHero(document.getElementById('hero'));
    initTopBarCountdown();
    applyFilters();
    render();
    handleRoute();
    setupRealtime();
  } catch (err) {
    console.error('Init error:', err);
    document.getElementById('grid-container').innerHTML = `
      <div class="grid-empty">
        <p>Failed to load items</p>
        <p class="grid-empty-sub">${esc(err.message)}</p>
      </div>
    `;
  }
}

// --- Events ---

window.addEventListener('hashchange', handleRoute);
document.addEventListener('DOMContentLoaded', init);
