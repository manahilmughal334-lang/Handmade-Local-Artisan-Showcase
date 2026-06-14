const API = 'http://localhost:3000/artisans';


const currentUser = JSON.parse(localStorage.getItem('artisan_user') || 'null');
if (!currentUser) window.location.href = 'login.html';


const toast          = document.getElementById('toast');
const adminTableBody = document.getElementById('adminTableBody');
const adminForm      = document.getElementById('adminForm');
const deleteModal    = document.getElementById('deleteModal');

let allArtisans    = [];
let deleteTargetId = null;


document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('artisan_user');
  window.location.href = 'login.html';
});

document.querySelectorAll('.anav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchView(btn.dataset.view);
    setNavActive(btn.dataset.view);
  });
});

function switchView(viewName) {
  document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + viewName).classList.add('active');
  if (viewName === 'dashboard') loadDashboard();
  if (viewName === 'artisans')  fetchAndRenderTable();
  if (viewName === 'add')       setFormMode('add');
}

function setNavActive(viewName) {
  document.querySelectorAll('.anav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === viewName);
  });
}

document.getElementById('addFromListBtn').addEventListener('click', () => {
  switchView('add'); setNavActive('add');
});
document.getElementById('cancelEditBtn').addEventListener('click', () => {
  switchView('artisans'); setNavActive('artisans');
});

function setFormMode(mode, artisan = null) {
  adminForm.reset();
  adminForm.querySelectorAll('.invalid').forEach(g => g.classList.remove('invalid'));
  if (mode === 'add') {
    document.getElementById('editId').value = '';
    document.getElementById('formViewTitle').textContent  = 'Add New Artisan';
    document.getElementById('formViewSub').textContent    = 'Fill in the details to add a new listing';
    document.getElementById('submitFormBtn').textContent  = 'SAVE ARTISAN';
    document.getElementById('a-status').value = 'active';
  } else {
    document.getElementById('editId').value               = artisan.id;
    document.getElementById('formViewTitle').textContent  = 'Edit Artisan';
    document.getElementById('formViewSub').textContent    = `Editing: ${artisan.name}`;
    document.getElementById('submitFormBtn').textContent  = 'UPDATE ARTISAN';
    document.getElementById('a-name').value        = artisan.name        || '';
    document.getElementById('a-owner').value       = artisan.owner       || '';
    document.getElementById('a-category').value    = artisan.category    || '';
    document.getElementById('a-location').value    = artisan.location    || '';
    document.getElementById('a-description').value = artisan.description || '';
    document.getElementById('a-price').value       = artisan.price       || '';
    document.getElementById('a-stock').value       = artisan.stock       || '';
    document.getElementById('a-rating').value      = artisan.rating      || '';
    document.getElementById('a-image').value       = artisan.image       || '';
    document.getElementById('a-status').value      = artisan.status      || 'active';
    document.getElementById('a-featured').checked  = artisan.featured    || false;
  }
}


function avf(id, ok) {
  document.getElementById(id).classList.toggle('invalid', !ok);
  return ok;
}

function validateAdminForm() {
  const name   = document.getElementById('a-name').value.trim();
  const owner  = document.getElementById('a-owner').value.trim();
  const cat    = document.getElementById('a-category').value;
  const loc    = document.getElementById('a-location').value.trim();
  const desc   = document.getElementById('a-description').value.trim();
  const price  = parseFloat(document.getElementById('a-price').value);
  const stock  = parseInt(document.getElementById('a-stock').value);
  const rating = parseFloat(document.getElementById('a-rating').value);
  const img    = document.getElementById('a-image').value.trim();
  let ok = true;
  ok = avf('agrp-name',        name.length >= 2)            && ok;
  ok = avf('agrp-owner',       owner.length >= 2)           && ok;
  ok = avf('agrp-category',    cat !== '')                   && ok;
  ok = avf('agrp-location',    loc.length >= 2)              && ok;
  ok = avf('agrp-description', desc.length >= 20)            && ok;
  ok = avf('agrp-price',       !isNaN(price) && price > 0)  && ok;
  ok = avf('agrp-stock',       !isNaN(stock) && stock >= 0) && ok;
  if (document.getElementById('a-rating').value !== '') {
    ok = avf('agrp-rating', !isNaN(rating) && rating >= 0 && rating <= 5) && ok;
  }
  if (img) ok = avf('agrp-image', img.startsWith('http')) && ok;
  return ok;
}
async function createArtisan(payload) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('POST failed');
  return res.json();
}


async function updateArtisan(id, payload) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('PUT failed');
  return res.json();
}


async function deleteArtisan(id) {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('DELETE failed');
  return true;
}


adminForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!validateAdminForm()) return;

  const ratingVal = document.getElementById('a-rating').value;
  const payload = {
    name:        document.getElementById('a-name').value.trim(),
    owner:       document.getElementById('a-owner').value.trim(),
    category:    document.getElementById('a-category').value,
    location:    document.getElementById('a-location').value.trim(),
    description: document.getElementById('a-description').value.trim(),
    price:       parseFloat(document.getElementById('a-price').value),
    stock:       parseInt(document.getElementById('a-stock').value),
    rating:      ratingVal !== '' ? parseFloat(ratingVal) : 4.0,
    featured:    document.getElementById('a-featured').checked,
    status:      document.getElementById('a-status').value,
    image:       document.getElementById('a-image').value.trim() ||
                 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400',
    createdAt:   new Date().toISOString().slice(0, 10)
  };

  const editId = document.getElementById('editId').value;
  const btn    = document.getElementById('submitFormBtn');
  btn.disabled = true;
  btn.textContent = editId ? 'UPDATING…' : 'SAVING…';

  try {
    if (editId) {
      await updateArtisan(editId, payload);
      showToast('✅ Artisan updated successfully!');
    } else {
      await createArtisan(payload);
      showToast('✅ Artisan added successfully!');
    }
    switchView('artisans');
    setNavActive('artisans');
  } catch {
    showToast('❌ Error saving. Is JSON Server running?', true);
  } finally {
    btn.disabled = false;
    btn.textContent = editId ? 'UPDATE ARTISAN' : 'SAVE ARTISAN';
  }
});


