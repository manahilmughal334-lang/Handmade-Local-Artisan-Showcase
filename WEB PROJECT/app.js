const API = 'http://localhost:3000/artisans';

const currentUser = JSON.parse(localStorage.getItem('artisan_user') || 'null');
if (!currentUser) window.location.href = 'login.html';

const grid         = document.getElementById('artisans-grid');
const filterCat    = document.getElementById('filterCategory');
const filterLoc    = document.getElementById('filterLocation');
const filterStatus = document.getElementById('filterStatus');
const addModal     = document.getElementById('addModal');
const addForm      = document.getElementById('addForm');
const toast        = document.getElementById('toast');
const searchInput  = document.getElementById('searchInput');


window.addEventListener('scroll', () => {
  document.getElementById('topnav').classList.toggle('scrolled', window.scrollY > 60);
});


const slideMenu   = document.getElementById('slideMenu');
const menuOverlay = document.getElementById('menuOverlay');

document.getElementById('menuOpen').addEventListener('click', () => {
  slideMenu.classList.add('open');
  menuOverlay.classList.add('open');
});

function closeMenu() {
  slideMenu.classList.remove('open');
  menuOverlay.classList.remove('open');
}

document.getElementById('menuClose').addEventListener('click', closeMenu);
menuOverlay.addEventListener('click', closeMenu);

document.querySelectorAll('.smenu-link[data-section]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.getElementById(link.dataset.section);
    if (target) { closeMenu(); setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 300); }
  });
});

document.querySelector('.smenu-has-sub .smenu-link').addEventListener('click', function() {
  this.closest('.smenu-has-sub').classList.toggle('open');
});

document.querySelectorAll('.smenu-sub a[data-filter]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    filterCat.value = a.dataset.filter;
    fetchArtisans();
    closeMenu();
    document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
  });
});


const searchBarDrop = document.getElementById('searchBarDrop');

document.getElementById('searchToggle').addEventListener('click', () => {
  searchBarDrop.classList.add('open');
  searchInput.focus();
});

document.getElementById('searchClose').addEventListener('click', () => {
  searchBarDrop.classList.remove('open');
  searchInput.value = '';
  fetchArtisans();
});

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchArtisans, 400);
});


document.querySelectorAll('[data-scroll]').forEach(btn => {
  btn.addEventListener('click', () => {
    const el = document.getElementById(btn.dataset.scroll);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
});
document.querySelectorAll('button[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    filterCat.value = btn.dataset.filter;
    fetchArtisans();
    document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
  });
});


document.getElementById('listCraftBtn').addEventListener('click', openModal);
document.getElementById('joinBtn').addEventListener('click', openModal);
document.getElementById('footerJoin').addEventListener('click', e => { e.preventDefault(); openModal(); });


document.getElementById('nlForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('nl-email').value.trim();
  if (!email) return;
  document.getElementById('nl-email').value = '';
  showToast(' Subscribed successfully!');
});

document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const name  = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const msg   = document.getElementById('c-msg').value.trim();
  let ok = true;
  ok = setV('cgrp-name',  name.length >= 2) && ok;
  ok = setV('cgrp-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
  ok = setV('cgrp-msg',   msg.length >= 5) && ok;
  if (!ok) return;
  document.getElementById('contactForm').reset();
  showToast(' Message sent! We will get back to you.');
});

function setV(id, ok) {
  document.getElementById(id).classList.toggle('invalid', !ok);
  return ok;
}

async function fetchArtisans() {
  showLoading();
  try {
    const params = new URLSearchParams();
    if (filterCat.value)    params.set('category', filterCat.value);
    if (filterLoc.value)    params.set('location',  filterLoc.value);
    if (filterStatus.value) params.set('status',    filterStatus.value);
    if (searchInput.value.trim()) params.set('q',   searchInput.value.trim());

    const url = params.toString() ? `${API}?${params}` : API;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Server error');

    const artisans = await res.json();
    renderGrid(artisans);
  } catch {
    showError();
  }
}

