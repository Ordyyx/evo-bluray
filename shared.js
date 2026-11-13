const statuses = ['owned', 'wishlist'];

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value != null) node.setAttribute(key, value);
  }
  node.append(...children.flat().filter(child => child != null));
  return node;
}

const icons = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  discs: '<ellipse cx="12" cy="6" rx="9" ry="4"/><ellipse cx="12" cy="6" rx="3" ry="1"/><path d="M3 6v10c0 5 18 5 18 0V6M3 11c0 5 18 5 18 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  atmos: '<path fill="currentColor" stroke="none" d="M2 5h4a7 7 0 0 1 0 14H2zm20 0h-4a7 7 0 0 0 0 14h4z"/>',
  play: '<path fill="currentColor" stroke="none" d="M7 4v16l13-8z"/>',
};

export function icon(name) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  node.setAttribute('viewBox', '0 0 24 24');
  node.setAttribute('fill', 'none');
  node.setAttribute('stroke', 'currentColor');
  node.setAttribute('stroke-width', '1.7');
  node.setAttribute('stroke-linecap', 'round');
  node.setAttribute('stroke-linejoin', 'round');
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML = icons[name];
  return node;
}

function artUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value, location.href);
    const assetRoot = new URL('assets/', location.href);
    if (url.origin === assetRoot.origin && url.pathname.startsWith(assetRoot.pathname)) return url.href;
    if (url.protocol === 'https:' && url.origin !== location.origin) return url.href;
  } catch { /* Invalid artwork falls back to the film title. */ }
  return '';
}

export function image(value, alt, loading = 'lazy') {
  const url = artUrl(value);
  if (!url) return null;
  const node = el('img', { alt, loading, decoding: 'async', src: url });
  node.addEventListener('error', () => node.remove(), { once: true });
  return node;
}

export function posterArt(film, large = false) {
  const picture = image(film.poster, '', large ? 'eager' : 'lazy');
  return el('span', { class: 'poster', 'aria-hidden': 'true' }, picture);
}

export function duration(minutes) {
  if (!minutes) return '—';
  const hours = Math.floor(minutes / 60);
  return [hours ? `${hours}h` : '', `${minutes % 60}m`].filter(Boolean).join(' ');
}

export function formatBadges(film) {
  return el('span', { class: 'formats' },
    film.formats.map(format => {
      if (format === 'Blu-ray') {
        return el('span', { class: 'format-logo bluray-logo', role: 'img', 'aria-label': 'Blu-ray Disc' },
          el('img', { src: 'assets/disc.svg', alt: '' }), el('span', {}, 'Blu-ray Disc'));
      }
      if (format === '4K UHD') {
        return el('span', { class: 'format-logo uhd-logo', role: 'img', 'aria-label': '4K Ultra HD' },
          el('strong', {}, '4K'), el('span', {}, 'ULTRA HD'));
      }
      return el('span', { class: 'badge' }, format);
    }),
    film.atmos ? el('span', { class: 'badge' }, icon('atmos'), 'Dolby Atmos') : null);
}

function checkLibrary(data) {
  if (!data || !Array.isArray(data.films) || data.films.some(film =>
    !film || typeof film.id !== 'string' || typeof film.title !== 'string' ||
    !Array.isArray(film.genres) || !Array.isArray(film.formats) || !statuses.includes(film.status))) {
    throw new Error('The collection file has an invalid format.');
  }
  return data;
}

export async function loadLibrary() {
  const response = await fetch('collection.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`The collection could not be loaded (HTTP ${response.status}).`);
  return checkLibrary(await response.json());
}
