async function renderDashboard() {
  return `
    <div class="page active" id="page-dashboard">
      <div class="header">
        <div class="header-title">Karamunge Traders</div>
        <div class="header-subtitle">Hello, ${currentUser?.name || 'User'}</div>
      </div>

      <div style="padding: 16px 0;">
        <div class="card" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <a href="#/stock-in" style="text-decoration: none;">
            <div style="background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; min-height: 100px; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 2px 8px rgba(45,106,79,0.3);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin: 0 auto 8px;">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <div style="font-size: 15px; font-weight: 600;">Stock In</div>
            </div>
          </a>
          <a href="#/stock-out" style="text-decoration: none;">
            <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; min-height: 100px; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 2px 8px rgba(231,76,60,0.3);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin: 0 auto 8px;">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <div style="font-size: 15px; font-weight: 600;">Stock Out</div>
            </div>
          </a>
        </div>
      </div>

      <div id="dashboard-summary">
        <div class="skeleton"></div>
        <div class="skeleton"></div>
      </div>

      <div id="dashboard-inventory">
        <div class="card">
          <div class="card-title">Current Inventory</div>
          <div class="skeleton" style="height: 200px;"></div>
        </div>
      </div>

      <div id="dashboard-receiving">
        <div class="card">
          <div class="card-title">Today's Receiving</div>
          <div class="skeleton" style="height: 150px;"></div>
        </div>
      </div>

      <div id="dashboard-stockout" style="margin-bottom: 16px;">
        <div class="card">
          <div class="card-title">Recent Stock Out</div>
          <div class="skeleton" style="height: 150px;"></div>
        </div>
      </div>
    </div>
  `;
}

async function initDashboard() {
  try {
    const [summary, inventory, receiving, stockOut] = await Promise.all([
      apiCall('/reports/inventory'),
      apiCall('/inventory'),
      apiCall('/reports/receiving?period=today'),
      apiCall('/reports/stock-out?period=today'),
    ]);

    if (!summary || !inventory) return;

    const totalProducts = inventory.length;
    const totalStock = inventory.reduce((sum, item) => sum + item.total, 0);

    let todayInQty = 0;
    let todayOutQty = 0;

    if (receiving && receiving.transactions) {
      todayInQty = receiving.transactions.reduce((sum, t) => sum + parseFloat(t.quantity), 0);
    }

    if (stockOut && stockOut.transactions) {
      todayOutQty = stockOut.transactions.reduce((sum, t) => sum + parseFloat(t.quantity), 0);
    }

    const summaryHtml = `
      <div class="card">
        <div class="card-title">Today's Summary</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <div style="background: #d4edda; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; color: #155724; font-weight: 600;">IN Today</div>
            <div style="font-size: 20px; font-weight: 700; color: #155724;">${formatNumber(todayInQty)}</div>
          </div>
          <div style="background: #f8d7da; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; color: #721c24; font-weight: 600;">OUT Today</div>
            <div style="font-size: 20px; font-weight: 700; color: #721c24;">${formatNumber(todayOutQty)}</div>
          </div>
          <div style="background: #d1ecf1; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; color: #0c5460; font-weight: 600;">Products</div>
            <div style="font-size: 20px; font-weight: 700; color: #0c5460;">${totalProducts}</div>
          </div>
          <div style="background: #fff3cd; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; color: #856404; font-weight: 600;">Total Stock</div>
            <div style="font-size: 20px; font-weight: 700; color: #856404;">${formatNumber(totalStock)}</div>
          </div>
        </div>
      </div>
    `;

    const summaryEl = document.getElementById('dashboard-summary');
    if (summaryEl) summaryEl.innerHTML = summaryHtml;

    const top5 = inventory.slice(0, 5);
    const inventoryHtml = top5.length === 0
      ? '<div class="empty-state"><p>No products in inventory</p></div>'
      : top5.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f5f5f5; cursor: pointer;" onclick="window.location.hash='#/inventory/${item.product.id}'">
          <div>
            <div style="font-weight: 500; font-size: 14px;">${item.product.name}</div>
            <div style="font-size: 12px; color: #6c757d;">Total: ${formatNumber(item.total)}</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      `).join('');

    const invEl = document.getElementById('dashboard-inventory');
    if (invEl) {
      invEl.innerHTML = `
        <div class="card">
          <div class="card-title">Current Inventory</div>
          ${inventoryHtml}
        </div>
      `;
    }

    const recentReceiving = receiving && receiving.transactions ? receiving.transactions.slice(0, 3) : [];
    const receivingHtml = recentReceiving.length === 0
      ? '<div class="empty-state"><p>No receiving today</p></div>'
      : recentReceiving.map(t => `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f5f5;">
          <div>
            <div style="font-weight: 500; font-size: 14px;">${t.product?.name || t.item_name_snapshot || 'Unknown'}</div>
            <div style="font-size: 12px; color: #6c757d;">${t.vendor?.name || 'Unknown'} • ${formatDate(t.transaction_date)}</div>
          </div>
          <span class="badge badge-success">+${formatNumber(t.quantity)}</span>
        </div>
      `).join('');

    const recEl = document.getElementById('dashboard-receiving');
    if (recEl) {
      recEl.innerHTML = `
        <div class="card">
          <div class="card-title">Today's Receiving</div>
          ${receivingHtml}
          ${recentReceiving.length > 0 ? `<a href="#/receiving" style="display: block; text-align: center; color: #2d6a4f; font-size: 13px; font-weight: 600; padding: 8px;">View All</a>` : ''}
        </div>
      `;
    }

    const recentOut = stockOut && stockOut.transactions ? stockOut.transactions.slice(0, 3) : [];
    const stockOutHtml = recentOut.length === 0
      ? '<div class="empty-state"><p>No stock out today</p></div>'
      : recentOut.map(t => `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f5f5;">
          <div>
            <div style="font-weight: 500; font-size: 14px;">${t.product?.name || t.item_name_snapshot || 'Unknown'}</div>
            <div style="font-size: 12px; color: #6c757d;">${t.source_location?.name || 'Unknown'} • ${formatDate(t.transaction_date)}</div>
          </div>
          <span class="badge badge-danger">-${formatNumber(t.quantity)}</span>
        </div>
      `).join('');

    const outEl = document.getElementById('dashboard-stockout');
    if (outEl) {
      outEl.innerHTML = `
        <div class="card">
          <div class="card-title">Recent Stock Out</div>
          ${stockOutHtml}
        </div>
      `;
    }
  } catch (error) {
    console.error('Dashboard error:', error);
  }
}

registerPage('dashboard', renderDashboard, initDashboard);
