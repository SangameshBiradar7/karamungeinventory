async function renderReportDetail(reportType) {
  return `
    <div class="page active" id="page-report-detail">
      <div class="header">
        <div class="header-back" onclick="window.history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Back</span>
        </div>
        <div class="header-title" style="margin-top: 4px; text-transform: capitalize;">${reportType.replace('-', ' ')} Report</div>
      </div>

      <div style="padding: 16px;">
        <div class="card">
          <div class="card-title">Date Range</div>
          <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
            <button class="tab active" data-period="today" style="border: 1px solid #dee2e6; border-radius: 20px; padding: 6px 14px; font-size: 12px; background: white; cursor: pointer;">Today</button>
            <button class="tab" data-period="week" style="border: 1px solid #dee2e6; border-radius: 20px; padding: 6px 14px; font-size: 12px; background: white; cursor: pointer;">This Week</button>
            <button class="tab" data-period="month" style="border: 1px solid #dee2e6; border-radius: 20px; padding: 6px 14px; font-size: 12px; background: white; cursor: pointer;">This Month</button>
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <input type="date" class="form-input" id="report-start" style="flex: 1;">
            <input type="date" class="form-input" id="report-end" style="flex: 1;">
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" style="flex: 1;" id="load-report-btn">Load Report</button>
            <button class="btn btn-outline" style="flex: 1;" id="export-report-btn">Export Excel</button>
          </div>
        </div>

        <div id="report-data">
          <div class="skeleton" style="height: 300px;"></div>
        </div>
      </div>
    </div>
  `;
}

async function initReportDetail(reportType) {
  let currentPeriod = 'today';

  const loadReport = async () => {
    const startDate = document.getElementById('report-start')?.value;
    const endDate = document.getElementById('report-end')?.value;

    let url = `/reports/${reportType}`;
    if (currentPeriod !== 'custom') {
      url += `?period=${currentPeriod}`;
    } else if (startDate && endDate) {
      url += `?period=custom&startDate=${startDate}&endDate=${endDate}`;
    }

    const result = await apiCall(url);
    const dataEl = document.getElementById('report-data');

    if (!result) {
      if (dataEl) dataEl.innerHTML = '<div class="empty-state"><p>Failed to load report</p></div>';
      return;
    }

    const transactions = result.transactions || [];
    const totalQty = transactions.reduce((sum, t) => sum + parseFloat(t.quantity), 0);

    let html = `
      <div class="card" style="margin-top: 12px;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <div style="background: #d4edda; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; color: #155724; font-weight: 600;">Transactions</div>
            <div style="font-size: 20px; font-weight: 700; color: #155724;">${transactions.length}</div>
          </div>
          <div style="background: #d1ecf1; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; color: #0c5460; font-weight: 600;">Total Qty</div>
            <div style="font-size: 20px; font-weight: 700; color: #0c5460;">${formatNumber(totalQty)}</div>
          </div>
        </div>
      </div>
    `;

    if (transactions.length === 0) {
      html += '<div class="empty-state"><p>No transactions found</p></div>';
    } else {
      html += transactions.map(t => {
        let badgeClass = 'badge-info';
        let sign = '';
        if (t.transaction_type === 'STOCK_IN') { badgeClass = 'badge-success'; sign = '+'; }
        else if (t.transaction_type === 'STOCK_OUT') { badgeClass = 'badge-danger'; sign = '-'; }
        else if (t.transaction_type === 'ADJUSTMENT') { badgeClass = 'badge-warning'; sign = parseFloat(t.quantity) >= 0 ? '+' : ''; }

        return `
          <div class="card" style="margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <span class="badge ${badgeClass}">${t.transaction_type.replace('_', ' ')}</span>
                <div style="font-weight: 600; font-size: 14px; margin-top: 8px;">${t.product?.name || t.item_name_snapshot || 'Unknown'}</div>
                <div style="font-size: 12px; color: #6c757d; margin-top: 4px;">${formatDate(t.transaction_date)}</div>
              </div>
              <div style="font-size: 18px; font-weight: 700; color: ${badgeClass.includes('success') ? '#155724' : badgeClass.includes('danger') ? '#721c24' : '#0c5460'};">
                ${sign}${formatNumber(t.quantity)}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (dataEl) dataEl.innerHTML = html;
  };

  await loadReport();

  document.querySelectorAll('.tab[data-period]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab[data-period]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentPeriod = tab.dataset.period;
      loadReport();
    });
  });

  document.getElementById('load-report-btn')?.addEventListener('click', () => {
    currentPeriod = 'custom';
    loadReport();
  });

  document.getElementById('export-report-btn')?.addEventListener('click', () => {
    const startDate = document.getElementById('report-start')?.value;
    const endDate = document.getElementById('report-end')?.value;
    let url = `/api/export/${reportType}?format=xlsx`;
    if (currentPeriod !== 'custom') {
      url += `&period=${currentPeriod}`;
    } else if (startDate && endDate) {
      url += `&period=custom&startDate=${startDate}&endDate=${endDate}`;
    }
    window.location.href = url;
  });
}

registerPage('report-detail', renderReportDetail, initReportDetail);