function renderGrid(artisans) {
  grid.innerHTML = '';
  if (!artisans.length) {
    grid.innerHTML = `<div class="state-msg"><span class="icon">🪴</span><p>No artisans found.</p></div>`;
    return;
  }
  artisans.forEach((a, i) => {
    const card = document.createElement('article');
    card.className = 'artisan-card';
    card.style.animationDelay = `${i * 0.05}s`;
    card.setAttribute('role', 'listitem');
    const img   = a.image || 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400';
    const stars = '★'.repeat(Math.round(a.rating || 0)) + '☆'.repeat(5 - Math.round(a.rating || 0));
    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${img}" alt="${a.name}" loading="lazy" />
        ${a.featured ? '<span class="card-badge">FEATURED</span>' : ''}
        ${a.status === 'inactive' ? '<span class="card-status-inactive">INACTIVE</span>' : ''}
      </div>
      <div class="card-body">
        <p class="card-category">${a.category} · ${a.location}</p>
        <h3 class="card-name">${a.name}</h3>
        <p class="card-owner">by ${a.owner}</p>
        <div class="card-footer">
          <span class="card-price">PKR ${Number(a.price).toLocaleString()}</span>
          <span class="card-rating">${stars}</span>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

function showLoading() {
  grid.innerHTML = `<div class="state-msg"><div class="spinner"></div><p>Loading…</p></div>`;
}
function showError() {
  grid.innerHTML = `<div class="state-msg error"><span class="icon">⚠️</span><p>Could not connect. Is JSON Server running?</p></div>`;
}

filterCat.addEventListener('change', fetchArtisans);
filterLoc.addEventListener('change', fetchArtisans);
filterStatus.addEventListener('change', fetchArtisans);


function openModal() {
  addForm.reset();
  addForm.querySelectorAll('.invalid').forEach(g => g.classList.remove('invalid'));
  addModal.classList.add('open');
}
document.getElementById('closeModal').addEventListener('click',  () => addModal.classList.remove('open'));
document.getElementById('cancelModal').addEventListener('click', () => addModal.classList.remove('open'));
addModal.addEventListener('click', e => { if (e.target === addModal) addModal.classList.remove('open'); });

function vf(id, ok) {
  document.getElementById(id).classList.toggle('invalid', !ok);
  return ok;
}
function validateForm() {
  const n   = document.getElementById('inp-name').value.trim();
  const o   = document.getElementById('inp-owner').value.trim();
  const c   = document.getElementById('inp-category').value;
  const l   = document.getElementById('inp-location').value.trim();
  const d   = document.getElementById('inp-description').value.trim();
  const p   = parseFloat(document.getElementById('inp-price').value);
  const s   = parseInt(document.getElementById('inp-stock').value);
  const img = document.getElementById('inp-image').value.trim();
  let ok = true;
  ok = vf('grp-name',        n.length >= 2)  && ok;
  ok = vf('grp-owner',       o.length >= 2)  && ok;
  ok = vf('grp-category',    c !== '')       && ok;
  ok = vf('grp-location',    l.length >= 2)  && ok;
  ok = vf('grp-description', d.length >= 20) && ok;
  ok = vf('grp-price',       !isNaN(p) && p > 0)  && ok;
  ok = vf('grp-stock',       !isNaN(s) && s >= 0) && ok;
  if (img) ok = vf('grp-image', img.startsWith('http')) && ok;
  return ok;
}


addForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!validateForm()) return;
  const payload = {
    name:        document.getElementById('inp-name').value.trim(),
    owner:       document.getElementById('inp-owner').value.trim(),
    category:    document.getElementById('inp-category').value,
    location:    document.getElementById('inp-location').value.trim(),
    description: document.getElementById('inp-description').value.trim(),
    price:       parseFloat(document.getElementById('inp-price').value),
    stock:       parseInt(document.getElementById('inp-stock').value),
    rating: 4.0, featured: false, status: 'active',
    image:  document.getElementById('inp-image').value.trim() ||
            'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400',
    createdAt: new Date().toISOString().slice(0,10)
  };
  const btn = addForm.querySelector('[type="submit"]');
  btn.disabled = true; btn.textContent = 'SUBMITTING…';
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error();
    addModal.classList.remove('open');
    showToast('Artisan listed successfully!');
    await fetchArtisans();
  } catch {
    showToast(' Could not submit. Is JSON Server running?', true);
  } finally {
    btn.disabled = false; btn.textContent = 'SUBMIT LISTING';
  }
});

let tt;
function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.background = isError ? '#c0392b' : '#1a1a1a';
  toast.style.display = 'block';
  clearTimeout(tt);
  tt = setTimeout(() => toast.style.display = 'none', 3500);
}

/* ===== INIT ===== */
fetchArtisans();