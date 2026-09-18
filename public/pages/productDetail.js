async function renderProductDetail(productId) {
  return `
    <div class="page active" id="page-product-detail">
      <div class="header">
        <div class="header-back" onclick="window.history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Back</span>
        </div>
        <div class="header-title" style="margin-top: 4px;">Product Detail</div>
      </div>

      <div id="product-detail-content">
        <div class="skeleton" style="height: 300px;"></div>
      </div>
    </div>
  `;
}

async function initProductDetail(productId) {
  const result = await apiCall(`/inventory/${productId}`);
  const contentEl = document.getElementById('product-detail-content');

  if (!result) {
    if (contentEl) contentEl.innerHTML = '<div class="empty-state"><p>Failed to load product details</p></div>';
    return;
  }

  const locationCards = result.stock_by_location.map(loc => `
    <div style="background: ${loc.quantity > 0 ? '#d4edda' : '#f8d7da'}; padding: 16px; border-radius: 12px; text-align: center;">
      <div style="font-size: 12px; color: #6c757d; margin-bottom: 4px;">${loc.location_name}</div>
      <div style="font-size: 24px; font-weight: 700; color: ${loc.quantity > 0 ? '#155724' : '#721c24'};">${formatNumber(loc.quantity)}</div>
    </div>
  `).join('');

  const recentTransactions = result.recent_transactions || [];
  const transactionsHtml = recentTransactions.length === 0
    ? '<div class="empty-state"><p>No recent transactions</p></div>'
    : recentTransactions.map(t => {
        let sign = '';
        let badgeClass = 'badge-info';
        if (t.transaction_type === 'STOCK_IN') { sign = '+'; badgeClass = 'badge-success'; }
        else if (t.transaction_type === 'STOCK_OUT') { sign = '-'; badgeClass = 'badge-danger'; }
        else if (t.transaction_type === 'TRANSFER') { badgeClass = 'badge-info'; }
        else { sign = parseFloat(t.quantity) >= 0 ? '+' : ''; badgeClass = 'badge-warning'; }

        return `
          <div class="card" style="margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <span class="badge ${badgeClass}">${t.transaction_type.replace('_', ' ')}</span>
                <div style="font-size: 13px; color: #6c757d; margin-top: 4px;">${formatDate(t.transaction_date)}</div>
              </div>
              <div style="font-size: 18px; font-weight: 700; color: ${badgeClass.includes('success') ? '#155724' : badgeClass.includes('danger') ? '#721c24' : '#0c5460'};">
                ${sign}${formatNumber(t.quantity)}
              </div>
            </div>
          </div>
        `;
      }).join('');

  if (contentEl) {
    contentEl.innerHTML = `
      <div class="card" style="margin-top: 12px;">
        <div style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">${result.product.name}</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
          ${locationCards}
        </div>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 12px; text-align: center;">
          <div style="font-size: 12px; color: #6c757d; margin-bottom: 4px;">Total Stock</div>
          <div style="font-size: 32px; font-weight: 700; color: #2d6a4f;">${formatNumber(result.total_stock)}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Recent Movements</div>
        ${transactionsHtml}
      </div>
    `;
  }
}

registerPage('product-detail', renderProductDetail, initProductDetail);
