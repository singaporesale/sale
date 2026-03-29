import { store } from './store.js';
import { DEFAULT_CATEGORIES, SORT_OPTIONS } from './config.js';
import { createGallery } from './gallery.js';
import { initCountdown } from './countdown.js';
import { esc } from './utils.js';

// --- SVG Icons ---

export const ICONS = {
  search: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  whatsapp: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
  mapPin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  externalLink: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
  flash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z"/></svg>`,
  close: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
};

// --- Helpers ---

export function getCategories() {
  try {
    const raw = store.get('settings')?.categories;
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_CATEGORIES;
}

export function getEffectivePrice(item, settings) {
  if (settings.flash_sale_active === 'true' && settings.flash_sale_discount) {
    return Math.round(item.price * (1 - parseInt(settings.flash_sale_discount) / 100));
  }
  return Number(item.price);
}

export function getSavingsPercent(item, settings) {
  if (!item.original_price) return 0;
  const effective = getEffectivePrice(item, settings);
  return Math.round((1 - effective / item.original_price) * 100);
}

export function getWhatsAppUrl(item, settings) {
  const phone = settings.whatsapp_number || '';
  const effectivePrice = getEffectivePrice(item, settings);
  const itemUrl = `${window.location.origin}${window.location.pathname}#/item/${item.id}`;
  const photoUrl = (item.photo_urls && item.photo_urls.length > 0) ? item.photo_urls[0] : '';
  let message = `Hi! I'm interested in buying this item:\n\n`;
  message += `*${item.name}*\n`;
  message += `Price: S$${effectivePrice}\n`;
  if (item.open_to_offers) message += `(Open to offers)\n`;
  message += `\nItem link: ${itemUrl}`;
  if (photoUrl) message += `\nPhoto: ${photoUrl}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function formatPrice(amount) {
  return `S$${Number(amount).toLocaleString()}`;
}

// --- Category Sidebar ---

export function renderCategorySidebar(containerEl, onFilterChange) {
  const filters = store.get('filters');
  const items = store.get('items');

  const categoryCounts = {};
  let total = items.length;
  for (const item of items) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }

  containerEl.innerHTML = `
    <nav class="sidebar-categories">
      <h3 class="sidebar-title">Categories</h3>
      <ul class="cat-list">
        <li><button class="cat-link ${filters.category === 'all' ? 'active' : ''}" data-cat="all">All Items <span class="cat-count">${total}</span></button></li>
        ${getCategories().map(cat => {
          const count = categoryCounts[cat] || 0;
          if (count === 0) return '';
          return `<li><button class="cat-link ${filters.category === cat ? 'active' : ''}" data-cat="${cat}">${cat} <span class="cat-count">${count}</span></button></li>`;
        }).join('')}
      </ul>
    </nav>
  `;

  containerEl.querySelectorAll('.cat-link').forEach(btn => {
    btn.addEventListener('click', () => {
      store.update('filters', f => ({ ...f, category: btn.dataset.cat }));
      onFilterChange();
    });
  });
}

// --- Filter Bar (search + sort only, categories moved to sidebar) ---

export function renderFilterBar(containerEl, onFilterChange) {
  const filters = store.get('filters');

  containerEl.innerHTML = `
    <div class="filter-bar">
      <div class="search-box">
        <span class="search-icon">${ICONS.search}</span>
        <input type="search" class="search-input" placeholder="Search items..." value="${filters.search}" autocomplete="off">
      </div>
      <div class="filter-controls">
        <select class="sort-select" aria-label="Sort items">
          ${SORT_OPTIONS.map(opt => `<option value="${opt.value}" ${filters.sort === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
        </select>
        <label class="toggle-label">
          <input type="checkbox" class="toggle-available" ${filters.availableOnly ? 'checked' : ''}>
          <span>Available only</span>
        </label>
      </div>
      <!-- Mobile category pills -->
      <div class="category-pills-mobile" id="mobile-cat-pills"></div>
    </div>
  `;

  // Mobile category pills
  const items = store.get('items');
  const categoryCounts = {};
  for (const item of items) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }
  const pillsEl = containerEl.querySelector('#mobile-cat-pills');
  pillsEl.innerHTML = `
    <button class="pill ${filters.category === 'all' ? 'active' : ''}" data-cat="all">All</button>
    ${getCategories().map(cat => {
      if (!categoryCounts[cat]) return '';
      return `<button class="pill ${filters.category === cat ? 'active' : ''}" data-cat="${cat}">${cat}</button>`;
    }).join('')}
  `;

  // Event listeners
  let searchTimeout;
  const searchInput = containerEl.querySelector('.search-input');
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      store.update('filters', f => ({ ...f, search: searchInput.value }));
      onFilterChange();
    }, 250);
  });

  containerEl.querySelector('.sort-select').addEventListener('change', (e) => {
    store.update('filters', f => ({ ...f, sort: e.target.value }));
    onFilterChange();
  });

  containerEl.querySelector('.toggle-available').addEventListener('change', (e) => {
    store.update('filters', f => ({ ...f, availableOnly: e.target.checked }));
    onFilterChange();
  });

  pillsEl.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => {
      store.update('filters', f => ({ ...f, category: btn.dataset.cat }));
      onFilterChange();
    });
  });
}

