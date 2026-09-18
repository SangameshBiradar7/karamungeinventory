async function renderVendors() {
  return `
    <div class="page active" id="page-vendors">
      <div class="header">
        <div class="header-back" onclick="window.history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Back</span>
        </div>
        <div class="header-title" style="margin-top: 4px;">Vendors</div>
      </div>

      <div class="search-bar" style="position: relative;">
        <span class="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input type="text" class="search-input" id="vend-search" placeholder="Search vendors...">
      </div>

      <div style="padding: 12px 16px;">
        <button class="btn btn-primary btn-block" id="add-vendor-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Vendor
        </button>
      </div>

      <div id="vend-list">
        <div class="skeleton" style="height: 300px;"></div>
      </div>
    </div>
  `;
}

async function initVendors() {
  const loadVendors = async (search = '') => {
    const result = await apiCall(`/vendors?search=${encodeURIComponent(search)}&limit=50`);
    const listEl = document.getElementById('vend-list');

    if (!result || !result.vendors) {
      if (listEl) listEl.innerHTML = '<div class="empty-state"><p>Failed to load vendors</p></div>';
      return;
    }

    if (result.vendors.length === 0) {
      if (listEl) listEl.innerHTML = '<div class="empty-state"><p>No vendors found</p></div>';
      return;
    }

    if (listEl) {
      listEl.innerHTML = result.vendors.map(v => `
        <div class="card" style="margin-top: 8px; cursor: pointer;" onclick="window.location.hash='#/vendors/${v.id}'">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600; font-size: 15px;">${v.name}</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-outline" style="padding: 8px 14px; font-size: 13px;" onclick="event.stopPropagation(); window.editVendor(${v.id}, '${v.name.replace(/'/g, "\\'")}')">Edit</button>
              <button class="btn btn-danger" style="padding: 8px 14px; font-size: 13px;" onclick="event.stopPropagation(); window.deleteVendor(${v.id})">Delete</button>
            </div>
          </div>
        </div>
      `).join('');
    }
  };

  await loadVendors();

  const searchInput = document.getElementById('vend-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => loadVendors(e.target.value));
  }

  document.getElementById('add-vendor-btn')?.addEventListener('click', () => {
    showVendorModal();
  });
}

function showVendorModal(vendorId = null, name = '') {
  const isEdit = vendorId !== null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'vendor-modal';
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">${isEdit ? 'Edit Vendor' : 'Add Vendor'}</div>
        <button class="modal-close" onclick="document.getElementById('vendor-modal').remove()">&times;</button>
      </div>
      <form id="vendor-form">
        <div class="form-group">
          <label class="form-label">Vendor Name *</label>
          <input type="text" class="form-input" id="vend-name" value="${name}" required>
        </div>
        <div style="display: flex; gap: 12px;">
          <button type="button" class="btn btn-outline" style="flex: 1;" onclick="document.getElementById('vendor-modal').remove()">Cancel</button>
          <button type="submit" class="btn btn-primary" style="flex: 1;">Save</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('vendor-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('vend-name').value.trim();

    let result;
    if (isEdit) {
      result = await apiCall(`/vendors/${vendorId}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      });
    } else {
      result = await apiCall('/vendors', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    }

    if (result) {
      document.getElementById('vendor-modal').remove();
      showToast(isEdit ? 'Vendor updated' : 'Vendor added');
      initVendors();
    }
  });
}

window.editVendor = function(id, name) {
  showVendorModal(id, name);
};

window.deleteVendor = async function(id) {
  if (!confirm('Are you sure you want to delete this vendor?')) return;
  const result = await apiCall(`/vendors/${id}`, { method: 'DELETE' });
  if (result) {
    showToast('Vendor deleted');
    initVendors();
  }
};

registerPage('vendors', renderVendors, initVendors);
