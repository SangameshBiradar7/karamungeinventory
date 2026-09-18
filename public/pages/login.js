function renderLogin() {
  return `
    <div class="page active" id="page-login">
      <div style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 24px; background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);">
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="width: 80px; height: 80px; background: white; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1b4332" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <h1 style="color: white; font-size: 28px; margin-bottom: 8px;">Karamunge Traders</h1>
          <p style="color: rgba(255,255,255,0.8); font-size: 14px;">Inventory Management System</p>
        </div>

        <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
          <form id="login-form">
            <div id="login-error" style="display: none; background: #fee; color: #c00; padding: 10px; border-radius: 8px; margin-bottom: 12px; font-size: 13px;"></div>
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" class="form-input" id="login-username" placeholder="Enter your username" required autocomplete="username">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" id="login-password" placeholder="Enter your password" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn-primary btn-block" id="login-btn">Sign In</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function initLogin() {
  const form = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    const result = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name: username, password }),
    });

    if (result && result.user) {
      currentUser = result.user;
      window.location.hash = '#/';
    } else {
      btn.disabled = false;
      btn.textContent = 'Sign In';
      if (errorDiv) {
        errorDiv.textContent = 'Invalid username or password. Please try again.';
        errorDiv.style.display = 'block';
      }
    }
  });
}

registerPage('login', renderLogin, initLogin);
