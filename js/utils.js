// --- Shared Utilities ---

const escDiv = document.createElement('div');

export function esc(str) {
  if (str == null) return '';
  escDiv.textContent = str;
  return escDiv.innerHTML;
}
