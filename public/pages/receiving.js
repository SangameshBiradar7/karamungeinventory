async function renderReceiving() {
  return `
    <div class="page active" id="page-receiving">
      <div class="header">
        <div class="header-back" onclick="window.history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Back</span>
        </div>
        <div class="header-title" style="margin-top: 4px;">Today's Receiving</div>
      </div>

      <div id="receiving-content">
        <div class="skeleton" style="height: 200px;"></div>
      </div>
    </div>
  `;
}

async function initReceiving() {
  const result = await apiCall('/reports/receiving?period=today');
  const contentEl = document.getElementById('receiving-content');

  if (!result) {
    if (contentEl) contentEl.innerHTML = '<div class="empty-state"><p>Failed to load receiving data</p></div>';
    return;
  }

  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const summaryHtml = `
    <div class="card" style="margin-top: 12px;">
      <div style="font-size: 13px; color: #6c757d; margin-bottom: 12px;">${dateStr}</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
        <div style="background: #d4edda; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 11px; color: #155724; font-weight: 600;">Vendors</div>
          <div style="font-size: 20px; font-weight: 700; color: #155724;">${result.summary?.vendor_count || 0}</div>
        </div>
        <div style="background: #d1ecf1; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 11px; color: #0c5460; font-weight: 600;">Products</div>
          <div style="font-size: 20px; font-weight: 700; color: #0c5460;">${result.summary?.product_count || 0}</div>
        </div>
        <div style="background: #fff3cd; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 11px; color: #856404; font-weight: 600;">Total Qty</div>
          <div style="font-size: 20px; font-weight: 700; color: #856404;">${formatNumber(result.summary?.total_quantity || 0)}</div>
        </div>
      </div>
    </div>
  `;

  let transactionsHtml = '';
  if (result.transactions && result.transactions.length > 0) {
    transactionsHtml = result.transactions.map(t => `
      <div class="card" style="margin-top: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 14px;">${t.product?.name || t.item_name_snapshot || 'Unknown'}</div>
            <div style="font-size: 12px; color: #6c757d; margin-top: 4px;">
              Vendor: ${t.vendor?.name || 'Unknown'}<br>
              Location: ${t.destination_location?.name || 'Unknown'}<br>
              ${formatDate(t.transaction_date)}
            </div>
          </div>
          <span class="badge badge-success" style="font-size: 14px; padding: 6px 12px;">+${formatNumber(t.quantity)}</span>
        </div>
      </div>
    `).join('');
  } else {
    transactionsHtml = '<div class="empty-state"><p>No receiving today</p></div>';
  }

  if (contentEl) {
    contentEl.innerHTML = summaryHtml + transactionsHtml;
  }
}

registerPage('receiving', renderReceiving, initReceiving);
