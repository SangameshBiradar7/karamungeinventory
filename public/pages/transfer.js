async function renderTransfer() {
  return `
    <div class="page active" id="page-transfer">
      <div class="header">
        <div class="header-back" onclick="window.history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Back</span>
        </div>
        <div class="header-title" style="margin-top: 4px;">Transfer Stock</div>
      </div>

      <div class="card">
        <form id="transfer-form">
          <div class="form-group">
            <label class="form-label">Product *</label>
            <div style="position: relative;">
              <input type="text" class="form-input" id="tr-product-search" placeholder="Search product..." autocomplete="off">
              <div id="tr-product-results" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #dee2e6; border-radius: 12px; margin-top: 4px; max-height: 200px; overflow-y: auto; z-index: 100; display: none;"></div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Quantity *</label>
            <input type="number" class="form-input" id="tr-quantity" step="any" min="0.01" placeholder="0.00" required>
            <div id="tr-available-stock" style="font-size: 12px; color: #6c757d; margin-top: 4px;"></div>
          </div>

          <div class="form-group">
            <label class="form-label">From Location *</label>
            <select class="form-select" id="tr-from-location" required>
              <option value="">Select location</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">To Location *</label>
            <select class="form-select" id="tr-to-location" required>
              <option value="">Select location</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Date & Time</label>
            <input type="datetime-local" class="form-input" id="tr-date">
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-large" id="tr-submit" style="background: #3498db;">Transfer Stock</button>
        </form>
      </div>
    </div>
  `;
}

async function initTransfer() {
  const locations = await apiCall('/locations');
  const fromSelect = document.getElementById('tr-from-location');
  const toSelect = document.getElementById('tr-to-location');

  if (fromSelect && toSelect && locations) {
    fromSelect.innerHTML = '<option value="">Select location</option>';
    toSelect.innerHTML = '<option value="">Select location</option>';
    locations.forEach(loc => {
      fromSelect.innerHTML += `<option value="${loc.id}">${loc.name}</option>`;
      toSelect.innerHTML += `<option value="${loc.id}">${loc.name}</option>`;
    });
  }

  const now = new Date();
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const dateInput = document.getElementById('tr-date');
  if (dateInput) dateInput.value = localIso;

  setupSearchSelector('tr-product-search', 'tr-product-results', '/products?limit=10', 'name', () => {}, null);

  const updateAvailableStock = async () => {
    const stockEl = document.getElementById('tr-available-stock');
    if (!stockEl || !window._selectedTransferProduct || !fromSelect.value) {
      if (stockEl) stockEl.textContent = '';
      return;
    }

    const locationId = fromSelect.value;
    const result = await apiCall(`/inventory/${window._selectedTransferProduct.id}`);
    if (result) {
      const stockAtLocation = result.stock_by_location?.find(l => l.location_id === locationId);
      const qty = stockAtLocation ? stockAtLocation.quantity : 0;
      stockEl.textContent = `Available stock at ${fromSelect.options[fromSelect.selectedIndex].text}: ${formatNumber(qty)}`;
    }
  };

  if (fromSelect) {
    fromSelect.addEventListener('change', updateAvailableStock);
  }

  const form = document.getElementById('transfer-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('tr-submit');
      btn.disabled = true;
      btn.textContent = 'Transferring...';

      const quantity = parseFloat(document.getElementById('tr-quantity').value);
      const from_location_id = fromSelect.value;
      const to_location_id = toSelect.value;

      if (from_location_id === to_location_id) {
        showToast('Source and destination must be different', 'error');
        btn.disabled = false;
        btn.textContent = 'Transfer Stock';
        return;
      }

      if (!window._selectedTransferProduct) {
        showToast('Please select a product', 'error');
        btn.disabled = false;
        btn.textContent = 'Transfer Stock';
        return;
      }

      const result = await apiCall('/transactions/transfer', {
        method: 'POST',
        body: JSON.stringify({
          product_id: window._selectedTransferProduct.id,
          quantity,
          from_location_id,
          to_location_id,
        }),
      });

      if (result) {
        const fromName = fromSelect.options[fromSelect.selectedIndex].text;
        const toName = toSelect.options[toSelect.selectedIndex].text;

        const app = document.getElementById('app');
        app.innerHTML = `
          <div class="page active" id="page-success">
            <div class="header">
              <div class="header-back" onclick="window.location.hash='#/transfer'">
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
              <h2 style="font-size: 22px; margin-bottom: 8px;">Transfer Complete!</h2>
              <p style="color: #6c757d; margin-bottom: 24px;">
                <strong>${window._selectedTransferProduct.name}</strong><br>
                ${formatNumber(quantity)} units transferred<br>
                From: ${fromName} → To: ${toName}
              </p>
              <div style="display: flex; gap: 12px;">
                <button class="btn btn-primary" style="flex: 1;" onclick="window.location.hash='#/transfer'">Transfer Another</button>
                <button class="btn btn-outline" style="flex: 1;" onclick="window.location.hash='#/'">Go Home</button>
              </div>
            </div>
          </div>
        `;
      } else {
        btn.disabled = false;
        btn.textContent = 'Transfer Stock';
      }
    });
  }
}

registerPage('transfer', renderTransfer, initTransfer);
