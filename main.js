/* ---------- Data ---------- */
// Loads photo metadata from /data/photos.json
async function loadPhotos() {
  const res = await fetch('/data/photos.json');
  if (!res.ok) throw new Error('Failed to load /data/photos.json');
  return await res.json();
}

/* ---------- Helpers ---------- */
// Randomly shuffles an array (Fisher–Yates algorithm)
function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Randomly makes a landscape image span 2 columns (for visual variety)
function maybeMakeWide(card, img) {
  const isLandscape = img.naturalWidth > img.naturalHeight;
  if (isLandscape && Math.random() < 0.35) card.classList.add('w2');
}

// Calculates grid row span for a card in a masonry layout
function sizeCard(card){
  const grid = card.parentElement;
  const styles = getComputedStyle(grid);
  const row = parseInt(styles.getPropertyValue('grid-auto-rows'), 10);
  const gap = parseInt(styles.getPropertyValue('gap'), 10);
  const box = card.querySelector('.thumb');
  const h = box.getBoundingClientRect().height;
  const span = Math.max(1, Math.ceil((h + gap) / (row + gap)));
  card.style.gridRowEnd = `span ${span}`;
}

/* ---------- Lightbox (Viewer) ---------- */
// Global lightbox state and references
const lightbox = {
  el: null,
  open: false,
  index: 0,
  list: [],
  lastFocus: null,
  imgEl: null,
  titleEl: null,
  descEl: null,
  nextBtn: null,
  prevBtn: null,
  closeBtn: null,
};

