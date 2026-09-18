async function renderAuditLogs() {
  return `
    <div class="page active" id="page-audit-logs">
      <div class="header">
        <div class="header-back" onclick="window.history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Back</span>
        </div>
        <div class="header-title" style="margin-top: 4px;">Audit Logs</div>
      </div>

      <div id="audit-list">
        <div class="skeleton" style="height: 400px;"></div>
      </div>
    </div>
  `;
}

async function initAuditLogs() {
  const result = await apiCall('/audit-logs');
  const listEl = document.getElementById('audit-list');

  if (!result || !result.logs) {
    if (listEl) listEl.innerHTML = '<div class="empty-state"><p>Failed to load audit logs</p></div>';
    return;
  }

  if (result.logs.length === 0) {
    if (listEl) listEl.innerHTML = '<div class="empty-state"><p>No audit logs found</p></div>';
    return;
  }

  const actionColors = {
    'CREATE': 'badge-success',
    'UPDATE': 'badge-info',
    'DELETE': 'badge-danger',
  };

  if (listEl) {
    listEl.innerHTML = result.logs.map(log => `
      <div class="card" style="margin-top: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <span class="badge ${actionColors[log.action] || 'badge-warning'}">${log.action}</span>
          <span style="font-size: 11px; color: #6c757d;">${formatDate(log.created_at)}</span>
        </div>
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${log.entity_type} ${log.entity_id ? `#${log.entity_id}` : ''}</div>
        <div style="font-size: 12px; color: #6c757d;">
          By: ${log.user?.name || 'System'} • ${log.user?.email || ''}
        </div>
      </div>
    `).join('');
  }
}

registerPage('audit-logs', renderAuditLogs, initAuditLogs);
