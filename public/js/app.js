const API_BASE = '/api';
let currentUser = null;
let currentRoute = '';

const pageRegistry = {};

function registerPage(name, renderFn, initFn) {
  pageRegistry[name] = { render: renderFn, init: initFn };
}

async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      handleLogout();
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    showToast(error.message, 'error');
    return null;
  }
}

async function checkAuth() {
  const result = await apiCall('/auth/me');
  if (result && result.user) {
    currentUser = result.user;
    return true;
  }
  return false;
}

function handleLogout() {
  currentUser = null;
  window.location.hash = '#/login';
}

async function requireAuth() {
  const isAuth = await checkAuth();
  if (!isAuth) {
    window.location.hash = '#/login';
    return false;
  }
  return true;
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatNumber(num) {
  return parseFloat(num).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateBottomNav(route) {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;

  const items = nav.querySelectorAll('.nav-item');
  items.forEach(item => {
    const itemRoute = item.getAttribute('data-route');
    const isActive = route === itemRoute || (itemRoute === '/' && (route === '/' || route === ''));
    item.classList.toggle('active', isActive);
  });
}

function showLoading() {
  const existing = document.querySelector('.loading-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(overlay);
}

function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) overlay.remove();
}

function setupSearchSelector(inputId, resultsId, apiEndpoint, labelField, onSelect, addNewText = null) {
  const input = document.getElementById(inputId);
  const results = document.getElementById(resultsId);
  if (!input || !results) return;

  input.addEventListener('focus', async () => {
    if (input.value.trim()) {
      await loadResults(input.value.trim());
    }
  });

  input.addEventListener('input', async () => {
    const query = input.value.trim();
    if (query.length >= 2) {
      await loadResults(query);
    } else {
      results.style.display = 'none';
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(() => { results.style.display = 'none'; }, 200);
  });

  async function loadResults(query) {
    const result = await apiCall(`${apiEndpoint}&search=${encodeURIComponent(query)}`);
    if (!result) return;

    let items = [];
    if (apiEndpoint.includes('products')) items = result.products || [];
    else if (apiEndpoint.includes('vendors')) items = result.vendors || [];

    if (items.length === 0 && !addNewText) {
      results.innerHTML = '<div style="padding: 12px; text-align: center; color: #6c757d; font-size: 13px;">No results</div>';
      results.style.display = 'block';
      return;
    }

    let html = items.map(item => `
      <div style="padding: 12px; cursor: pointer; border-bottom: 1px solid #f5f5f5; font-size: 14px;"
           onmousedown="this.dataset.selected='true'"
           onclick="window.selectSearchItem('${inputId}', '${resultsId}', ${item.id}, '${(item[labelField] || '').replace(/'/g, "\\'")}')">
        ${item[labelField]}
      </div>
    `).join('');

    if (addNewText && query) {
      html += `
        <div style="padding: 12px; cursor: pointer; border-top: 2px solid #2d6a4f; font-size: 14px; color: #2d6a4f; font-weight: 600;"
             onmousedown="this.dataset.selected='true'"
             onclick="window.addSearchItem('${inputId}', '${resultsId}', '${query.replace(/'/g, "\\'")}')">
          + ${addNewText}: "${query}"
        </div>
      `;
    }

    results.innerHTML = html;
    results.style.display = 'block';
  }
}

window.selectSearchItem = function(inputId, resultsId, id, name) {
  const input = document.getElementById(inputId);
  const results = document.getElementById(resultsId);
  if (input) input.value = name;
  if (results) results.style.display = 'none';

  const isProduct = inputId.includes('product');
  const endpoint = isProduct ? '/products' : '/vendors';
  const field = isProduct ? 'products' : 'vendors';

  apiCall(`${endpoint}?search=${encodeURIComponent(name)}&limit=1`).then(result => {
    if (result && result[field] && result[field][0]) {
      const item = result[field][0];
      if (isProduct) {
        window._selectedStockInProduct = item;
        window._selectedStockOutProduct = item;
        window._selectedTransferProduct = item;
      } else {
        window._selectedStockInVendor = item;
      }
    }
  });
};

window.addSearchItem = async function(inputId, resultsId, name) {
  const results = document.getElementById(resultsId);
  if (results) results.style.display = 'none';

  const isProduct = inputId.includes('product');
  const endpoint = isProduct ? '/products' : '/vendors';

  const result = await apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

  if (result) {
    const input = document.getElementById(inputId);
    if (input) input.value = result.name;

    if (isProduct) {
      window._selectedStockInProduct = result;
      window._selectedStockOutProduct = result;
      window._selectedTransferProduct = result;
    } else {
      window._selectedStockInVendor = result;
    }

    showToast(isProduct ? 'Product added' : 'Vendor added');
  }
};

async function router() {
  const hash = window.location.hash || '#/';
  const route = hash.replace('#', '').split('?')[0];

  if (route === currentRoute) return;
  currentRoute = route;

  const publicRoutes = ['/login'];
  const isPublic = publicRoutes.includes(route);

  if (!isPublic) {
    const isAuth = await requireAuth();
    if (!isAuth) return;
  }

  const app = document.getElementById('app');
  const bottomNav = document.getElementById('bottom-nav');

  if (route === '/login') {
    bottomNav.classList.add('hidden');
    if (pageRegistry['login']) {
      app.innerHTML = await pageRegistry['login'].render();
      if (pageRegistry['login'].init) await pageRegistry['login'].init();
    }
  } else {
    bottomNav.classList.remove('hidden');
    updateBottomNav(route);

    const pageName = route === '/' ? 'dashboard' : route.replace(/^\//, '').split('/')[0];
    const subPage = route.split('/').slice(2).join('/');

    if (pageRegistry[pageName]) {
      const page = pageRegistry[pageName];
      app.innerHTML = await page.render(subPage);
      if (page.init) await page.init(subPage);
    } else if (pageRegistry['dashboard']) {
      app.innerHTML = await pageRegistry['dashboard'].render();
      await pageRegistry['dashboard'].init();
    }
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
