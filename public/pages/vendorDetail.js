async function renderVendorDetail(vendorId) {
  return `
    <div class="page active" id="page-vendor-detail">
      <div class="header">
        <div class="header-back" onclick="window.history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Back</span>
        </div>
        <div class="header-title" style="margin-top: 4px;">Vendor Detail</div>
      </div>

      <div id="vendor-detail-content">
        <div class="skeleton" style="height: 300px;"></div>
      </div>
    </div>
  `;
}

async function initVendorDetail(vendorId) {
  const result = await apiCall(`/reports/vendor/${vendorId}`);
  const contentEl = document.getElementById('vendor-detail-content');

  if (!result) {
    if (contentEl) contentEl.innerHTML = '<div class="empty-state"><p>Failed to load vendor details</p></div>';
    return;
  }

  const transactionsHtml = result.transactions.length === 0
    ? '<div class="empty-state"><p>No transactions found</p></div>'
    : result.transactions.map(t => `
        <div class="card" style="margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600; font-size: 14px;">${t.product?.name || 'Unknown'}</div>
              <div style="font-size: 12px; color: #6c757d; margin-top: 4px;">
                ${formatDate(t.transaction_date)} • ${t.destination_location?.name || 'Unknown'}
              </div>
            </div>
            <span class="badge badge-success" style="font-size: 14px; padding: 6px 12px;">+${formatNumber(t.quantity)}</span>
          </div>
        </div>
      `).join('');

  if (contentEl) {
    contentEl.innerHTML = `
      <div class="card" style="margin-top: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="font-size: 20px; font-weight: 700;">Vendor</div>
          <span class="badge badge-success">${result.transactions.length} transactions</span>
        </div>
        <div style="background: #d4edda; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 16px;">
          <div style="font-size: 12px; color: #155724; font-weight: 600;">Total Received</div>
          <div style="font-size: 32px; font-weight: 700; color: #155724;">${formatNumber(result.summary?.total_received || 0)}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Transaction History</div>
        ${transactionsHtml}
      </div>
    `;
  }
}

registerPage('vendor-detail', renderVendorDetail, initVendorDetail);
