import { store } from './store.js';
import { fetchItems, fetchSettings, subscribeItems, subscribeSettings } from './api.js';
import { renderFilterBar, renderItemGrid, renderItemModal, renderFlashBanner, renderHero, renderCategorySidebar, getEffectivePrice, getSavingsPercent } from './components.js';
import { initCountdown } from './countdown.js';

// --- Filter Logic ---

function applyFilters() {
  let items = store.get('items');
  const f = store.get('filters');
  const settings = store.get('settings');

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

// --- Top Bar Countdown ---

function initTopBarCountdown() {
  const settings = store.get('settings');
  if (settings.sale_end_date) {
    const el = document.getElementById('topbar-countdown');
    if (el) initCountdown(settings.sale_end_date, el, true);
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
    if (payload.eventType === 'UPDATE') {
      const settings = store.get('settings');
      store.set('settings', { ...settings, [payload.new.key]: payload.new.value });
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

    sessionStorage.setItem('sg-sale-items', JSON.stringify(items));
    sessionStorage.setItem('sg-sale-settings', JSON.stringify(settings));

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
        <p class="grid-empty-sub">${err.message}</p>
      </div>
    `;
  }
}

// --- Events ---

window.addEventListener('hashchange', handleRoute);
document.addEventListener('DOMContentLoaded', init);