// Ensures lightbox DOM elements exist (creates them if not)
function ensureLightboxDOM(){
  if (lightbox.el) return;

  const wrap = document.createElement('div');
  wrap.className = 'lightbox';
  wrap.innerHTML = `
    <div class="lb-inner" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <button class="lb-close" aria-label="Close">×</button>
      <div class="lb-media">
        <button class="lb-prev" aria-label="Previous">‹</button>
        <img class="lb-img" alt="">
        <button class="lb-next" aria-label="Next">›</button>
      </div>
      <div class="lb-caption">
        <h3 class="lb-title"></h3>
        <p class="lb-desc"></p>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  // Wire control buttons and keyboard events
  lightbox.el       = wrap;
  lightbox.imgEl    = wrap.querySelector('.lb-img');
  lightbox.titleEl  = wrap.querySelector('.lb-title');
  lightbox.descEl   = wrap.querySelector('.lb-desc');
  lightbox.nextBtn  = wrap.querySelector('.lb-next');
  lightbox.prevBtn  = wrap.querySelector('.lb-prev');
  lightbox.closeBtn = wrap.querySelector('.lb-close');

  lightbox.closeBtn.addEventListener('click', closeLightbox);
  lightbox.nextBtn.addEventListener('click', () => showLightbox(lightbox.index + 1));
  lightbox.prevBtn.addEventListener('click', () => showLightbox(lightbox.index - 1));

  document.addEventListener('keydown', (e) => {
    if (!lightbox.open) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showLightbox(lightbox.index + 1);
    if (e.key === 'ArrowLeft')  showLightbox(lightbox.index - 1);
  });

  // Click outside the image closes the lightbox
  wrap.addEventListener('click', (e) => { if (e.target === wrap) closeLightbox(); });
}

// Opens the lightbox for a specific image inde
function openLightboxFromIndex(idx, list){
  ensureLightboxDOM();
  lightbox.list = list.slice();
  lightbox.lastFocus = document.activeElement;
  document.body.style.overflow = 'hidden';
  document.body.classList.add('lb-open');       
  lightbox.el.classList.add('open');
  lightbox.open = true;
  showLightbox(idx);
  lightbox.closeBtn.focus();
}


// Closes the lightbox and restores scroll/focus
function closeLightbox(){
  if (!lightbox.open) return;
  lightbox.el.classList.remove('open');
  lightbox.open = false;
  document.body.style.overflow = '';
  document.body.classList.remove('lb-open');     
  lightbox.imgEl.src = '';
  lightbox.lastFocus?.focus?.();
}

// Displays a specific image inside the lightbox
function showLightbox(idx){
  const list = lightbox.list;
  if (!list || !list.length) return;

  if (idx < 0) idx = list.length - 1;
  if (idx >= list.length) idx = 0;
  lightbox.index = idx;

  const p = list[idx];
  const title = p.title ?? p.name ?? 'Untitled';
  const desc  = p.description ?? p.blurb ?? p.desc ?? p.caption ?? '';

  lightbox.titleEl.textContent = title;
  lightbox.descEl.textContent  = desc;
  lightbox.imgEl.alt = title;

  // Smooth fade-in transition
  lightbox.imgEl.style.opacity = '0';
  const src = p.file;
  const temp = new Image();
  temp.onload = () => {
    lightbox.imgEl.src = src;
    requestAnimationFrame(() => {
      lightbox.imgEl.style.transition = 'opacity .25s ease';
      lightbox.imgEl.style.opacity = '1';
    });
  };
  temp.src = src;
}

/* ---------- Templating ---------- */

// Returns the HTML template for each photo card
function cardTemplate(p, idxInFiltered) {
  const title = p.title ?? p.name ?? 'Untitled';
  const description = p.description ?? p.blurb ?? p.desc ?? p.caption ?? '';
  return `
    <figure class="card reveal" data-shown="0" data-idx="${idxInFiltered}">
      <a href="#" aria-label="Open ${title}">
        <div class="thumb">
          <img src="${p.file}" alt="${title}" loading="lazy">
          <div class="overlay">
            <div class="overlay-inner">
              <h3 class="ov-title">${title}</h3>
              ${description ? `<p class="ov-sub">${description}</p>` : ``}
            </div>
          </div>
        </div>
      </a>
    </figure>
  `;
}

/* ---------- Rail menu (hamburger in header -> off-canvas) ---------- */
// Initializes the side navigation rail and its overlay
function initRailMenu(){
  const rail = document.querySelector('.side-rail');
  const handle = document.querySelector('.hero-strip .rail-handle');
  const content = rail?.querySelector('.rail-content');

    // Creates a dimmed overlay for when the rail is open
  let overlay = document.querySelector('.rail-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'rail-overlay';
    overlay.hidden = true;
    document.body.appendChild(overlay);
  }

  if (!rail || !handle) return;

  // Opens/closes the rail panel
  const setOpen = (open) => {
    rail.classList.toggle('open', open);
    handle.setAttribute('aria-expanded', String(open));
    content?.setAttribute('aria-hidden', String(!open));
    overlay.hidden = !open;
  };

   // Toggles on click
  handle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!rail.classList.contains('open'));
  });

  // Navigation links inside the rail
  overlay.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.menu-link[data-nav]');
    if (!link) return;
    e.preventDefault();
    const dest = (link.dataset.nav || '').toLowerCase();
    if (dest === 'home') window.location.href = 'index.html';
    setOpen(false);
  });

 // Category filters inside the rail
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.menu-link[data-filter]');
    if (!link) return;
    e.preventDefault();
    document.dispatchEvent(new CustomEvent('apply-category', { detail: { cat: link.dataset.filter } }));
    setOpen(false);
  });
}

/* ---------- App (Home) ---------- */
// Main initializer for the home page grid, infinite scroll & filters
async function initHome() {
  const isHome = location.pathname === '/' || location.pathname.endsWith('/index.html');
  if (!isHome) return;

  const grid = document.getElementById('homeGrid');
  const sentinel = document.getElementById('infiniteSentinel');
  if (!grid || !sentinel) return;

  const BATCH_SIZE = 12;
  let cursor = 0, loading = false, done = false;

  let allPhotos = [];
  let filteredPhotos = [];
   // Load photos from JSON
  try {
    const raw = await loadPhotos();
    allPhotos = raw.map(p => {
      const cats = Array.isArray(p.categories) ? p.categories : [p.category ?? ''];
      const norm = cats.map(c => (c ?? '').toString().trim().toLowerCase()).filter(Boolean);
      return { ...p, _catNorm: norm };
    });
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<p>Could not load photos at this moment.</p>`;
    return;
  }

   // Observer to animate cards when they appear (fade-in / reveal)
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting && el.dataset.shown !== '1') {
        el.classList.add('in');
        el.dataset.shown = '1';
        revealObserver.unobserve(el);
      }
    });
  }, { threshold: 0.15 });

    // Updates which category filter pill is active
  function setActivePill(name) {
    document.querySelectorAll('.filters-pills .pill[data-filter]').forEach(b => {
      const active = b.dataset.filter === name;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });
  }

   // Applies a filter (category) and re-renders the grid
  function applyFilter(name) {
    setActivePill(name);
    const want = (name || '').toLowerCase();
    filteredPhotos = (want === 'all' || want === '')
      ? allPhotos.slice()
      : allPhotos.filter(p => p._catNorm.includes(want));

    filteredPhotos = shuffle(filteredPhotos);
    lightbox.list = filteredPhotos.slice();

    grid.innerHTML = '';
    cursor = 0; loading = false; done = false;

    renderNextBatch();
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Bind filter buttons to applyFilter
  document.querySelectorAll('.pill[data-filter]').forEach(btn =>
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter))
  );

  // Custom event handler for filters coming from the side menu
  document.addEventListener('apply-category', (e) => {
    if (!e?.detail?.cat) return;
    applyFilter(e.detail.cat);
  });


    // Connects new cards to lightbox clicks

  function wireNewCardsForLightbox() {
    grid.querySelectorAll('.card:not([data-bound="1"])').forEach(card => {
      card.setAttribute('data-bound', '1');
      const anchor = card.querySelector('a');
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const idxInFiltered = Number(card.dataset.idx) || 0;
        openLightboxFromIndex(idxInFiltered, filteredPhotos);
      });
    });
  }

  // Renders the next batch of photos (for infinite scroll)
  function renderNextBatch() {
    if (loading || done) return;
    loading = true;

    const slice = filteredPhotos.slice(cursor, cursor + BATCH_SIZE);
    const batchStart = cursor;

    if (!slice.length) { done = true; loading = false; return; }

    const html = slice.map((p, i) => cardTemplate(p, batchStart + i)).join('');
    grid.insertAdjacentHTML('beforeend', html);

    // Measure and reveal each new card
    grid.querySelectorAll('.card.reveal[data-shown="0"]').forEach(card => {
      const img = card.querySelector('img');
      const onReady = () => {
        maybeMakeWide(card, img);
        sizeCard(card);
        revealObserver.observe(card);
      };
      if (img) img.complete ? onReady() : img.addEventListener('load', onReady, { once:true });
    });

    wireNewCardsForLightbox();

    cursor += slice.length;
    loading = false;
  }
  
  // Intersection observer for infinite scrolling
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) renderNextBatch(); });
  }, { root: null, rootMargin: '800px 0px' });
  observer.observe(sentinel);

  // Recalculate card sizes when resizing window
  window.addEventListener('resize', () => {
    document.querySelectorAll('.grid-masonry .card').forEach(sizeCard);
  });

  applyFilter('All');
}

/* ---------- Boot ---------- */
// Initializes the side menu and the home grid
initRailMenu();
initHome();