async function renderProducts() {
  return `
    <div class="page active" id="page-products">
      <div class="header">
        <div class="header-back" onclick="window.history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Back</span>
        </div>
        <div class="header-title" style="margin-top: 4px;">Products</div>
      </div>

      <div class="search-bar" style="position: relative;">
        <span class="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input type="text" class="search-input" id="prod-search" placeholder="Search products...">
      </div>

      <div style="padding: 12px 16px;">
        <button class="btn btn-primary btn-block" id="add-product-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Product
        </button>
      </div>

      <div id="prod-list">
        <div class="skeleton" style="height: 300px;"></div>
      </div>
    </div>
  `;
}

async function initProducts() {
  const loadProducts = async (search = '') => {
    const result = await apiCall(`/products?search=${encodeURIComponent(search)}&limit=50`);
    const listEl = document.getElementById('prod-list');

    if (!result || !result.products) {
      if (listEl) listEl.innerHTML = '<div class="empty-state"><p>Failed to load products</p></div>';
      return;
    }

    if (result.products.length === 0) {
      if (listEl) listEl.innerHTML = '<div class="empty-state"><p>No products found</p></div>';
      return;
    }

    if (listEl) {
      listEl.innerHTML = result.products.map(p => `
        <div class="card" style="margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600; font-size: 15px;">${p.name}</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-outline" style="padding: 8px 14px; font-size: 13px;" onclick="window.editProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')">Edit</button>
              <button class="btn btn-danger" style="padding: 8px 14px; font-size: 13px;" onclick="window.deleteProduct(${p.id})">Delete</button>
            </div>
          </div>
        </div>
      `).join('');
    }
  };

  await loadProducts();

  const searchInput = document.getElementById('prod-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => loadProducts(e.target.value));
  }

  document.getElementById('add-product-btn')?.addEventListener('click', () => {
    showProductModal();
  });
}

function showProductModal(productId = null, name = '') {
  const isEdit = productId !== null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'product-modal';
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">${isEdit ? 'Edit Product' : 'Add Product'}</div>
        <button class="modal-close" onclick="document.getElementById('product-modal').remove()">&times;</button>
      </div>
      <form id="product-form">
        <div class="form-group">
          <label class="form-label">Product Name *</label>
          <input type="text" class="form-input" id="prod-name" value="${name}" required>
        </div>
        <div style="display: flex; gap: 12px;">
          <button type="button" class="btn btn-outline" style="flex: 1;" onclick="document.getElementById('product-modal').remove()">Cancel</button>
          <button type="submit" class="btn btn-primary" style="flex: 1;">Save</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('prod-name').value.trim();

    let result;
    if (isEdit) {
      result = await apiCall(`/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      });
    } else {
      result = await apiCall('/products', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    }

    if (result) {
      document.getElementById('product-modal').remove();
      showToast(isEdit ? 'Product updated' : 'Product added');
      initProducts();
    }
  });
}

window.editProduct = function(id, name) {
  showProductModal(id, name);
};

window.deleteProduct = async function(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  const result = await apiCall(`/products/${id}`, { method: 'DELETE' });
  if (result) {
    showToast('Product deleted');
    initProducts();
  }
};

registerPage('products', renderProducts, initProducts);
