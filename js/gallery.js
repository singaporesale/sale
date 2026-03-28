export function createGallery(photoUrls, container) {
  if (!photoUrls || photoUrls.length === 0) {
    container.innerHTML = '<div class="gallery-empty">No photos</div>';
    return;
  }

  let currentIndex = 0;
  let touchStartX = 0;
  let touchEndX = 0;

  function render() {
    container.innerHTML = `
      <div class="gallery">
        <div class="gallery-main">
          <img src="${photoUrls[currentIndex]}" alt="Photo ${currentIndex + 1}" class="gallery-img" loading="eager" decoding="async">
          ${photoUrls.length > 1 ? `
            <button class="gallery-nav gallery-prev" aria-label="Previous photo">${SVG_CHEVRON_LEFT}</button>
            <button class="gallery-nav gallery-next" aria-label="Next photo">${SVG_CHEVRON_RIGHT}</button>
            <div class="gallery-dots">
              ${photoUrls.map((_, i) => `<span class="gallery-dot ${i === currentIndex ? 'active' : ''}" data-index="${i}"></span>`).join('')}
            </div>
          ` : ''}
        </div>
        ${photoUrls.length > 1 ? `
          <div class="gallery-thumbs">
            ${photoUrls.map((url, i) => `<img src="${url}" alt="Thumb ${i + 1}" class="gallery-thumb ${i === currentIndex ? 'active' : ''}" data-index="${i}" loading="lazy" decoding="async">`).join('')}
          </div>
        ` : ''}
      </div>
    `;

    const main = container.querySelector('.gallery-main');
    const img = container.querySelector('.gallery-img');

    // Click to open lightbox
    img.addEventListener('click', () => openLightbox(photoUrls, currentIndex));

    // Navigation arrows
    const prev = container.querySelector('.gallery-prev');
    const next = container.querySelector('.gallery-next');
    if (prev) prev.addEventListener('click', (e) => { e.stopPropagation(); go(-1); });
    if (next) next.addEventListener('click', (e) => { e.stopPropagation(); go(1); });

    // Thumbnail clicks
    container.querySelectorAll('.gallery-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        currentIndex = parseInt(thumb.dataset.index);
        render();
      });
    });

    // Dot clicks
    container.querySelectorAll('.gallery-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        currentIndex = parseInt(dot.dataset.index);
        render();
      });
    });

    // Touch swipe
    main.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    main.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        go(diff > 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  function go(direction) {
    currentIndex = (currentIndex + direction + photoUrls.length) % photoUrls.length;
    render();
  }

  render();

  // Keyboard navigation
  function onKey(e) {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  }

  return {
    destroy() {
      document.removeEventListener('keydown', onKey);
    },
    attachKeyboard() {
      document.addEventListener('keydown', onKey);
    }
  };
}

// --- Lightbox ---

function openLightbox(photoUrls, startIndex) {
  let index = startIndex;
  let touchStartX = 0;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.innerHTML = `
    <div class="lightbox-backdrop"></div>
    <button class="lightbox-close" aria-label="Close">${SVG_CLOSE}</button>
    <img src="${photoUrls[index]}" class="lightbox-img" alt="Full size photo">
    ${photoUrls.length > 1 ? `
      <button class="lightbox-nav lightbox-prev" aria-label="Previous">${SVG_CHEVRON_LEFT}</button>
      <button class="lightbox-nav lightbox-next" aria-label="Next">${SVG_CHEVRON_RIGHT}</button>
      <div class="lightbox-counter">${index + 1} / ${photoUrls.length}</div>
    ` : ''}
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  function updateImg() {
    overlay.querySelector('.lightbox-img').src = photoUrls[index];
    const counter = overlay.querySelector('.lightbox-counter');
    if (counter) counter.textContent = `${index + 1} / ${photoUrls.length}`;
  }

  function close() {
    overlay.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
  }

  function go(dir) {
    index = (index + dir + photoUrls.length) % photoUrls.length;
    updateImg();
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  }

  overlay.querySelector('.lightbox-backdrop').addEventListener('click', close);
  overlay.querySelector('.lightbox-close').addEventListener('click', close);
  const prev = overlay.querySelector('.lightbox-prev');
  const next = overlay.querySelector('.lightbox-next');
  if (prev) prev.addEventListener('click', () => go(-1));
  if (next) next.addEventListener('click', () => go(1));

  overlay.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  overlay.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1);
  }, { passive: true });

  document.addEventListener('keydown', onKey);

  requestAnimationFrame(() => overlay.classList.add('lightbox-open'));
}

// --- Inline SVG Icons ---

const SVG_CHEVRON_LEFT = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;

const SVG_CHEVRON_RIGHT = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

const SVG_CLOSE = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