async function fetchAndRenderTable() {
  adminTableBody.innerHTML = `<tr><td colspan="7" class="table-loading"><div class="spinner" style="margin:1rem auto;"></div></td></tr>`;
  const cat    = document.getElementById('adminFilterCat').value;
  const status = document.getElementById('adminFilterStatus').value;
  const params = new URLSearchParams();
  if (cat)    params.set('category', cat);
  if (status) params.set('status',   status);
  const url = params.toString() ? `${API}?${params}` : API;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    allArtisans = await res.json();
    renderTable(allArtisans);
  } catch {
    adminTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#c0392b;padding:2rem;">⚠️ Could not connect. Is JSON Server running?</td></tr>`;
  }
}

function renderTable(artisans) {
  if (!artisans.length) {
    adminTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#666;">No artisans found.</td></tr>`;
    return;
  }
  adminTableBody.innerHTML = '';
  artisans.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="table-artisan-info">
          <img src="${a.image || 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=60'}" alt="${a.name}" class="table-thumb" />
          <div>
            <p class="table-name">${a.name}</p>
            <p class="table-owner">by ${a.owner}</p>
          </div>
        </div>
      </td>
      <td>${a.category}</td>
      <td>${a.location}</td>
      <td>PKR ${Number(a.price).toLocaleString()}</td>
      <td>${a.stock}</td>
      <td><span class="status-pill ${a.status === 'active' ? 'pill-active' : 'pill-inactive'}">${a.status}</span></td>
      <td>
        <div class="table-actions">
          <button class="tbl-btn tbl-edit" data-id="${a.id}">✏️ Edit</button>
          <button class="tbl-btn tbl-delete" data-id="${a.id}" data-name="${a.name}">🗑️ Delete</button>
        </div>
      </td>`;
    adminTableBody.appendChild(tr);
  });

  document.querySelectorAll('.tbl-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const artisan = allArtisans.find(a => a.id == btn.dataset.id);
      if (!artisan) return;
      setFormMode('edit', artisan);
      switchView('add');
      setNavActive('add');
    });
  });

  document.querySelectorAll('.tbl-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteTargetId = btn.dataset.id;
      document.getElementById('deleteModalMsg').textContent =
        `Are you sure you want to delete "${btn.dataset.name}"? This cannot be undone.`;
      deleteModal.classList.add('open');
    });
  });
}

/* ===== FILTERS ===== */
document.getElementById('adminFilterCat').addEventListener('change', fetchAndRenderTable);
document.getElementById('adminFilterStatus').addEventListener('change', fetchAndRenderTable);

/* ===== DELETE MODAL ===== */
document.getElementById('cancelDelete').addEventListener('click', () => {
  deleteModal.classList.remove('open');
  deleteTargetId = null;
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
  if (!deleteTargetId) return;
  const btn = document.getElementById('confirmDelete');
  btn.disabled = true; btn.textContent = 'DELETING…';
  try {
    await deleteArtisan(deleteTargetId);
    deleteModal.classList.remove('open');
    showToast('🗑️ Artisan deleted.');
    await fetchAndRenderTable();
    await loadDashboard();
  } catch {
    showToast('❌ Could not delete. Is JSON Server running?', true);
  } finally {
    btn.disabled = false; btn.textContent = 'DELETE';
    deleteTargetId = null;
  }
});


async function loadDashboard() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error();
    const artisans = await res.json();

    const total      = artisans.length;
    const active     = artisans.filter(a => a.status === 'active').length;
    const featured   = artisans.filter(a => a.featured).length;
    const avgRating  = total ? (artisans.reduce((s, a) => s + (a.rating || 0), 0) / total).toFixed(1) : '0.0';
    const avgPrice   = total ? Math.round(artisans.reduce((s, a) => s + (a.price || 0), 0) / total).toLocaleString() : '0';
    const totalStock = artisans.reduce((s, a) => s + (a.stock || 0), 0);

    document.getElementById('statTotal').textContent    = total;
    document.getElementById('statActive').textContent   = active;
    document.getElementById('statRating').textContent   = avgRating;
    document.getElementById('statAvgPrice').textContent = avgPrice;
    document.getElementById('statStock').textContent    = totalStock;
    document.getElementById('statFeatured').textContent = featured;

    const cats = {};
    artisans.forEach(a => { cats[a.category] = (cats[a.category] || 0) + 1; });
    const maxCount = Math.max(...Object.values(cats), 1);
    document.getElementById('categoryBars').innerHTML = Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => `
        <div class="cat-bar-row">
          <span class="cat-bar-label">${cat}</span>
          <div class="cat-bar-track">
            <div class="cat-bar-fill" style="width:${(count / maxCount * 100).toFixed(0)}%"></div>
          </div>
          <span class="cat-bar-count">${count}</span>
        </div>`).join('');
  } catch {
    showToast('⚠️ Could not load stats.', true);
  }
}

let tt;
function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.background = isError ? '#c0392b' : '#1a1a1a';
  toast.style.display = 'block';
  clearTimeout(tt);
  tt = setTimeout(() => toast.style.display = 'none', 3500);
}

loadDashboard();