async function renderHistory() {
  return `
    <div class="page active" id="page-history">
      <div class="header">
        <div class="header-title">Transaction History</div>
      </div>

      <div class="tabs">
        <button class="tab active" data-filter="all">All</button>
        <button class="tab" data-filter="STOCK_IN">In</button>
        <button class="tab" data-filter="STOCK_OUT">Out</button>
        <button class="tab" data-filter="TRANSFER">Transfer</button>
      </div>

      <div class="search-bar" style="position: relative;">
        <span class="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input type="text" class="search-input" id="hist-search" placeholder="Search transactions...">
      </div>

      <div style="display: flex; gap: 8px; padding: 8px 16px; overflow-x: auto;">
        <button class="tab active" data-period="today" style="border: 1px solid #dee2e6; border-radius: 20px; padding: 6px 14px; font-size: 12px; background: white; cursor: pointer;">Today</button>
        <button class="tab" data-period="week" style="border: 1px solid #dee2e6; border-radius: 20px; padding: 6px 14px; font-size: 12px; background: white; cursor: pointer;">This Week</button>
        <button class="tab" data-period="month" style="border: 1px solid #dee2e6; border-radius: 20px; padding: 6px 14px; font-size: 12px; background: white; cursor: pointer;">This Month</button>
      </div>

      <div id="hist-list">
        <div class="skeleton" style="height: 400px;"></div>
      </div>
    </div>
  `;
}

async function initHistory() {
  let currentFilter = 'all';
  let currentPeriod = 'today';
  let searchQuery = '';

  const loadHistory = async () => {
    let url = `/transactions?page=1&limit=50`;
    if (currentFilter !== 'all') url += `&type=${currentFilter}`;
    if (currentPeriod) url += `&period=${currentPeriod}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    const result = await apiCall(url);
    const listEl = document.getElementById('hist-list');

    if (!result || !result.transactions) {
      if (listEl) listEl.innerHTML = '<div class="empty-state"><p>Failed to load transactions</p></div>';
      return;
    }

    if (result.transactions.length === 0) {
      if (listEl) listEl.innerHTML = '<div class="empty-state"><p>No transactions found</p></div>';
      return;
    }

    if (listEl) {
      listEl.innerHTML = result.transactions.map(t => {
        let typeColor = '#6c757d';
        let typeBg = '#e9ecef';
        let sign = '';
        let locationText = '';

        if (t.transaction_type === 'STOCK_IN') {
          typeColor = '#155724';
          typeBg = '#d4edda';
          sign = '+';
          locationText = t.destination_location?.name || 'Unknown';
        } else if (t.transaction_type === 'STOCK_OUT') {
          typeColor = '#721c24';
          typeBg = '#f8d7da';
          sign = '-';
          locationText = t.source_location?.name || 'Unknown';
        } else if (t.transaction_type === 'TRANSFER') {
          typeColor = '#0c5460';
          typeBg = '#d1ecf1';
          locationText = `${t.source_location?.name || '?'} → ${t.destination_location?.name || '?'}`;
        } else if (t.transaction_type === 'ADJUSTMENT') {
          typeColor = '#856404';
          typeBg = '#fff3cd';
          sign = parseFloat(t.quantity) >= 0 ? '+' : '';
          locationText = t.source_location?.name || 'Unknown';
        }

        return `
          <div class="card" style="margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <span class="badge" style="background: ${typeBg}; color: ${typeColor};">${t.transaction_type.replace('_', ' ')}</span>
              <span style="font-size: 11px; color: #6c757d;">${formatDate(t.transaction_date)}</span>
            </div>
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${t.product?.name || t.item_name_snapshot || 'Unknown'}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
              <div style="font-size: 13px; color: #6c757d;">
                ${t.vendor?.name ? `Vendor: ${t.vendor.name}<br>` : ''}
                Location: ${locationText}
              </div>
              <div style="font-size: 18px; font-weight: 700; color: ${typeColor};">${sign}${formatNumber(t.quantity)}</div>
            </div>
            ${currentUser?.role === 'admin' ? `
              <div style="display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f5f5f5;">
                <button class="btn btn-outline" style="flex: 1; padding: 8px; font-size: 13px;" onclick="window.editTransaction(${t.id})">Edit</button>
                <button class="btn btn-danger" style="flex: 1; padding: 8px; font-size: 13px;" onclick="window.deleteTransaction(${t.id})">Delete</button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }
  };

  await loadHistory();

  document.querySelectorAll('.tab[data-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab[data-filter]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      loadHistory();
    });
  });

  document.querySelectorAll('.tab[data-period]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab[data-period]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentPeriod = tab.dataset.period;
      loadHistory();
    });
  });

  const searchInput = document.getElementById('hist-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      loadHistory();
    });
  }
}

window.editTransaction = async function(id) {
  const t = await apiCall(`/transactions/${id}`);
  if (!t) return;

  const newQty = prompt('Enter new quantity:', parseFloat(t.quantity));
  if (newQty === null) return;

  const qty = parseFloat(newQty);
  if (isNaN(qty) || qty <= 0) {
    showToast('Invalid quantity', 'error');
    return;
  }

  if (!confirm('Are you sure you want to update this transaction?')) return;

  const result = await apiCall(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity: qty }),
  });

  if (result) {
    showToast('Transaction updated successfully');
    initHistory();
  }
};

window.deleteTransaction = async function(id) {
  if (!confirm('Are you sure you want to delete this transaction? This will reverse the effect.')) return;

  const result = await apiCall(`/transactions/${id}`, {
    method: 'DELETE',
  });

  if (result) {
    showToast('Transaction deleted successfully');
    initHistory();
  }
};

registerPage('history', renderHistory, initHistory);
