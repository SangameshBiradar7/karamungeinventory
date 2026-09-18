async function renderStockOut() {
  return `
    <div class="page active" id="page-stock-out">
      <div class="header">
        <div class="header-back" onclick="window.history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Back</span>
        </div>
        <div class="header-title" style="margin-top: 4px;">Stock Out</div>
      </div>

      <div class="card">
        <form id="stock-out-form">
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 0;">
              <input type="checkbox" id="so-manual-item" style="width: 20px; height: 20px;">
              <span style="font-size: 14px; font-weight: 500;">New / Unregistered Item</span>
            </label>
          </div>

          <div class="form-group" id="so-product-group">
            <label class="form-label">Product</label>
            <div style="position: relative;">
              <input type="text" class="form-input" id="so-product-search" placeholder="Search product..." autocomplete="off">
              <div id="so-product-results" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #dee2e6; border-radius: 12px; margin-top: 4px; max-height: 200px; overflow-y: auto; z-index: 100; display: none;"></div>
            </div>
          </div>

          <div class="form-group" id="so-item-name-group" style="display: none;">
            <label class="form-label">Item Name *</label>
            <input type="text" class="form-input" id="so-item-name" placeholder="Enter item name">
          </div>

          <div class="form-group">
            <label class="form-label">Quantity *</label>
            <input type="number" class="form-input" id="so-quantity" step="any" min="0.01" placeholder="0.00" required>
            <div id="so-available-stock" style="font-size: 12px; color: #6c757d; margin-top: 4px;"></div>
          </div>

          <div class="form-group">
            <label class="form-label">Location (From) *</label>
            <select class="form-select" id="so-location" required>
              <option value="">Select location</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Date & Time</label>
            <input type="datetime-local" class="form-input" id="so-date">
          </div>

          <button type="submit" class="btn btn-danger btn-block btn-large" id="so-submit">Save Stock Out</button>
        </form>
      </div>
    </div>
  `;
}

async function initStockOut() {
  const locations = await apiCall('/locations');
  const locationSelect = document.getElementById('so-location');
  if (locationSelect && locations) {
    locationSelect.innerHTML = '<option value="">Select location</option>';
    locations.forEach(loc => {
      locationSelect.innerHTML += `<option value="${loc.id}">${loc.name}</option>`;
    });
  }

  const now = new Date();
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const dateInput = document.getElementById('so-date');
  if (dateInput) dateInput.value = localIso;

  const manualCheckbox = document.getElementById('so-manual-item');
  const productGroup = document.getElementById('so-product-group');
  const itemNameGroup = document.getElementById('so-item-name-group');

  if (manualCheckbox) {
    manualCheckbox.addEventListener('change', () => {
      const isManual = manualCheckbox.checked;
      productGroup.style.display = isManual ? 'none' : 'block';
      itemNameGroup.style.display = isManual ? 'block' : 'none';
    });
  }

  setupSearchSelector('so-product-search', 'so-product-results', '/products?limit=10', 'name', () => {}, null);

  const updateAvailableStock = async () => {
    const stockEl = document.getElementById('so-available-stock');
    if (!stockEl || !window._selectedStockOutProduct || !locationSelect.value) {
      if (stockEl) stockEl.textContent = '';
      return;
    }

    const locationId = locationSelect.value;
    const result = await apiCall(`/inventory/${window._selectedStockOutProduct.id}`);
    if (result) {
      const stockAtLocation = result.stock_by_location?.find(l => l.location_id === locationId);
      const qty = stockAtLocation ? stockAtLocation.quantity : 0;
      stockEl.textContent = `Available stock at ${locationSelect.options[locationSelect.selectedIndex].text}: ${formatNumber(qty)}`;
    }
  };

  if (locationSelect) {
    locationSelect.addEventListener('change', updateAvailableStock);
  }

  const form = document.getElementById('stock-out-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('so-submit');
      btn.disabled = true;
      btn.textContent = 'Saving...';

      const isManual = manualCheckbox.checked;
      const quantity = parseFloat(document.getElementById('so-quantity').value);
      const location_id = document.getElementById('so-location').value;

      let product_id = null;
      let item_name_snapshot = null;

      if (isManual) {
        item_name_snapshot = document.getElementById('so-item-name').value;
        if (!item_name_snapshot || !item_name_snapshot.trim()) {
          showToast('Please enter item name', 'error');
          btn.disabled = false;
          btn.textContent = 'Save Stock Out';
          return;
        }
      } else {
        if (!window._selectedStockOutProduct) {
          showToast('Please select a product', 'error');
          btn.disabled = false;
          btn.textContent = 'Save Stock Out';
          return;
        }
        product_id = window._selectedStockOutProduct.id;

        const result = await apiCall(`/inventory/${window._selectedStockOutProduct.id}`);
        if (result) {
          const stockAtLocation = result.stock_by_location?.find(l => l.location_id === location_id);
          const available = stockAtLocation ? stockAtLocation.quantity : 0;
          if (quantity > available) {
            showToast(`Insufficient stock. Available: ${formatNumber(available)}`, 'error');
            btn.disabled = false;
            btn.textContent = 'Save Stock Out';
            return;
          }
        }
      }

      const result = await apiCall('/transactions/stock-out', {
        method: 'POST',
        body: JSON.stringify({
          product_id,
          item_name_snapshot,
          quantity,
          location_id,
          is_manual_item: isManual,
        }),
      });

      if (result) {
        const locationName = locationSelect.options[locationSelect.selectedIndex].text;
        const app = document.getElementById('app');
        app.innerHTML = `
          <div class="page active" id="page-success">
            <div class="header">
              <div class="header-back" onclick="window.location.hash='#/stock-out'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                <span>Back</span>
              </div>
              <div class="header-title" style="margin-top: 4px;">Success</div>
            </div>
            <div class="success-screen">
              <div class="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style="font-size: 22px; margin-bottom: 8px;">Stock Out Recorded!</h2>
              <p style="color: #6c757d; margin-bottom: 24px;">
                <strong>${window._selectedStockOutProduct ? window._selectedStockOutProduct.name : item_name_snapshot}</strong><br>
                -${formatNumber(quantity)} units removed<br>
                Location: ${locationName}
              </p>
              <div style="display: flex; gap: 12px;">
                <button class="btn btn-primary" style="flex: 1;" onclick="window.location.hash='#/stock-out'">Add Another</button>
                <button class="btn btn-outline" style="flex: 1;" onclick="window.location.hash='#/'">Go Home</button>
              </div>
            </div>
          </div>
        `;
      } else {
        btn.disabled = false;
        btn.textContent = 'Save Stock Out';
      }
    });
  }
}

registerPage('stock-out', renderStockOut, initStockOut);
