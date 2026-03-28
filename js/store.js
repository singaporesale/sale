function createStore(initialState) {
  let state = { ...initialState };
  const listeners = new Map();

  return {
    get(key) {
      return state[key];
    },

    set(key, value) {
      const old = state[key];
      state[key] = value;
      if (old !== value) {
        (listeners.get(key) || []).forEach(fn => fn(value, old));
        (listeners.get('*') || []).forEach(fn => fn(state));
      }
    },

    update(key, updaterFn) {
      this.set(key, updaterFn(state[key]));
    },

    subscribe(key, callback) {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key).add(callback);
      return () => listeners.get(key).delete(callback);
    },

    getState() {
      return { ...state };
    }
  };
}

export const store = createStore({
  items: [],
  filteredItems: [],
  settings: {},
  filters: { search: '', category: 'all', sort: 'sort_order', availableOnly: true },
  loading: true,
  selectedItem: null,
  modalOpen: false,
});
