async function renderStockIn() {
  return `
    <div class="page active" id="page-stock-in">
      <div class="header">
        <div class="header-back" onclick="window.history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Back</span>
        </div>
        <div class="header-title" style="margin-top: 4px;">Stock In</div>
      </div>

      <div class="card">
        <form id="stock-in-form">
          <div class="form-group">
            <label class="form-label">Product *</label>
            <div style="position: relative;">
              <input type="text" class="form-input" id="si-product-search" placeholder="Search product..." autocomplete="off">
              <div id="si-product-results" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #dee2e6; border-radius: 12px; margin-top: 4px; max-height: 200px; overflow-y: auto; z-index: 100; display: none;"></div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Vendor *</label>
            <div style="position: relative;">
              <input type="text" class="form-input" id="si-vendor-search" placeholder="Search vendor..." autocomplete="off">
              <div id="si-vendor-results" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #dee2e6; border-radius: 12px; margin-top: 4px; max-height: 200px; overflow-y: auto; z-index: 100; display: none;"></div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Quantity *</label>
            <input type="number" class="form-input" id="si-quantity" step="any" min="0.01" placeholder="0.00" required>
          </div>

          <div class="form-group">
            <label class="form-label">Location *</label>
            <select class="form-select" id="si-location" required>
              <option value="">Select location</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Date & Time</label>
            <input type="datetime-local" class="form-input" id="si-date">
          </div>

          <button type="submit" class="btn btn-success btn-block btn-large" id="si-submit">Save Stock In</button>
        </form>
      </div>
    </div>
  `;
}

async function initStockIn() {
  const locations = await apiCall('/locations');
  const locationSelect = document.getElementById('si-location');
  if (locationSelect && locations) {
    locationSelect.innerHTML = '<option value="">Select location</option>';
    locations.forEach(loc => {
      locationSelect.innerHTML += `<option value="${loc.id}">${loc.name}</option>`;
    });
  }

  const now = new Date();
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const dateInput = document.getElementById('si-date');
  if (dateInput) dateInput.value = localIso;

  setupSearchSelector('si-product-search', 'si-product-results', '/products?limit=10', 'name', () => {}, 'Add New Product');
  setupSearchSelector('si-vendor-search', 'si-vendor-results', '/vendors?limit=10', 'name', () => {}, 'Add New Vendor');

  const form = document.getElementById('stock-in-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('si-submit');
      btn.disabled = true;
      btn.textContent = 'Saving...';

      const quantity = parseFloat(document.getElementById('si-quantity').value);
      const location_id = document.getElementById('si-location').value;

      if (!window._selectedStockInProduct) {
        showToast('Please select a product', 'error');
        btn.disabled = false;
        btn.textContent = 'Save Stock In';
        return;
      }

      if (!window._selectedStockInVendor) {
        showToast('Please select a vendor', 'error');
        btn.disabled = false;
        btn.textContent = 'Save Stock In';
        return;
      }

      const result = await apiCall('/transactions/stock-in', {
        method: 'POST',
        body: JSON.stringify({
          product_id: window._selectedStockInProduct.id,
          vendor_id: window._selectedStockInVendor.id,
          quantity,
          location_id,
        }),
      });

      if (result) {
        const stock = await apiCall(`/inventory/${window._selectedStockInProduct.id}`);
        const locationName = locationSelect.options[locationSelect.selectedIndex].text;

        const app = document.getElementById('app');
        app.innerHTML = `
          <div class="page active" id="page-success">
            <div class="header">
              <div class="header-back" onclick="window.location.hash='#/stock-in'">
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
              <h2 style="font-size: 22px; margin-bottom: 8px;">Stock In Recorded!</h2>
              <p style="color: #6c757d; margin-bottom: 24px;">
                <strong>${window._selectedStockInProduct.name}</strong><br>
                +${formatNumber(quantity)} units added<br>
                Location: ${locationName}
              </p>
              ${stock ? `
                <div style="background: #f5f5f5; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: left;">
                  <div style="font-size: 13px; color: #6c757d; margin-bottom: 8px;">Current Stock at ${locationName}</div>
                  <div style="font-size: 28px; font-weight: 700; color: #2d6a4f;">${formatNumber(stock.stock_by_location?.find(l => l.location_id === location_id)?.quantity || 0)}</div>
                </div>
              ` : ''}
              <div style="display: flex; gap: 12px;">
                <button class="btn btn-primary" style="flex: 1;" onclick="window.location.hash='#/stock-in'">Add Another</button>
                <button class="btn btn-outline" style="flex: 1;" onclick="window.location.hash='#/'">Go Home</button>
              </div>
            </div>
          </div>
        `;
      } else {
        btn.disabled = false;
        btn.textContent = 'Save Stock In';
      }
    });
  }
}

registerPage('stock-in', renderStockIn, initStockIn);
