export function initCountdown(endDateStr, containerEl, compact = false) {
  let interval;

  function update() {
    const now = new Date();
    const end = new Date(endDateStr + 'T23:59:59+08:00');
    const diff = end - now;

    if (diff <= 0) {
      containerEl.innerHTML = '<span class="countdown-ended">Sale has ended</span>';
      clearInterval(interval);
      return;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const urgent = diff < 86400000;

    if (compact) {
      containerEl.textContent = days > 0
        ? `${days}d ${hours}h ${minutes}m`
        : `${hours}h ${minutes}m ${seconds}s`;
      containerEl.classList.toggle('countdown-urgent', urgent);
      return;
    }

    containerEl.innerHTML = `
      <div class="countdown ${urgent ? 'countdown-urgent' : ''}">
        ${days > 0 ? `<div class="countdown-unit"><span class="countdown-num">${days}</span><span class="countdown-label">days</span></div>` : ''}
        <div class="countdown-unit"><span class="countdown-num">${String(hours).padStart(2, '0')}</span><span class="countdown-label">hrs</span></div>
        <div class="countdown-unit"><span class="countdown-num">${String(minutes).padStart(2, '0')}</span><span class="countdown-label">min</span></div>
        <div class="countdown-unit"><span class="countdown-num">${String(seconds).padStart(2, '0')}</span><span class="countdown-label">sec</span></div>
      </div>
    `;
  }

  update();
  interval = setInterval(update, 1000);
  return () => clearInterval(interval);
}
