async function renderReports() {
  return `
    <div class="page active" id="page-reports">
      <div class="header">
        <div class="header-back" onclick="window.history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Back</span>
        </div>
        <div class="header-title" style="margin-top: 4px;">Reports</div>
      </div>

      <div style="padding: 16px;">
        <div class="card" style="cursor: pointer;" onclick="window.location.hash='#/reports/inventory'">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 48px; height: 48px; background: #d1ecf1; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0c5460" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 15px;">Inventory Report</div>
              <div style="font-size: 12px; color: #6c757d;">Current stock levels</div>
            </div>
          </div>
        </div>

        <div class="card" style="cursor: pointer;" onclick="window.location.hash='#/reports/stock-in'">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 48px; height: 48px; background: #d4edda; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#155724" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 15px;">Stock In Report</div>
              <div style="font-size: 12px; color: #6c757d;">All incoming stock</div>
            </div>
          </div>
        </div>

        <div class="card" style="cursor: pointer;" onclick="window.location.hash='#/reports/stock-out'">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 48px; height: 48px; background: #f8d7da; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#721c24" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 15px;">Stock Out Report</div>
              <div style="font-size: 12px; color: #6c757d;">All outgoing stock</div>
            </div>
          </div>
        </div>

        <div class="card" style="cursor: pointer;" onclick="window.location.hash='#/reports/transfer'">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 48px; height: 48px; background: #d1ecf1; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0c5460" stroke-width="2">
                <polyline points="17 1 21 5 17 9"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <polyline points="7 23 3 19 7 15"/>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 15px;">Transfer Report</div>
              <div style="font-size: 12px; color: #6c757d;">Stock transfers between locations</div>
            </div>
          </div>
        </div>

        <div class="card" style="cursor: pointer;" onclick="window.location.hash='#/reports/receiving'">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 48px; height: 48px; background: #d4edda; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#155724" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 15px;">Receiving Report</div>
              <div style="font-size: 12px; color: #6c757d;">Today's receiving summary</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initReports() {
  // Reports page uses inline onclick handlers
}

registerPage('reports', renderReports, initReports);
