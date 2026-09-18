async function renderMore() {
  const isAdmin = currentUser?.role === 'admin';
  return `
    <div class="page active" id="page-more">
      <div class="header">
        <div class="header-title">More</div>
      </div>

      <div class="card" style="margin-top: 12px;">
        <div style="display: flex; align-items: center; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid #f5f5f5;">
          <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 18px;">
            ${(currentUser?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-weight: 600; font-size: 16px;">${currentUser?.name || 'User'}</div>
            <div style="font-size: 13px; color: #6c757d;">${currentUser?.email || ''}</div>
            <span class="badge ${isAdmin ? 'badge-success' : 'badge-info'}" style="margin-top: 4px;">${currentUser?.role || 'staff'}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <a href="#/products" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; text-decoration: none; color: #212529; border-bottom: 1px solid #f5f5f5;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            <span style="font-weight: 500; font-size: 15px;">Products</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>

        <a href="#/vendors" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; text-decoration: none; color: #212529; border-bottom: 1px solid #f5f5f5;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span style="font-weight: 500; font-size: 15px;">Vendors</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>

        <a href="#/receiving" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; text-decoration: none; color: #212529; border-bottom: 1px solid #f5f5f5;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            <span style="font-weight: 500; font-size: 15px;">Today's Receiving</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>

        <a href="#/reports" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; text-decoration: none; color: #212529; border-bottom: 1px solid #f5f5f5;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span style="font-weight: 500; font-size: 15px;">Reports</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>

        <a href="#/transfer" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; text-decoration: none; color: #212529;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" stroke-width="2">
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
            <span style="font-weight: 500; font-size: 15px;">Transfers</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>
      </div>

      ${isAdmin ? `
        <div class="card">
          <a href="#/users" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; text-decoration: none; color: #212529; border-bottom: 1px solid #f5f5f5;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span style="font-weight: 500; font-size: 15px;">Users</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>

          <a href="#/audit-logs" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; text-decoration: none; color: #212529;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span style="font-weight: 500; font-size: 15px;">Audit Logs</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        </div>
      ` : ''}

      <div style="padding: 16px; margin-top: 16px;">
        <button class="btn btn-danger btn-block" id="logout-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </div>
  `;
}

function initMore() {
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await apiCall('/auth/logout', { method: 'POST' });
    handleLogout();
  });
}

registerPage('more', renderMore, initMore);
