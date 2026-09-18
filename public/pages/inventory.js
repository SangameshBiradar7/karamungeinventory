async function renderInventory() {
  return `
    <div class="page active" id="page-inventory">
      <div class="header">
        <div class="header-title">Inventory</div>
      </div>

      <div class="search-bar" style="position: relative;">
        <span class="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input type="text" class="search-input" id="inv-search" placeholder="Search products...">
      </div>

      <div id="inv-summary" style="padding: 16px 16px 0;"></div>
      <div id="inv-list">
        <div class="skeleton" style="height: 400px;"></div>
      </div>
    </div>
  `;
}

async function initInventory() {
  const inventory = await apiCall('/inventory');

  const totalProducts = inventory.length;
  const totalStock = inventory.reduce((sum, item) => sum + item.total, 0);

  const summaryEl = document.getElementById('inv-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="card" style="margin-top: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="background: #d1ecf1; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 12px; color: #0c5460; font-weight: 600;">Products</div>
          <div style="font-size: 20px; font-weight: 700; color: #0c5460;">${totalProducts}</div>
        </div>
        <div style="background: #fff3cd; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 12px; color: #856404; font-weight: 600;">Total Stock</div>
          <div style="font-size: 20px; font-weight: 700; color: #856404;">${formatNumber(totalStock)}</div>
        </div>
      </div>
    `;
  }

  const renderList = (items) => {
    if (items.length === 0) {
      return '<div class="empty-state"><p>No products found</p></div>';
    }

    return items.map(item => `
      <div class="card" style="cursor: pointer;" onclick="window.location.hash='#/inventory/${item.product.id}'">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 15px; margin-bottom: 6px;">${item.product.name}</div>
            <div style="display: flex; gap: 12px; font-size: 12px; color: #6c757d;">
              <span>Main Store: <strong>${formatNumber(item.mainStore)}</strong></span>
              <span>Cold Room: <strong>${formatNumber(item.coldRoom)}</strong></span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 700; color: #2d6a4f;">${formatNumber(item.total)}</div>
            <div style="font-size: 11px; color: #6c757d;">Total</div>
          </div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2" style="float: right; margin-top: -20px;">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    `).join('');
  };

  const listEl = document.getElementById('inv-list');
  if (listEl) {
    listEl.innerHTML = renderList(inventory);
  }

  const searchInput = document.getElementById('inv-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = inventory.filter(item => item.product.name.toLowerCase().includes(query));
      if (listEl) listEl.innerHTML = renderList(filtered);
    });
  }
}

registerPage('inventory', renderInventory, initInventory);
