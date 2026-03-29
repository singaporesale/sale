import { getSession, signIn, signOut, fetchItems, fetchSettings, updateItem, deleteItem, createItem, updateSettings, updateSetting } from './api.js';
import { renderItemsList, renderItemForm, renderSettingsForm, renderCategoryManager, showAlert } from './admin-components.js';
import { DEFAULT_CATEGORIES, CONDITIONS } from './config.js';

let items = [];
let settings = {};

function getCategories() {
  try {
    if (settings.categories) return JSON.parse(settings.categories);
  } catch (e) {}
  return DEFAULT_CATEGORIES;
}

// --- Auth ---

async function checkAuth() {
  const session = await getSession();
  if (session) {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('admin-view').style.display = '';
    await loadData();
    handleRoute();
  } else {
    document.getElementById('login-view').style.display = '';
    document.getElementById('admin-view').style.display = 'none';
  }
}

function setupLogin() {
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      await signIn(email, password);
      await checkAuth();
    } catch (err) {
      errorEl.textContent = err.message || 'Login failed';
    }
  });
}

function setupLogout() {
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut();
    location.reload();
  });
}

// --- Data ---

async function loadData() {
  try {
    [items, settings] = await Promise.all([fetchItems(), fetchSettings()]);
    const countEl = document.getElementById('items-count');
    if (countEl) countEl.textContent = items.length;
  } catch (err) {
    console.error('Load data error:', err);
  }
}

// --- Routing ---

function handleRoute() {
  const hash = location.hash.slice(2) || 'items';
  const main = document.getElementById('admin-main');

  // Update nav active state
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.route === hash || (hash.startsWith('items/') && link.dataset.route === 'items'));
  });

  if (hash === 'items') {
    renderItemsList(main, items, getItemListHandlers(), getCategories());
  } else if (hash === 'items/new') {
    renderItemForm(main, null, {
      categories: getCategories(),
      conditions: CONDITIONS,
      onSave: async (itemData, existingId) => {
        try {
          if (existingId) {
            await updateItem(existingId, itemData);
          } else {
            await createItem(itemData);
          }
          showAlert(main, 'Item created successfully!', 'success');
          await loadData();
          location.hash = '/items';
        } catch (err) {
          showAlert(main, err.message, 'error');
        }
      },
      onCancel: () => { location.hash = '/items'; }
    });
  } else if (hash.startsWith('items/')) {
    const id = hash.replace('items/', '');
    const item = items.find(i => i.id === id);
    if (!item) {
      main.innerHTML = '<div class="items-empty">Item not found</div>';
      return;
    }
    renderItemForm(main, item, {
      categories: getCategories(),
      conditions: CONDITIONS,
      onSave: async (itemData) => {
        try {
          await updateItem(id, itemData);
          showAlert(main, 'Item updated!', 'success');
          await loadData();
        } catch (err) {
          showAlert(main, err.message, 'error');
        }
      },
      onDelete: async () => {
        if (!confirm('Delete this item?')) return;
        await deleteItem(id);
        await loadData();
        location.hash = '/items';
      },
      onCancel: () => { location.hash = '/items'; }
    });
  } else if (hash === 'categories') {
    const catItems = {};
    for (const item of items) {
      catItems[item.category] = (catItems[item.category] || 0) + 1;
    }
    renderCategoryManager(main, getCategories(), catItems, {
      onSave: async (cats) => {
        try {
          const json = JSON.stringify(cats);
          await updateSetting('categories', json);
          settings.categories = json;
          showAlert(main, 'Categories saved!', 'success');
        } catch (err) {
          showAlert(main, err.message, 'error');
        }
      },
      onRename: async (oldName, newName) => {
        try {
          // Update all items with the old category name
          const toUpdate = items.filter(i => i.category === oldName);
          await Promise.all(toUpdate.map(i => updateItem(i.id, { category: newName })));
          await loadData();
        } catch (err) {
          showAlert(main, err.message, 'error');
        }
      }
    });
  } else if (hash === 'settings') {
    renderSettingsForm(main, settings, {
      onSave: async (newSettings) => {
        try {
          await updateSettings(newSettings);
          settings = { ...settings, ...newSettings };
          showAlert(main, 'Settings saved!', 'success');
        } catch (err) {
          showAlert(main, err.message, 'error');
        }
      }
    });
  }
}

function getItemListHandlers() {
  return {
    onStatusChange: async (id, status) => {
      await updateItem(id, { status });
      await loadData();
      const main = document.getElementById('admin-main');
      renderItemsList(main, items, getItemListHandlers(), getCategories());
    },
    onDelete: async (id) => {
      if (!confirm('Delete this item?')) return;
      await deleteItem(id);
      await loadData();
      const main = document.getElementById('admin-main');
      renderItemsList(main, items, getItemListHandlers(), getCategories());
    },
    onEdit: (id) => { location.hash = `/items/${id}`; },
    onReorder: async (updates) => {
      try {
        await Promise.all(updates.map(u => updateItem(u.id, { sort_order: u.sort_order })));
        await loadData();
        const main = document.getElementById('admin-main');
        renderItemsList(main, items, getItemListHandlers(), getCategories());
      } catch (err) {
        console.error('Reorder error:', err);
      }
    }
  };
}

// --- Sidebar ---

function setupSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar on nav click (mobile)
  sidebar.addEventListener('click', (e) => {
    if (e.target.closest('.nav-link')) {
      sidebar.classList.remove('open');
    }
  });
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  setupLogin();
  setupLogout();
  setupSidebar();
  checkAuth();
});

window.addEventListener('hashchange', async () => {
  const session = await getSession();
  if (session) handleRoute();
});
