import { el, icon, posterArt, duration, formatBadges, image, loadLibrary } from './shared.js';

const byId = id => document.getElementById(id);
const search = byId('search');
const sort = byId('sort');
const dialog = byId('film-dialog');
const list = byId('film-list');
const hero = byId('hero');
const headings = { home: 'My Collection', collection: 'My Collection', wishlist: 'Wishlist' };
let library;

byId('search-icon').append(icon('search'));
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
sort.addEventListener('change', render);
search.addEventListener('input', render);
addEventListener('hashchange', () => {
  document.querySelector('.genre-menu').open = false;
  render();
});

function detailButton(film, className, text, symbol) {
  const button = el('button', { type: 'button', class: className }, symbol ? icon(symbol) : null, text);
  button.addEventListener('click', () => showFilm(film));
  return button;
}

function showFilm(film) {
  const heading = el('h2', { id: 'detail-title' }, film.title);
  const meta = [film.year, film.ukRating, film.type === 'Film' ? '' : film.type, film.runtime ? duration(film.runtime) : '', ...film.genres].filter(Boolean).join(' · ');
  byId('detail').replaceChildren(el('div', { class: 'detail-layout' }, posterArt(film, true),
    el('div', {}, heading, el('p', { class: 'muted' }, meta), formatBadges(film),
      film.overview ? el('p', {}, film.overview) : null,
      film.edition ? el('p', { class: 'muted' }, film.edition) : null,
      film.boxSet ? el('p', { class: 'muted' }, film.boxSet) : null)));
  dialog.showModal();
}

function renderHero(film) {
  hero.hidden = !film;
  if (!film) return;
  const backdrop = image(film.backdrop, '', 'eager');
  if (backdrop) backdrop.className = 'hero-backdrop';
  const logo = image(film.logo, film.title, 'eager');
  if (logo) logo.className = 'film-logo';
  const title = el('h1', {}, logo, el('span', { class: logo ? 'logo-fallback' : '' }, film.title));
  hero.replaceChildren(backdrop, el('div', { class: 'hero-inner' }, posterArt(film, true),
    el('div', { class: 'hero-copy' },
      el('p', { class: 'eyebrow' }, 'Featured title'), title,
      el('div', { class: 'metadata' },
        film.year ? el('span', {}, film.year) : null,
        film.runtime ? el('span', {}, duration(film.runtime)) : null,
        el('div', { class: 'hero-genres' }, film.genres.map(genre => el('a', { href: `#collection/${encodeURIComponent(genre)}` }, genre)))),
      formatBadges(film), el('p', { class: 'overview' }, film.overview || ''),
      el('div', { class: 'hero-actions' }, detailButton(film, 'button primary', 'View Details', 'play')))));
}

function renderStats(owned) {
  const stats = [
    [icon('discs'), owned.length, 'Total Titles'],
    [el('span', { class: 'stat-4k' }, '4K'), owned.filter(film => film.formats.includes('4K UHD')).length, 'In 4K UHD'],
    ...(owned.some(film => film.atmos) ? [[icon('atmos'), owned.filter(film => film.atmos).length, 'With Dolby Atmos']] : []),
    [icon('clock'), owned.some(film => film.runtime) ? duration(owned.reduce((sum, film) => sum + (film.runtime || 0), 0)) : '0m', 'Total Runtime'],
  ];
  byId('stats').replaceChildren(...stats.map(([symbol, value, caption]) =>
    el('div', { class: 'stat' }, symbol, el('div', {}, el('strong', {}, value), el('small', {}, caption)))));
}

function render() {
  if (!library) return;
  const [section, encodedGenre] = location.hash.slice(1).split('/');
  const page = Object.hasOwn(headings, section) ? section : 'home';
  let genre = '';
  try { genre = decodeURIComponent(encodedGenre || ''); } catch { /* Ignore malformed URL fragments. */ }
  const owned = library.films.filter(film => film.status === 'owned');
  const base = page === 'wishlist' ? library.films.filter(film => film.status === 'wishlist') : owned;
  const genreCounts = new Map();
  for (const film of base) for (const name of film.genres) genreCounts.set(name, (genreCounts.get(name) || 0) + 1);
  const genres = [...genreCounts.keys()].sort((a, b) => genreCounts.get(b) - genreCounts.get(a) || a.localeCompare(b));
  const query = search.value.trim().toLowerCase();
  const films = base.filter(film => (!genre || film.genres.includes(genre)) &&
    (!query || [film.title, film.year, film.edition, film.franchise, film.boxSet, ...film.genres, ...film.formats].some(value => String(value ?? '').toLowerCase().includes(query))));
  const orders = {
    shelf: (a, b) => (a.shelfOrder ?? Infinity) - (b.shelfOrder ?? Infinity),
    added: (a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''),
    title: (a, b) => a.title.localeCompare(b.title),
    year: (a, b) => (b.year || 0) - (a.year || 0),
    runtime: (a, b) => (b.runtime || 0) - (a.runtime || 0),
  };
  films.sort(orders[sort.value]);
  for (const link of document.querySelectorAll('[data-route]')) {
    if (link.dataset.route === page) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  const featured = library.films.find(film => film.id === library.featuredId);
  const nextHero = page === 'home' && !query && !genre ? featured : null;
  if (hero.dataset.film !== (nextHero?.id || '')) {
    renderHero(nextHero);
    hero.dataset.film = nextHero?.id || '';
  }
  byId('collection-title').textContent = headings[page];
  byId('count').textContent = `${films.length} ${films.length === 1 ? 'Title' : 'Titles'}`;
  renderStats(owned);
  byId('genre-menu').replaceChildren(...[...new Set(owned.flatMap(film => film.genres))].sort().map(name =>
    el('a', { href: `#collection/${encodeURIComponent(name)}` }, name)));
  byId('genres').replaceChildren(...['', ...genres].map(name =>
    el('a', { class: 'pill', href: `#${page}${name ? '/' + encodeURIComponent(name) : ''}`,
      'aria-current': name === genre ? 'true' : null }, `${name || 'All Titles'} (${genreCounts.get(name) ?? base.length})`)));
  list.replaceChildren(...films.map(film => {
    const button = el('button', { class: 'film-card', type: 'button' },
      posterArt(film), el('span', { class: 'film-caption' }, el('strong', {}, film.title),
        el('small', {}, [film.year, film.runtime ? duration(film.runtime) : '', film.ukRating ? `UK ${film.ukRating}` : '',
          Number.isFinite(film.imdbRating) ? `IMDb ${film.imdbRating.toFixed(1)}/10` : ''].filter(Boolean).join(' · '))),
      formatBadges(film), el('span', { class: 'row-arrow', 'aria-hidden': 'true' }, '›'));
    button.addEventListener('click', () => showFilm(film));
    return el('li', {}, button);
  }));
  byId('empty').hidden = films.length > 0;
  byId('empty').textContent = query || genre ? 'No films match these filters.' : 'There are no films on this shelf yet.';
}

loadLibrary().then(data => { library = data; render(); }).catch(error => {
  byId('empty').hidden = false;
  byId('empty').textContent = error.message;
});
