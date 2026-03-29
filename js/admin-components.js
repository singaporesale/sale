import { uploadPhoto, deletePhoto } from './api.js';
import { IMAGE_MAX_WIDTH, MAX_PHOTOS_PER_ITEM, SETTINGS_SCHEMA } from './config.js';
import { esc } from './utils.js';

// --- Alert ---

export function showAlert(container, message, type = 'success') {
  const existing = container.querySelector('.alert');
  if (existing) existing.remove();
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  container.prepend(alert);
  setTimeout(() => alert.remove(), 4000);
}

// --- Items List ---

export function renderItemsList(container, items, handlers, categoryOrder) {
  // Group items by category
  const grouped = new Map();
  for (const item of items) {
    if (!grouped.has(item.category)) grouped.set(item.category, []);
    grouped.get(item.category).push(item);
  }

  // Sort categories: defined order first, then any extras
  const orderedCategories = categoryOrder
    ? [...categoryOrder.filter(c => grouped.has(c)), ...[...grouped.keys()].filter(c => !categoryOrder.includes(c))]
    : [...grouped.keys()];

  let globalIndex = 0;

  let tablesHtml = '';
  let cardsHtml = '';

  for (const category of orderedCategories) {
    const catItems = grouped.get(category);
    // Desktop table per category
    tablesHtml += `
      <div class="admin-category-section">
        <div class="admin-category-header">
          <h3 class="admin-category-title">${esc(category)}</h3>
          <span class="admin-category-count">${catItems.length}</span>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width:36px"></th>
              <th>Photo</th>
              <th>Name</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody class="sortable-tbody" data-category="${esc(category)}">
            ${catItems.map(item => {
              const idx = globalIndex++;
              return `
              <tr data-id="${item.id}" data-index="${idx}" draggable="true">
                <td><span class="drag-handle" title="Drag to reorder">≡</span></td>
                <td>
                  ${item.photo_urls && item.photo_urls.length > 0
                    ? `<img src="${esc(item.photo_urls[0])}" alt="" class="table-img">`
                    : `<div class="table-img" style="display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--color-gray-light)">—</div>`
                  }
                </td>
                <td>${item.status === 'draft' ? '<span class="badge-draft">DRAFT</span> ' : ''}<span class="table-name">${esc(item.name)}</span></td>
                <td><strong>S$${Number(item.price).toLocaleString()}</strong></td>
                <td>
                  <select class="table-status-select" data-id="${item.id}">
                    <option value="draft" ${item.status === 'draft' ? 'selected' : ''}>Draft</option>
                    <option value="available" ${item.status === 'available' ? 'selected' : ''}>Available</option>
                    <option value="reserved" ${item.status === 'reserved' ? 'selected' : ''}>Reserved</option>
                    <option value="sold" ${item.status === 'sold' ? 'selected' : ''}>Sold</option>
                  </select>
                </td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-sm btn-outline btn-edit" data-id="${item.id}">Edit</button>
                    <button class="btn btn-sm btn-ghost btn-delete" data-id="${item.id}">Del</button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Mobile cards per category
    cardsHtml += `
      <div class="admin-category-section-mobile">
        <div class="admin-category-header">
          <h3 class="admin-category-title">${esc(category)}</h3>
          <span class="admin-category-count">${catItems.length}</span>
        </div>
        <div class="admin-item-cards-group sortable-cards" data-category="${esc(category)}">
          ${catItems.map(item => {
            return `
            <div class="admin-item-card" data-id="${item.id}" draggable="true">
              <span class="drag-handle-mobile" title="Drag to reorder">≡</span>
              ${item.photo_urls && item.photo_urls.length > 0
                ? `<img src="${esc(item.photo_urls[0])}" alt="" class="admin-item-card-img">`
                : `<div class="admin-item-card-img"></div>`
              }
              <div class="admin-item-card-body">
                <div class="admin-item-card-name">${item.status === 'draft' ? '<span class="badge-draft">DRAFT</span> ' : ''}${esc(item.name)}</div>
                <div class="admin-item-card-price">S$${Number(item.price).toLocaleString()}</div>
                <div class="admin-item-card-meta">${esc(item.status)}</div>
                <div class="admin-item-card-actions">
                  <button class="btn btn-sm btn-outline btn-edit" data-id="${item.id}">Edit</button>
                  <select class="table-status-select" data-id="${item.id}" style="font-size:12px;padding:4px 6px;">
                    <option value="available" ${item.status === 'available' ? 'selected' : ''}>Available</option>
                    <option value="reserved" ${item.status === 'reserved' ? 'selected' : ''}>Reserved</option>
                    <option value="sold" ${item.status === 'sold' ? 'selected' : ''}>Sold</option>
                  </select>
                  <button class="btn btn-sm btn-ghost btn-delete" data-id="${item.id}">Del</button>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="admin-header">
      <h2 class="admin-title">Items (${items.length})</h2>
      <div class="btn-group">
        <span class="drag-hint">Drag ≡ to reorder</span>
        <a href="#/items/new" class="btn btn-primary">+ Add Item</a>
      </div>
    </div>
    ${items.length === 0 ? '<div class="items-empty"><p>No items yet</p><p>Click "Add Item" to get started</p></div>' : `
      <div class="admin-tables-desktop">${tablesHtml}</div>
      <div class="admin-cards-mobile">${cardsHtml}</div>
    `}
  `;

  // Event listeners
  container.querySelectorAll('.table-status-select').forEach(select => {
    select.addEventListener('change', () => handlers.onStatusChange(select.dataset.id, select.value));
  });

  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => handlers.onEdit(btn.dataset.id));
  });

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => handlers.onDelete(btn.dataset.id));
  });

  // Drag-and-drop reorder per category section
  container.querySelectorAll('.sortable-tbody').forEach(tbody => {
    const cat = tbody.dataset.category;
    const catItems = grouped.get(cat);
    setupDragReorderList(tbody, 'tr', catItems, handlers.onReorder);
  });
  container.querySelectorAll('.sortable-cards').forEach(cardGroup => {
    const cat = cardGroup.dataset.category;
    const catItems = grouped.get(cat);
    setupDragReorderList(cardGroup, '.admin-item-card', catItems, handlers.onReorder);
  });
}

function setupDragReorderList(listEl, childSelector, catItems, onReorder) {
  if (!listEl || !onReorder) return;

  let dragEl = null;
  const children = () => Array.from(listEl.querySelectorAll(childSelector));

  children().forEach(el => {
    el.addEventListener('dragstart', (e) => {
      dragEl = el;
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });

    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      listEl.querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over'));
      dragEl = null;
    });

    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (el !== dragEl) el.classList.add('drag-over');
    });

    el.addEventListener('dragleave', () => {
      el.classList.remove('drag-over');
    });

    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drag-over');
      if (!dragEl || dragEl === el) return;

      // Get positions by DOM order
      const all = children();
      const fromIndex = all.indexOf(dragEl);
      const toIndex = all.indexOf(el);
      if (fromIndex === -1 || toIndex === -1) return;

      const reordered = [...catItems];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);

      const updates = reordered.map((item, i) => ({ id: item.id, sort_order: i }));
      onReorder(updates);
    });
  });
}

// --- Item Form ---

export function renderItemForm(container, item, opts) {
  const isNew = !item;
  const photos = item?.photo_urls || [];

  container.innerHTML = `
    <div class="admin-header">
      <h2 class="admin-title">${isNew ? 'Add New Item' : 'Edit Item'}</h2>
      <div class="btn-group">
        <button class="btn btn-outline" id="form-cancel">Cancel</button>
        ${!isNew ? '<button class="btn btn-danger" id="form-delete">Delete</button>' : ''}
      </div>
    </div>

    <form id="item-form" class="settings-form">
      <div class="form-group">
        <label for="item-name">Name *</label>
        <input type="text" id="item-name" required value="${esc(item?.name || '')}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="item-brand">Brand</label>
          <input type="text" id="item-brand" value="${esc(item?.brand || '')}">
        </div>
        <div class="form-group">
          <label for="item-category">Category *</label>
          <select id="item-category" required>
            ${opts.categories.map(c => `<option value="${c}" ${item?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="item-description">Description</label>
        <textarea id="item-description" rows="3">${esc(item?.description || '')}</textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="item-price">Sale Price (S$) *</label>
          <input type="number" id="item-price" required min="0" step="1" value="${item?.price || ''}">
        </div>
        <div class="form-group">
          <label for="item-original-price">Original Price (S$)</label>
          <input type="number" id="item-original-price" min="0" step="1" value="${item?.original_price || ''}">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="item-condition">Condition</label>
          <select id="item-condition">
            <option value="">— None —</option>
            ${opts.conditions.map(c => `<option value="${c}" ${item?.condition === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="item-dimensions">Dimensions</label>
          <input type="text" id="item-dimensions" placeholder="e.g. 120cm x 60cm x 75cm" value="${esc(item?.dimensions || '')}">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="item-status">Status</label>
          <select id="item-status">
            <option value="draft" ${item?.status === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="available" ${(!item || item?.status === 'available') ? 'selected' : ''}>Available</option>
            <option value="reserved" ${item?.status === 'reserved' ? 'selected' : ''}>Reserved</option>
            <option value="sold" ${item?.status === 'sold' ? 'selected' : ''}>Sold</option>
          </select>
        </div>
        <div class="form-group">
          <label for="item-sort">Sort Order</label>
          <input type="number" id="item-sort" value="${item?.sort_order || 0}" min="0">
        </div>
      </div>

      <div class="form-check">
        <input type="checkbox" id="item-offers" ${item?.open_to_offers ? 'checked' : ''}>
        <label for="item-offers">Open to offers</label>
      </div>

      <div class="form-group">
        <label for="item-url">Original Listing URL</label>
        <input type="url" id="item-url" placeholder="https://..." value="${esc(item?.original_item_url || '')}">
      </div>

      <!-- Photos -->
      <div class="form-group">
        <label>Photos (max ${MAX_PHOTOS_PER_ITEM})</label>
        <div class="upload-zone" id="upload-zone">
          <p class="upload-zone-text">
            <strong>Drop photos here</strong> or click to browse
          </p>
          <input type="file" id="photo-input" multiple accept="image/*" style="display:none">
        </div>
        <div id="upload-progress" class="upload-progress" style="display:none">
          <div class="upload-progress-bar" id="progress-bar"></div>
        </div>
        <div class="upload-previews" id="photo-previews">
          ${photos.map((url, i) => `
            <div class="upload-preview ${i === 0 ? 'primary' : ''}" data-url="${esc(url)}" data-index="${i}" draggable="true">
              <img src="${esc(url)}" alt="Photo ${i + 1}">
              <button class="upload-preview-remove" data-url="${esc(url)}" type="button">&times;</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="btn-group">
        <button type="submit" class="btn btn-primary">${item?.status === 'draft' ? 'Save Draft' : 'Save Item'}</button>
        ${item?.status === 'draft' ? '<button type="button" class="btn btn-primary" id="publish-item">Publish</button>' : ''}
        ${isNew ? '<button type="button" class="btn btn-outline" id="save-draft">Save as Draft</button>' : ''}
        ${isNew ? '<button type="button" class="btn btn-outline" id="save-add-another">Save & Add Another</button>' : ''}
      </div>
    </form>
  `;

  // Current photo URLs (mutable)
  let currentPhotos = [...photos];

  // Form submit
  const form = container.querySelector('#item-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = collectFormData();
    data.photo_urls = currentPhotos;
    await opts.onSave(data, item?.id);
  });

  // Save & Add Another
  const addAnother = container.querySelector('#save-add-another');
  if (addAnother) {
    addAnother.addEventListener('click', async () => {
      const data = collectFormData();
      data.photo_urls = currentPhotos;
      await opts.onSave(data, item?.id);
      location.hash = '/items/new';
    });
  }

  // Save as Draft (new items)
  const draftBtn = container.querySelector('#save-draft');
  if (draftBtn) {
    draftBtn.addEventListener('click', async () => {
      const data = collectFormData();
      data.photo_urls = currentPhotos;
      data.status = 'draft';
      await opts.onSave(data, item?.id);
    });
  }

  // Publish (draft items)
  const publishBtn = container.querySelector('#publish-item');
  if (publishBtn) {
    publishBtn.addEventListener('click', async () => {
      const data = collectFormData();
      data.photo_urls = currentPhotos;
      data.status = 'available';
      await opts.onSave(data, item?.id);
    });
  }

  // Cancel / Delete
  container.querySelector('#form-cancel').addEventListener('click', opts.onCancel);
  const delBtn = container.querySelector('#form-delete');
  if (delBtn && opts.onDelete) delBtn.addEventListener('click', opts.onDelete);

  // Photo upload
  const zone = container.querySelector('#upload-zone');
  const fileInput = container.querySelector('#photo-input');
  const previewsEl = container.querySelector('#photo-previews');
  const progressEl = container.querySelector('#upload-progress');
  const progressBar = container.querySelector('#progress-bar');

  zone.addEventListener('click', () => fileInput.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', () => handleFiles(fileInput.files));

  async function handleFiles(files) {
    if (!files.length) return;
    const remaining = MAX_PHOTOS_PER_ITEM - currentPhotos.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) {
      showAlert(container, `Maximum ${MAX_PHOTOS_PER_ITEM} photos allowed`, 'error');
      return;
    }

    // Need an item ID for the storage path
    let itemId = item?.id;
    if (!itemId) {
      // For new items, save first to get an ID
      const data = collectFormData();
      data.photo_urls = currentPhotos;
      try {
        const { createItem: create } = await import('./api.js');
        const created = await create(data);
        itemId = created.id;
        item = created;
        // Update URL to edit mode
        history.replaceState(null, '', `#/items/${itemId}`);
      } catch (err) {
        showAlert(container, 'Save item first: ' + err.message, 'error');
        return;
      }
    }

    progressEl.style.display = '';
    let completed = 0;

    for (const file of toUpload) {
      try {
        const resized = await resizeImage(file);
        const url = await uploadPhoto(itemId, resized, currentPhotos.length);
        currentPhotos.push(url);
        completed++;
        progressBar.style.width = `${(completed / toUpload.length) * 100}%`;
      } catch (err) {
        console.error('Upload error:', err);
        showAlert(container, 'Upload failed: ' + err.message, 'error');
      }
    }

    progressEl.style.display = 'none';
    progressBar.style.width = '0%';

    // Update item with new photo_urls
    try {
      const { updateItem: update } = await import('./api.js');
      await update(itemId, { photo_urls: currentPhotos });
    } catch (err) {
      console.error('Update photos error:', err);
    }

    renderPhotoPreviews();
    fileInput.value = '';
  }

  function renderPhotoPreviews() {
    previewsEl.innerHTML = currentPhotos.map((url, i) => `
      <div class="upload-preview ${i === 0 ? 'primary' : ''}" data-url="${esc(url)}" data-index="${i}" draggable="true">
        <img src="${esc(url)}" alt="Photo ${i + 1}">
        <button class="upload-preview-remove" data-url="${esc(url)}" type="button">&times;</button>
      </div>
    `).join('');

    // Remove buttons
    previewsEl.querySelectorAll('.upload-preview-remove').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const url = btn.dataset.url;
        try {
          await deletePhoto(url);
        } catch (err) {
          console.error('Delete photo error:', err);
        }
        currentPhotos = currentPhotos.filter(u => u !== url);
        renderPhotoPreviews();
      });
    });

    // Drag reorder
    setupDragReorder(previewsEl, currentPhotos, renderPhotoPreviews);
  }

  // Init photo previews event listeners
  if (photos.length > 0) renderPhotoPreviews();

  function collectFormData() {
    return {
      name: form.querySelector('#item-name').value.trim(),
      brand: form.querySelector('#item-brand').value.trim() || null,
      category: form.querySelector('#item-category').value,
      description: form.querySelector('#item-description').value.trim() || null,
      price: parseFloat(form.querySelector('#item-price').value),
      original_price: form.querySelector('#item-original-price').value ? parseFloat(form.querySelector('#item-original-price').value) : null,
      condition: form.querySelector('#item-condition').value || null,
      dimensions: form.querySelector('#item-dimensions').value.trim() || null,
      status: form.querySelector('#item-status').value,
      sort_order: parseInt(form.querySelector('#item-sort').value) || 0,
      open_to_offers: form.querySelector('#item-offers').checked,
      original_item_url: form.querySelector('#item-url').value.trim() || null,
    };
  }
}

// --- Settings Form ---

export function renderSettingsForm(container, settings, handlers) {
  container.innerHTML = `
    <div class="admin-header">
      <h2 class="admin-title">Site Settings</h2>
    </div>
    <form id="settings-form" class="settings-form">
      ${Object.entries(SETTINGS_SCHEMA).map(([key, schema]) => {
        const value = settings[key] || '';
        if (schema.type === 'boolean') {
          return `
            <div class="settings-row">
              <span class="settings-label">${schema.label}</span>
              <div class="settings-input">
                <label class="toggle-switch">
                  <input type="checkbox" name="${key}" ${value === 'true' ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          `;
        }
        if (schema.type === 'number') {
          return `
            <div class="settings-row">
              <span class="settings-label">${schema.label}</span>
              <div class="settings-input">
                <input type="number" name="${key}" value="${esc(value)}" min="${schema.min || 0}" max="${schema.max || 100}">
              </div>
            </div>
          `;
        }
        if (schema.type === 'textarea') {
          return `
            <div class="settings-row">
              <span class="settings-label">${schema.label}</span>
              <div class="settings-input">
                <textarea name="${key}" rows="2">${esc(value)}</textarea>
              </div>
            </div>
          `;
        }
        return `
          <div class="settings-row">
            <span class="settings-label">${schema.label}</span>
            <div class="settings-input">
              <input type="${schema.type === 'date' ? 'date' : schema.type || 'text'}" name="${key}" value="${esc(value)}">
            </div>
          </div>
        `;
      }).join('')}
      <div style="padding-top: 16px;">
        <button type="submit" class="btn btn-primary">Save Settings</button>
      </div>
    </form>
  `;

  const form = container.querySelector('#settings-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newSettings = {};
    for (const [key, schema] of Object.entries(SETTINGS_SCHEMA)) {
      const el = form.querySelector(`[name="${key}"]`);
      if (schema.type === 'boolean') {
        newSettings[key] = el.checked ? 'true' : 'false';
      } else {
        newSettings[key] = el.value;
      }
    }
    handlers.onSave(newSettings);
  });
}

// --- Category Manager ---

export function renderCategoryManager(container, categories, itemCounts, handlers) {
  let cats = [...categories];

  function renderList() {
    container.innerHTML = `
      <div class="admin-header">
        <h2 class="admin-title">Categories (${cats.length})</h2>
        <div class="btn-group">
          <span class="drag-hint">Drag ≡ to reorder</span>
          <button class="btn btn-primary" id="cat-add">+ Add Category</button>
        </div>
      </div>
      <div class="category-manager">
        ${cats.map((cat, i) => {
          const count = itemCounts[cat] || 0;
          return `
          <div class="cat-row" data-index="${i}" draggable="true">
            <span class="drag-handle" title="Drag to reorder">≡</span>
            <input type="text" class="cat-name-input" value="${esc(cat)}" data-index="${i}">
            <span class="cat-item-count">${count} item${count !== 1 ? 's' : ''}</span>
            <button class="btn btn-sm btn-ghost cat-delete" data-index="${i}" ${count > 0 ? 'disabled title="Has items"' : ''}>Del</button>
          </div>`;
        }).join('')}
      </div>
      <div style="padding-top: 16px;">
        <button class="btn btn-primary" id="cat-save">Save Categories</button>
      </div>
    `;

    // Add category
    container.querySelector('#cat-add').addEventListener('click', () => {
      const name = prompt('New category name:');
      if (!name || !name.trim()) return;
      const trimmed = name.trim();
      if (cats.includes(trimmed)) { alert('Category already exists'); return; }
      cats.push(trimmed);
      renderList();
    });

    // Save
    container.querySelector('#cat-save').addEventListener('click', async () => {
      // Read current names from inputs (handles renames)
      const inputs = container.querySelectorAll('.cat-name-input');
      const oldCats = [...cats];
      const newCats = [];
      const renames = [];

      for (const input of inputs) {
        const idx = parseInt(input.dataset.index);
        const newName = input.value.trim();
        if (!newName) continue;
        newCats.push(newName);
        if (oldCats[idx] && oldCats[idx] !== newName) {
          renames.push({ oldName: oldCats[idx], newName });
        }
      }

      // Process renames (update items)
      for (const { oldName, newName } of renames) {
        await handlers.onRename(oldName, newName);
      }

      cats = newCats;
      await handlers.onSave(cats);
      renderList();
    });

    // Delete
    container.querySelectorAll('.cat-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        cats.splice(idx, 1);
        renderList();
      });
    });

    // Drag-and-drop reorder
    let dragIdx = null;
    container.querySelectorAll('.cat-row').forEach(row => {
      row.addEventListener('dragstart', () => { dragIdx = parseInt(row.dataset.index); row.style.opacity = '0.4'; });
      row.addEventListener('dragend', () => { row.style.opacity = ''; });
      row.addEventListener('dragover', (e) => { e.preventDefault(); row.classList.add('drag-over'); });
      row.addEventListener('dragleave', () => { row.classList.remove('drag-over'); });
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        const toIdx = parseInt(row.dataset.index);
        if (dragIdx === null || dragIdx === toIdx) return;
        const [moved] = cats.splice(dragIdx, 1);
        cats.splice(toIdx, 0, moved);
        renderList();
      });
    });
  }

  renderList();
}

// --- Helpers ---

async function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, IMAGE_MAX_WIDTH / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Try WebP first, fallback to JPEG
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85);
        },
        'image/webp',
        0.85
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(); };
    img.src = objectUrl;
  });
}

function setupDragReorder(container, array, onReorder) {
  let dragIndex = null;

  container.querySelectorAll('.upload-preview').forEach((el) => {
    el.addEventListener('dragstart', (e) => {
      dragIndex = parseInt(el.dataset.index);
      el.style.opacity = '0.5';
      e.dataTransfer.effectAllowed = 'move';
    });

    el.addEventListener('dragend', () => {
      el.style.opacity = '';
    });

    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    el.addEventListener('drop', (e) => {
      e.preventDefault();
      const dropIndex = parseInt(el.dataset.index);
      if (dragIndex === null || dragIndex === dropIndex) return;

      const [moved] = array.splice(dragIndex, 1);
      array.splice(dropIndex, 0, moved);
      dragIndex = null;
      onReorder();
    });
  });
}