// --- Item Card ---

export function renderItemCard(item) {
  const settings = store.get('settings');
  const effectivePrice = getEffectivePrice(item, settings);
  const savings = getSavingsPercent(item, settings);
  const isFlash = settings.flash_sale_active === 'true';
  const isSold = item.status === 'sold';
  const isReserved = item.status === 'reserved';
  const photoUrl = item.photo_urls && item.photo_urls.length > 0
    ? item.photo_urls[0]
    : null;

  const card = document.createElement('a');
  card.href = `#/item/${item.id}`;
  card.className = `item-card ${isSold ? 'item-sold' : ''} ${isReserved ? 'item-reserved' : ''}`;

  card.innerHTML = `
    <div class="card-img-wrap">
      ${photoUrl
        ? `<img src="${esc(photoUrl)}" alt="${esc(item.name)}" class="card-img" loading="lazy" decoding="async">`
        : `<div class="card-img-placeholder">No Photo</div>`
      }
      ${isSold ? '<div class="card-status-overlay sold-overlay"><span>SOLD</span></div>' : ''}
      ${isReserved ? '<div class="card-status-overlay reserved-overlay"><span>RESERVED</span></div>' : ''}
      ${isFlash && !isSold ? `<div class="card-flash-badge">${ICONS.flash} -${esc(settings.flash_sale_discount)}%</div>` : ''}
      ${item.photo_urls && item.photo_urls.length > 1 ? `<div class="card-photo-count">${item.photo_urls.length} photos</div>` : ''}
    </div>
    <div class="card-body">
      <span class="card-category">${esc(item.category)}</span>
      <h3 class="card-title">${esc(item.name)}</h3>
      ${item.brand ? `<p class="card-brand">${esc(item.brand)}</p>` : ''}
      <div class="card-price">
        ${item.original_price ? `<span class="price-original">${formatPrice(item.original_price)}</span>` : ''}
        ${isFlash && item.price !== effectivePrice ? `<span class="price-sale">${formatPrice(item.price)}</span>` : ''}
        <span class="price-current">${formatPrice(effectivePrice)}</span>
        ${savings > 0 ? `<span class="price-savings">-${savings}%</span>` : ''}
      </div>
      ${item.open_to_offers ? '<span class="badge-offer">Open to offers</span>' : ''}
      ${item.condition ? `<div class="card-meta">
        <span class="badge-condition badge-${esc(item.condition.toLowerCase().replace(/\s/g, '-'))}">${esc(item.condition)}</span>
      </div>` : ''}
    </div>
  `;

  return card;
}

// --- Item Grid ---

export function renderItemGrid(containerEl) {
  const filteredItems = store.get('filteredItems');
  const filters = store.get('filters');
  const loading = store.get('loading');

  if (loading) {
    containerEl.innerHTML = `
      <div class="grid-loading">
        <div class="spinner"></div>
        <p>Loading items...</p>
      </div>
    `;
    return;
  }

  if (filteredItems.length === 0) {
    containerEl.innerHTML = `
      <div class="grid-empty">
        <p>No items found</p>
        <p class="grid-empty-sub">Try adjusting your filters or search</p>
      </div>
    `;
    return;
  }

  // Group items by category
  const grouped = groupByCategory(filteredItems);
  const isSingleCategory = filters.category !== 'all';

  let html = `<div class="results-count">Showing ${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''}</div>`;

  for (const [category, categoryItems] of grouped) {
    if (!isSingleCategory) {
      html += `<div class="category-section-header"><h2 class="category-heading">${esc(category)}</h2><span class="category-item-count">${categoryItems.length}</span></div>`;
    }
    html += `<div class="item-grid" data-category="${esc(category)}"></div>`;
  }

  containerEl.innerHTML = html;

  // Append cards into each grid
  for (const [category, categoryItems] of grouped) {
    const grid = containerEl.querySelector(`.item-grid[data-category="${CSS.escape(category)}"]`);
    for (const item of categoryItems) {
      grid.appendChild(renderItemCard(item));
    }
  }
}

function groupByCategory(items) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.category)) map.set(item.category, []);
    map.get(item.category).push(item);
  }
  // Sort by defined category order
  const order = getCategories();
  const sorted = new Map();
  for (const cat of order) {
    if (map.has(cat)) sorted.set(cat, map.get(cat));
  }
  // Append any categories not in the defined order
  for (const [cat, items] of map) {
    if (!sorted.has(cat)) sorted.set(cat, items);
  }
  return sorted;
}

// --- Item Modal ---

