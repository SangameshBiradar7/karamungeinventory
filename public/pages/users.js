async function renderUsers() {
  return `
    <div class="page active" id="page-users">
      <div class="header">
        <div class="header-back" onclick="window.history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Back</span>
        </div>
        <div class="header-title" style="margin-top: 4px;">Users</div>
      </div>

      <div style="padding: 12px 16px;">
        <button class="btn btn-primary btn-block" id="add-user-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add User
        </button>
      </div>

      <div id="users-list">
        <div class="skeleton" style="height: 300px;"></div>
      </div>
    </div>
  `;
}

async function initUsers() {
  const result = await apiCall('/users');
  const listEl = document.getElementById('users-list');

  if (!result || !result.users) {
    if (listEl) listEl.innerHTML = '<div class="empty-state"><p>Failed to load users</p></div>';
    return;
  }

  if (result.users.length === 0) {
    if (listEl) listEl.innerHTML = '<div class="empty-state"><p>No users found</p></div>';
    return;
  }

  if (listEl) {
    listEl.innerHTML = result.users.map(u => `
      <div class="card" style="margin-top: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; font-size: 15px;">${u.name}</div>
            <div style="font-size: 13px; color: #6c757d;">${u.email}</div>
            <span class="badge ${u.role === 'admin' ? 'badge-success' : 'badge-info'}" style="margin-top: 4px;">${u.role}</span>
            ${!u.is_active ? '<span class="badge badge-danger" style="margin-left: 4px;">Inactive</span>' : ''}
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline" style="padding: 8px 14px; font-size: 13px;" onclick="window.editUser(${u.id}, '${u.name.replace(/'/g, "\\'")}', '${u.email}')">Edit</button>
            ${u.id !== currentUser?.id ? `<button class="btn btn-danger" style="padding: 8px 14px; font-size: 13px;" onclick="window.deleteUser(${u.id})">Delete</button>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('add-user-btn')?.addEventListener('click', () => showUserModal());
}

function showUserModal(userId = null, name = '', email = '') {
  const isEdit = userId !== null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'user-modal';
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">${isEdit ? 'Edit User' : 'Add User'}</div>
        <button class="modal-close" onclick="document.getElementById('user-modal').remove()">&times;</button>
      </div>
      <form id="user-form">
        <div class="form-group">
          <label class="form-label">Name *</label>
          <input type="text" class="form-input" id="user-name" value="${name}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input type="email" class="form-input" id="user-email" value="${email}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Password ${isEdit ? '(leave blank to keep)' : '*'}</label>
          <input type="password" class="form-input" id="user-password" ${isEdit ? '' : 'required'}>
        </div>
        <div class="form-group">
          <label class="form-label">Role</label>
          <select class="form-select" id="user-role">
            <option value="staff">Staff</option>
            <option value="admin" ${isEdit ? 'selected' : ''}>Admin</option>
          </select>
        </div>
        <div style="display: flex; gap: 12px;">
          <button type="button" class="btn btn-outline" style="flex: 1;" onclick="document.getElementById('user-modal').remove()">Cancel</button>
          <button type="submit" class="btn btn-primary" style="flex: 1;">Save</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      name: document.getElementById('user-name').value.trim(),
      email: document.getElementById('user-email').value.trim(),
      role: document.getElementById('user-role').value,
    };

    const password = document.getElementById('user-password').value;
    if (password) body.password = password;

    let result;
    if (isEdit) {
      result = await apiCall(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      result = await apiCall('/users', { method: 'POST', body: JSON.stringify(body) });
    }

    if (result) {
      document.getElementById('user-modal').remove();
      showToast(isEdit ? 'User updated' : 'User added');
      initUsers();
    }
  });
}

window.editUser = function(id, name, email) {
  showUserModal(id, name, email);
};

window.deleteUser = async function(id) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  const result = await apiCall(`/users/${id}`, { method: 'DELETE' });
  if (result) {
    showToast('User deleted');
    initUsers();
  }
};

registerPage('users', renderUsers, initUsers);