export function renderItemModal(item) {
  if (!item) return;

  // Close any existing modal first
  const existingModal = document.querySelector('.modal-overlay');
  if (existingModal) existingModal.remove();

  const settings = store.get('settings');
  const effectivePrice = getEffectivePrice(item, settings);
  const savings = getSavingsPercent(item, settings);
  const isFlash = settings.flash_sale_active === 'true';
  const isSold = item.status === 'sold';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" aria-label="Close">${ICONS.close}</button>
      <div class="modal-gallery" id="modal-gallery"></div>
      <div class="modal-content">
        <span class="card-category">${esc(item.category)}</span>
        <h2 class="modal-title">${esc(item.name)}</h2>
        ${item.brand ? `<p class="modal-brand">${esc(item.brand)}</p>` : ''}

        ${isSold ? '<div class="modal-sold-badge">SOLD</div>' : ''}
        ${item.status === 'reserved' ? '<div class="modal-reserved-badge">RESERVED</div>' : ''}

        <div class="modal-price">
          ${item.original_price ? `<span class="price-original">${formatPrice(item.original_price)}</span>` : ''}
          ${isFlash && item.price !== effectivePrice ? `<span class="price-sale">${formatPrice(item.price)}</span>` : ''}
          <span class="price-current price-large">${formatPrice(effectivePrice)}</span>
          ${savings > 0 ? `<span class="price-savings-badge">Save ${savings}%</span>` : ''}
        </div>

        ${item.open_to_offers ? '<div class="modal-offer-badge">Open to offers</div>' : ''}

        ${item.description ? `<div class="modal-section"><h4>Description</h4><p>${esc(item.description)}</p></div>` : ''}
        ${item.dimensions ? `<div class="modal-section"><h4>Dimensions</h4><p>${esc(item.dimensions)}</p></div>` : ''}

        <div class="modal-details">
          ${item.condition ? `<div class="detail-row"><span class="detail-label">Condition</span><span class="badge-condition badge-${esc(item.condition.toLowerCase().replace(/\s/g, '-'))}">${esc(item.condition)}</span></div>` : ''}
          <div class="detail-row"><span class="detail-label">Status</span><span class="status-badge status-${esc(item.status)}">${esc(item.status.charAt(0).toUpperCase() + item.status.slice(1))}</span></div>
        </div>

        ${item.original_item_url ? `<a href="${esc(item.original_item_url)}" target="_blank" rel="noopener" class="original-link">View original listing ${ICONS.externalLink}</a>` : ''}

        ${!isSold ? `
          <a href="${getWhatsAppUrl(item, settings)}" target="_blank" rel="noopener" class="btn-whatsapp">
            ${ICONS.whatsapp}
            <span>${item.status === 'reserved' ? 'Ask about availability' : "I want to buy this — WhatsApp"}</span>
          </a>
        ` : '<div class="sold-message">This item has been sold</div>'}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Render gallery
  const galleryContainer = overlay.querySelector('#modal-gallery');
  const gallery = createGallery(item.photo_urls || [], galleryContainer);
  if (gallery) gallery.attachKeyboard();

  // Close handlers
  function close() {
    overlay.classList.add('modal-closing');
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
      if (gallery) gallery.destroy();
    }, 200);
    if (window.location.hash.startsWith('#/item/')) {
      history.pushState(null, '', window.location.pathname);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  }

  overlay.querySelector('.modal-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  function onKey(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', onKey);
    }
  }
  document.addEventListener('keydown', onKey);

  requestAnimationFrame(() => overlay.classList.add('modal-open'));

  return { close };
}

// --- Flash Sale Banner ---

export function renderFlashBanner(containerEl) {
  const settings = store.get('settings');
  if (settings.flash_sale_active !== 'true') {
    containerEl.innerHTML = '';
    containerEl.classList.remove('flash-active');
    return;
  }
  containerEl.classList.add('flash-active');
  containerEl.innerHTML = `
    <div class="flash-banner">
      ${ICONS.flash}
      <span>FLASH SALE — EXTRA ${esc(settings.flash_sale_discount)}% OFF EVERYTHING</span>
      ${ICONS.flash}
    </div>
  `;
}

// --- Hero ---

export function renderHero(containerEl) {
  const settings = store.get('settings');
  const isFlash = settings.flash_sale_active === 'true';

  containerEl.innerHTML = `
    <div class="hero">
      <div class="hero-content">
        <h1 class="hero-title">${esc(settings.site_title || 'Whole Household Relocation Sale')}</h1>
        <p class="hero-subtitle">${esc(settings.hero_subtitle || 'Everything must go — furniture, electronics, kitchen, decor & more')}</p>
        ${settings.show_countdown === 'true' && settings.sale_start_date && settings.sale_end_date ? `
          <p class="hero-dates">${esc(settings.sale_start_date)} — ${esc(settings.sale_end_date)}</p>
        ` : ''}
        ${settings.show_countdown === 'true' ? '<div class="hero-countdown" id="hero-countdown"></div>' : ''}
        ${isFlash ? `<div class="hero-flash">${ICONS.flash} EXTRA ${esc(settings.flash_sale_discount)}% OFF EVERYTHING ${ICONS.flash}</div>` : ''}
        ${settings.announcement_text ? `<p class="hero-announcement">${esc(settings.announcement_text)}</p>` : ''}
      </div>
    </div>
  `;

  if (settings.show_countdown === 'true' && settings.sale_end_date) {
    const countdownEl = containerEl.querySelector('#hero-countdown');
    initCountdown(settings.sale_end_date, countdownEl);
  }
}
