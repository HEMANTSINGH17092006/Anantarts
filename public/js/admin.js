// Admin Dashboard Controller for Anant Arts
let salesChart = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth first
  try {
    await API.checkAuth();
    // Authorized -> load admin workspace
    initAdminWorkspace();
  } catch (err) {
    // Unauthorized -> show login modal
    showLoginOverlay();
  }
});

// 1. Authentication Overlay Handler
function showLoginOverlay() {
  const loginOverlay = document.createElement('div');
  loginOverlay.id = 'admin-login-overlay';
  loginOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:var(--bg-cream-dark); z-index:9999; display:flex; justify-content:center; align-items:center;';
  loginOverlay.innerHTML = `
    <div class="admin-card" style="width:100%; max-width:400px; border:1px solid var(--primary-gold-border); box-shadow:var(--shadow-gold);">
      <div style="text-align:center; margin-bottom:2rem;">
        <h2 style="color:var(--luxury-maroon); font-family:var(--font-heading); letter-spacing:1px; text-transform:uppercase;">Anant Arts</h2>
        <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:2px; color:var(--primary-gold-hover);">Shopify-Like Control Center</span>
      </div>
      <form id="admin-login-form">
        <div class="admin-form-group">
          <label class="admin-form-label">Email Address</label>
          <input type="email" id="login-email" class="admin-form-input" required placeholder="admin@anantarts.com">
        </div>
        <div class="admin-form-group" style="margin-bottom:2rem;">
          <label class="admin-form-label">Password</label>
          <input type="password" id="login-password" class="admin-form-input" required placeholder="••••••••">
        </div>
        <button type="submit" class="btn-add-cart" style="width:100%;">Sign In to Dashboard 🔒</button>
      </form>
    </div>
  `;
  document.body.appendChild(loginOverlay);

  const form = document.getElementById('admin-login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      await API.login(email, password);
      loginOverlay.remove();
      initAdminWorkspace();
      showToast('Welcome back, Admin!', 'success');
    } catch (err) {
      showToast(err.message || 'Invalid Credentials', 'error');
    }
  });
}

// 2. Initialize Work Space
async function initAdminWorkspace() {
  document.body.classList.add('admin-body');
  
  // Setup tabs toggles
  const menuLinks = document.querySelectorAll('.admin-sidebar-menu li');
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Setup drag-and-drop file uploaders
  setupDragUpload('product-dragzone', 'product-file-input', 'product-preview');
  setupDragUpload('category-dragzone', 'category-file-input', 'category-preview');

  // Load initial tab (Dashboard)
  await switchTab('dashboard');
}

async function switchTab(tabId) {
  // Update sidebar active state
  document.querySelectorAll('.admin-sidebar-menu li').forEach(li => {
    if (li.getAttribute('data-tab') === tabId) {
      li.classList.add('active');
    } else {
      li.classList.remove('active');
    }
  });

  // Update tab panel visibility
  document.querySelectorAll('.admin-tab-content').forEach(content => {
    if (content.id === `tab-${tabId}`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });

  // Load appropriate data
  if (tabId === 'dashboard') {
    await loadDashboardStats();
  } else if (tabId === 'products') {
    await loadAdminProducts();
  } else if (tabId === 'categories') {
    await loadAdminCategories();
  } else if (tabId === 'orders') {
    await loadAdminOrders();
  } else if (tabId === 'customers') {
    await loadAdminCustomers();
  } else if (tabId === 'blogs') {
    await loadAdminBlogs();
  } else if (tabId === 'coupons') {
    await loadAdminCoupons();
    await loadAdminSubscribers();
  } else if (tabId === 'settings') {
    await loadAdminSettings();
  }
}

// 3. Tab: Dashboard Stats Hydration
async function loadDashboardStats() {
  try {
    const stats = await API.admin.getStats();

    // Hydrate stat badges
    document.getElementById('stat-revenue').textContent = `₹${stats.revenue.toLocaleString()}`;
    document.getElementById('stat-orders').textContent = stats.orderCount;
    document.getElementById('stat-products').textContent = stats.productCount;
    
    // Inventory Alerts count
    const inventoryAlertsCount = stats.lowStockProducts.length;
    const alertEl = document.getElementById('stat-alerts');
    alertEl.textContent = inventoryAlertsCount;
    if (inventoryAlertsCount > 0) {
      alertEl.style.color = 'var(--color-danger)';
    } else {
      alertEl.style.color = 'var(--color-success)';
    }

    // Hydrate Low Stock Table
    const lowStockContainer = document.getElementById('dashboard-low-stock-list');
    if (stats.lowStockProducts.length === 0) {
      lowStockContainer.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">All items sufficiently stocked! ✨</td></tr>';
    } else {
      lowStockContainer.innerHTML = stats.lowStockProducts.map(p => `
        <tr>
          <td><strong>${p.sku || 'N/A'}</strong></td>
          <td>${p.name}</td>
          <td style="color:var(--color-danger); font-weight:bold;">${p.stock_quantity} left</td>
          <td>
            <button class="btn-admin" onclick="openProductEditModal(${p.id})">Restock</button>
          </td>
        </tr>
      `).join('');
    }

    // Hydrate Best Sellers list
    const bestSellersContainer = document.getElementById('dashboard-bestsellers-list');
    if (stats.bestSellers.length === 0) {
      bestSellersContainer.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888;">No sales records registered yet.</td></tr>';
    } else {
      bestSellersContainer.innerHTML = stats.bestSellers.map(p => `
        <tr>
          <td><strong>${p.product_sku || 'N/A'}</strong></td>
          <td>${p.product_name}</td>
          <td style="font-weight:bold; color:var(--luxury-maroon);">${p.units_sold} units sold</td>
        </tr>
      `).join('');
    }

    // Initialize Chart.js
    renderSalesChart(stats.monthlySales);

  } catch (err) {
    showToast('Failed to retrieve analytics data.', 'error');
  }
}

function renderSalesChart(monthlySalesData) {
  const ctx = document.getElementById('salesChart').getContext('2d');
  
  if (salesChart) {
    salesChart.destroy();
  }

  // Monthly labels
  const labels = monthlySalesData.map(d => d.month);
  const data = monthlySalesData.map(d => d.sales);

  salesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [{
        label: 'Monthly Revenue (₹)',
        data: data.length > 0 ? data : [0],
        borderColor: '#800020', // Luxury Maroon
        backgroundColor: 'rgba(212, 175, 55, 0.15)', // Light Gold glow
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#D4AF37',
        pointBorderColor: '#800020',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

// 4. Tab: Product CRUD Logic
let allCategoriesList = [];
window.filterAdminProducts = function() {
  loadAdminProducts();
};

async function loadAdminProducts() {
  try {
    // Pre-cache categories for form dropdown selects
    allCategoriesList = await API.getCategories();

    // Dynamically hydrate filter categories dropdown if empty
    const filterSelect = document.getElementById('admin-prod-cat-filter');
    if (filterSelect && filterSelect.options.length <= 1) {
      filterSelect.innerHTML = '<option value="">All Categories</option>' +
        allCategoriesList.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    const products = await API.getProducts({ all: true });
    const tbody = document.getElementById('admin-products-list');
    
    // Read filter inputs
    const searchVal = (document.getElementById('admin-prod-search').value || '').toLowerCase();
    const catVal = document.getElementById('admin-prod-cat-filter').value;

    const filtered = products.filter(p => {
      const nameMatch = !searchVal || (p.name || '').toLowerCase().includes(searchVal) || (p.sku || '').toLowerCase().includes(searchVal);
      const catMatch = !catVal || p.category_id == catVal;
      return nameMatch && catMatch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No products match the filters.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td><img src="${p.image_path || '/uploads/placeholder.jpg'}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
        <td><strong>${p.sku || 'N/A'}</strong></td>
        <td>${p.name}</td>
        <td>${p.category_name || 'Uncategorized'}</td>
        <td><strong>₹${p.price.toLocaleString()}</strong></td>
        <td>${p.stock_quantity}</td>
        <td>
          <span class="status-badge ${p.is_published ? 'status-delivered' : 'status-pending'}">
            ${p.is_published ? 'Published' : 'Draft'}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn-admin" onclick="openProductEditModal(${p.id})">Edit</button>
            <button class="btn-admin btn-admin-secondary" onclick="duplicateProduct(${p.id})" title="Duplicate">Copy</button>
            <button class="btn-admin btn-admin-danger" onclick="deleteProduct(${p.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    showToast('Failed to load products list.', 'error');
  }
}

function openProductCreateModal() {
  const form = document.getElementById('product-form');
  form.reset();
  document.getElementById('product-id').value = '';
  document.getElementById('product-modal-title').textContent = 'Add Luxury Idol';
  
  // Populate category selector dropdown
  const catSelect = document.getElementById('prod-category');
  catSelect.innerHTML = '<option value="">Select Category</option>' + 
    allCategoriesList.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  document.getElementById('product-preview').innerHTML = '';
  uploadedFilesList = []; // Reset drag-and-drop cache

  document.getElementById('product-modal').classList.add('open');
}

async function openProductEditModal(id) {
  try {
    const products = await API.getProducts({ all: true });
    const product = products.find(p => p.id === id);
    if (!product) return;

    const form = document.getElementById('product-form');
    form.reset();

    document.getElementById('product-id').value = product.id;
    document.getElementById('product-modal-title').textContent = 'Edit Idol';

    // Populate category dropdown
    const catSelect = document.getElementById('prod-category');
    catSelect.innerHTML = '<option value="">Select Category</option>' + 
      allCategoriesList.map(c => `<option value="${c.id}" ${c.id === product.category_id ? 'selected' : ''}>${c.name}</option>`).join('');

    // Prepopulate inputs
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-discount').value = product.discount_price || '';
    document.getElementById('prod-sku').value = product.sku || '';
    document.getElementById('prod-material').value = product.material || '';
    document.getElementById('prod-dimensions').value = product.dimensions || '';
    document.getElementById('prod-weight').value = product.weight || '';
    document.getElementById('prod-stock').value = product.stock_quantity;
    document.getElementById('prod-published').checked = !!product.is_published;
    document.getElementById('prod-desc').value = product.description;

    // Prepopulate new columns
    document.getElementById('prod-short-desc').value = product.short_description || '';
    document.getElementById('prod-deity-cat').value = product.deity_category || '';
    document.getElementById('prod-video').value = product.video_url || '';
    document.getElementById('prod-seo-title').value = product.seo_title || '';
    document.getElementById('prod-seo-desc').value = product.seo_description || '';

    // Badges checkboxes
    document.getElementById('tag-bestseller').checked = !!product.is_bestseller;
    document.getElementById('tag-new').checked = !!product.is_new_arrival;
    document.getElementById('tag-featured').checked = !!product.is_featured;

    // Get current product images and show preview
    const detail = await API.getProductBySlug(product.slug);
    const previewContainer = document.getElementById('product-preview');
    previewContainer.innerHTML = detail.images.map(img => `
      <div class="upload-preview-item" data-existing="true" data-path="${img.image_path}">
        <img src="${img.image_path}" class="upload-preview-img">
        <span class="upload-preview-remove" onclick="removeExistingImage(this)">&times;</span>
      </div>
    `).join('');
    
    uploadedFilesList = []; // Reset new uploaded files list

    document.getElementById('product-modal').classList.add('open');
  } catch(e) {
    showToast('Failed to fetch product details.', 'error');
  }
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('product-id').value;
  
  const formData = new FormData();
  formData.append('name', document.getElementById('prod-name').value);
  formData.append('price', document.getElementById('prod-price').value);
  formData.append('discount_price', document.getElementById('prod-discount').value);
  formData.append('sku', document.getElementById('prod-sku').value);
  formData.append('category_id', document.getElementById('prod-category').value);
  formData.append('material', document.getElementById('prod-material').value);
  formData.append('dimensions', document.getElementById('prod-dimensions').value);
  formData.append('weight', document.getElementById('prod-weight').value);
  formData.append('stock_quantity', document.getElementById('prod-stock').value);
  formData.append('is_published', document.getElementById('prod-published').checked ? '1' : '0');
  formData.append('description', document.getElementById('prod-desc').value);

  // New fields
  formData.append('short_description', document.getElementById('prod-short-desc').value);
  formData.append('deity_category', document.getElementById('prod-deity-cat').value);
  formData.append('video_url', document.getElementById('prod-video').value);
  formData.append('seo_title', document.getElementById('prod-seo-title').value);
  formData.append('seo_description', document.getElementById('prod-seo-desc').value);

  // Badges
  formData.append('is_bestseller', document.getElementById('tag-bestseller').checked ? '1' : '0');
  formData.append('is_new_arrival', document.getElementById('tag-new').checked ? '1' : '0');
  formData.append('is_featured', document.getElementById('tag-featured').checked ? '1' : '0');

  // Gather tags list for backward compatibility
  const tags = [];
  if (document.getElementById('tag-featured').checked) tags.push('Featured');
  if (document.getElementById('tag-bestseller').checked) tags.push('Best Seller');
  if (document.getElementById('tag-new').checked) tags.push('New Arrival');
  formData.append('tags', JSON.stringify(tags));

  // Gather remaining existing images
  const existingImages = [];
  document.querySelectorAll('#product-preview .upload-preview-item[data-existing="true"]').forEach(item => {
    existingImages.push(item.getAttribute('data-path'));
  });
  formData.append('existing_images', JSON.stringify(existingImages));

  // Add new file uploads
  uploadedFilesList.forEach(file => {
    formData.append('images', file);
  });

  try {
    if (id) {
      await API.admin.updateProduct(id, formData);
      showToast('Product updated successfully.', 'success');
    } else {
      await API.admin.addProduct(formData);
      showToast('New product created.', 'success');
    }
    closeAdminModal('product-modal');
    await loadAdminProducts();
  } catch (err) {
    showToast(err.message || 'Form save failed', 'error');
  }
}

async function duplicateProduct(id) {
  if (confirm('Duplicate this product to create a copy?')) {
    try {
      await API.admin.duplicateProduct(id);
      showToast('Product duplicated successfully.', 'success');
      await loadAdminProducts();
    } catch(err) {
      showToast(err.message, 'error');
    }
  }
}

async function deleteProduct(id) {
  if (confirm('Are you absolutely sure you want to delete this product? This cannot be undone.')) {
    try {
      await API.admin.deleteProduct(id);
      showToast('Product deleted.', 'warning');
      await loadAdminProducts();
    } catch(err) {
      showToast(err.message, 'error');
    }
  }
}

function removeExistingImage(button) {
  button.closest('.upload-preview-item').remove();
}

function triggerCSVImportInput() {
  document.getElementById('csv-import-file').click();
}

async function handleCSVImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    showToast('Importing products from CSV...', 'info');
    const res = await API.admin.importProducts(file);
    showToast(`Import completed! Added/updated ${res.count} products.`, 'success');
    await loadAdminProducts();
  } catch (err) {
    showToast(`CSV Import failed: ${err.message}`, 'error');
  } finally {
    e.target.value = ''; // Reset input
  }
}

// 5. Tab: Category Management
async function loadAdminCategories() {
  try {
    const filterType = document.getElementById('cat-type-filter').value || 'deity';
    const categories = await API.getCategories({ type: filterType });
    const tbody = document.getElementById('admin-categories-list');
    
    if (categories.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No categories configured in this directory.</td></tr>';
      return;
    }

    tbody.innerHTML = categories.map(c => `
      <tr>
        <td><img src="${c.image_path || '/uploads/placeholder.jpg'}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
        <td><strong>${c.name}</strong></td>
        <td><code>${c.slug}</code></td>
        <td><span style="text-transform: capitalize;">${c.type || 'deity'}</span></td>
        <td>
          <span class="status-badge ${c.is_hidden ? 'status-pending' : 'status-delivered'}">
            ${c.is_hidden ? 'Hidden' : 'Visible'}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn-admin" onclick="openCategoryEditModal(${c.id})">Edit</button>
            <button class="btn-admin btn-admin-danger" onclick="deleteCategory(${c.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    showToast('Failed to load categories.', 'error');
  }
}

function openCategoryCreateModal() {
  const form = document.getElementById('category-form');
  form.reset();
  document.getElementById('category-id').value = '';
  document.getElementById('category-modal-title').textContent = 'Add Category';
  document.getElementById('category-preview').innerHTML = '';
  uploadedFilesList = [];
  
  const filterType = document.getElementById('cat-type-filter').value;
  document.getElementById('cat-type').value = filterType || 'deity';

  document.getElementById('category-modal').classList.add('open');
}

async function openCategoryEditModal(id) {
  try {
    const categories = await API.getCategories();
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    const form = document.getElementById('category-form');
    form.reset();

    document.getElementById('category-id').value = cat.id;
    document.getElementById('category-modal-title').textContent = 'Edit Category';

    document.getElementById('cat-name').value = cat.name;
    document.getElementById('cat-hidden').checked = !!cat.is_hidden;
    document.getElementById('cat-type').value = cat.type || 'deity';

    const previewContainer = document.getElementById('category-preview');
    if (cat.image_path) {
      previewContainer.innerHTML = `
        <div class="upload-preview-item" data-existing="true" data-path="${cat.image_path}">
          <img src="${cat.image_path}" class="upload-preview-img">
          <span class="upload-preview-remove" onclick="removeExistingImage(this)">&times;</span>
        </div>
      `;
    } else {
      previewContainer.innerHTML = '';
    }
    
    uploadedFilesList = [];
    document.getElementById('category-modal').classList.add('open');
  } catch(e) {
    showToast('Failed to fetch category.', 'error');
  }
}

async function handleCategoryFormSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('category-id').value;
  
  const formData = new FormData();
  formData.append('name', document.getElementById('cat-name').value);
  formData.append('is_hidden', document.getElementById('cat-hidden').checked ? '1' : '0');
  formData.append('type', document.getElementById('cat-type').value);

  let existingPath = '';
  const existingEl = document.querySelector('#category-preview .upload-preview-item[data-existing="true"]');
  if (existingEl) {
    existingPath = existingEl.getAttribute('data-path');
  }
  formData.append('existing_image', existingPath);

  if (uploadedFilesList.length > 0) {
    formData.append('image', uploadedFilesList[0]);
  }

  try {
    if (id) {
      await API.admin.updateCategory(id, formData);
      showToast('Category updated.', 'success');
    } else {
      await API.admin.addCategory(formData);
      showToast('Category created.', 'success');
    }
    closeAdminModal('category-modal');
    await loadAdminCategories();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteCategory(id) {
  if (confirm('Delete this category? Products in this category will become Uncategorized.')) {
    try {
      await API.admin.deleteCategory(id);
      showToast('Category deleted.', 'warning');
      await loadAdminCategories();
    } catch(err) {
      showToast(err.message, 'error');
    }
  }
}

// 6. Tab: Order Status & Updates
let currentOrderStatusFilter = 'All';
window.filterOrdersByStatus = function(status) {
  currentOrderStatusFilter = status;
  document.querySelectorAll('#order-status-filters button').forEach(b => {
    if (b.textContent.trim().startsWith(status)) b.classList.add('active');
    else b.classList.remove('active');
  });
  loadAdminOrders();
};

async function loadAdminOrders() {
  try {
    let orders = await API.admin.getOrders();
    const tbody = document.getElementById('admin-orders-list');
    
    if (currentOrderStatusFilter !== 'All') {
      orders = orders.filter(o => o.order_status === currentOrderStatusFilter);
    }
    
    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No ${currentOrderStatusFilter} orders recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><strong>#${o.order_number}</strong></td>
        <td>
          <div style="font-weight:600;">${o.customer_name}</div>
          <div style="font-size:0.8rem; color:#666;">${o.customer_email} | ${o.customer_phone}</div>
        </td>
        <td>${new Date(o.created_at).toLocaleDateString()}</td>
        <td><strong>₹${o.total_amount.toLocaleString()}</strong></td>
        <td>
          <span class="status-badge ${o.payment_status === 'Paid' ? 'status-delivered' : 'status-pending'}">
            ${o.payment_status}
          </span>
        </td>
        <td>
          <select class="admin-form-input" style="width:130px; padding:0.25rem; margin-bottom:5px;" onchange="updateOrderStatus(${o.id}, this.value)">
            <option value="Pending" ${o.order_status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Confirmed" ${o.order_status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Packed" ${o.order_status === 'Packed' ? 'selected' : ''}>Packed</option>
            <option value="Shipped" ${o.order_status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${o.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.order_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
          <input type="text" placeholder="Tracking ID" value="${o.tracking_number || ''}" class="admin-form-input" style="font-size:0.75rem; padding:2px 6px; width:130px;" onblur="updateOrderTracking(${o.id}, '${o.order_status}', this.value)">
        </td>
        <td>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <a href="/api/orders/${o.id}/invoice" target="_blank" class="btn-admin" style="padding:4px 8px; font-size:0.75rem;">Invoice 📄</a>
            <button class="btn-admin btn-admin-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="sendWhatsAppUpdate(${o.id})">WhatsApp 💬</button>
            <button class="btn-admin btn-admin-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="printShippingLabel(${o.id})">Label 🏷️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    showToast('Failed to load orders.', 'error');
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await API.admin.updateOrderStatus(orderId, { status });
    showToast(`Order status updated to "${status}".`, 'success');
    await loadAdminOrders();
  } catch (err) {
    showToast('Failed to change status.', 'error');
  }
}

window.updateOrderTracking = async function(orderId, status, trackingNumber) {
  try {
    await API.admin.updateOrderStatus(orderId, { status, tracking_number: trackingNumber });
    showToast('Tracking number updated successfully.', 'success');
  } catch (err) {
    showToast('Failed to save tracking number.', 'error');
  }
};

async function sendWhatsAppUpdate(orderId) {
  try {
    const res = await API.admin.sendWhatsAppUpdate(orderId);
    showToast(res.message, 'success');
  } catch(err) {
    showToast('Failed to trigger simulated WhatsApp update.', 'error');
  }
}

function printShippingLabel(orderId) {
  // Simulates printing shipping label in popup
  API.admin.getOrders().then(orders => {
    const o = orders.find(item => item.id === orderId);
    if (!o) return;

    const labelWin = window.open('', 'PRINT', 'height=400,width=600');
    labelWin.document.write(`
      <html>
      <head>
        <title>Shipping Label - #${o.order_number}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; text-align: center; }
          .label-box { border: 3px double #000; padding: 20px; max-width: 500px; margin: 0 auto; text-align: left; }
          .barcode { font-size: 2rem; letter-spacing: 5px; font-weight: bold; margin-bottom: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="label-box">
          <div class="barcode">|||||||||||||||||||</div>
          <h3>ANANT ARTS SHIPPING</h3>
          <p><strong>Order:</strong> #${o.order_number}</p>
          <hr>
          <p><strong>SHIP TO:</strong></p>
          <p><strong>${o.customer_name}</strong></p>
          <p>${o.shipping_address}</p>
          <p>Phone: ${o.customer_phone}</p>
          <hr>
          <p><strong>Carrier:</strong> Delhivery Premium Air</p>
        </div>
      </body>
      </html>
    `);
    labelWin.document.close();
    labelWin.focus();
    setTimeout(() => { labelWin.print(); labelWin.close(); }, 500);
  });
}

// 7. Tab: Coupons Rules
async function loadAdminCoupons() {
  try {
    const coupons = await API.admin.getCoupons();
    const tbody = document.getElementById('admin-coupons-list');
    
    if (coupons.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No coupon rules configured yet.</td></tr>';
      return;
    }

    tbody.innerHTML = coupons.map(c => `
      <tr>
        <td><strong><code>${c.code}</code></strong></td>
        <td>${c.discount_type}</td>
        <td>${c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
        <td>₹${c.min_order_amount}</td>
        <td>${c.times_used} / ${c.usage_limit || '∞'}</td>
        <td>
          <button class="btn-admin btn-admin-danger" onclick="deleteCoupon(${c.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    showToast('Failed to load coupons.', 'error');
  }
}

async function handleCouponCreateSubmit(e) {
  e.preventDefault();
  
  const couponData = {
    code: document.getElementById('coup-code').value.toUpperCase(),
    discount_type: document.getElementById('coup-type').value,
    discount_value: parseFloat(document.getElementById('coup-value').value),
    min_order_amount: parseFloat(document.getElementById('coup-min').value || 0),
    usage_limit: parseInt(document.getElementById('coup-limit').value || 100)
  };

  try {
    await API.admin.createCoupon(couponData);
    showToast('Coupon rule created.', 'success');
    e.target.reset();
    await loadAdminCoupons();
  } catch(err) {
    showToast(err.message, 'error');
  }
}

async function deleteCoupon(id) {
  if (confirm('Delete this coupon rule?')) {
    try {
      await API.admin.deleteCoupon(id);
      showToast('Coupon rule deleted.', 'warning');
      await loadAdminCoupons();
    } catch(err) {
      showToast(err.message, 'error');
    }
  }
}

// 8. Tab: Settings & Banner Editing
async function loadAdminSettings() {
  try {
    const settings = await API.getSettings();
    
    document.getElementById('set-site-name').value = settings.site_name || '';
    document.getElementById('set-site-tagline').value = settings.site_tagline || '';
    document.getElementById('set-whatsapp').value = settings.whatsapp_number || '';
    document.getElementById('set-phone').value = settings.contact_phone || '';
    document.getElementById('set-email').value = settings.contact_email || '';
    document.getElementById('set-address').value = settings.contact_address || '';
    document.getElementById('set-razorpay-key').value = settings.razorpay_key_id || '';
    document.getElementById('set-whatsapp-apikey').value = settings.whatsapp_admin_apikey || '';
    document.getElementById('set-about').value = settings.about_us_text || '';
    document.getElementById('set-shipping-policy').value = settings.shipping_policy || '';
    document.getElementById('set-return-policy').value = settings.return_policy || '';
    document.getElementById('set-privacy-policy').value = settings.privacy_policy || '';

    // Homepage Copy
    document.getElementById('set-announcement').value = settings.announcement_text || '';
    document.getElementById('set-hero-title').value = settings.hero_title || '';
    document.getElementById('set-hero-sub').value = settings.hero_subtitle || '';

    // Flash Sale Options
    document.getElementById('set-flash-label').value = settings.flash_sale_label || '';
    document.getElementById('set-flash-discount').value = settings.flash_sale_discount || '';
    document.getElementById('set-flash-end').value = settings.flash_sale_end || '';
    document.getElementById('set-flash-active').checked = settings.flash_sale_active === '1';

    // Load social links
    try {
      const social = JSON.parse(settings.social_links || '{}');
      document.getElementById('set-insta').value = social.instagram || '';
      document.getElementById('set-fb').value = social.facebook || '';
      document.getElementById('set-yt').value = social.youtube || '';
    } catch(e){}

  } catch(err) {
    showToast('Failed to load settings.', 'error');
  }
}

async function handleSettingsFormSubmit(e) {
  e.preventDefault();

  const social_links = JSON.stringify({
    instagram: document.getElementById('set-insta').value,
    facebook: document.getElementById('set-fb').value,
    youtube: document.getElementById('set-yt').value
  });

  const settings = {
    site_name: document.getElementById('set-site-name').value,
    site_tagline: document.getElementById('set-site-tagline').value,
    whatsapp_number: document.getElementById('set-whatsapp').value,
    contact_phone: document.getElementById('set-phone').value,
    contact_email: document.getElementById('set-email').value,
    contact_address: document.getElementById('set-address').value,
    razorpay_key_id: document.getElementById('set-razorpay-key').value,
    whatsapp_admin_apikey: document.getElementById('set-whatsapp-apikey').value,
    about_us_text: document.getElementById('set-about').value,
    shipping_policy: document.getElementById('set-shipping-policy').value,
    return_policy: document.getElementById('set-return-policy').value,
    privacy_policy: document.getElementById('set-privacy-policy').value,
    announcement_text: document.getElementById('set-announcement').value,
    hero_title: document.getElementById('set-hero-title').value,
    hero_subtitle: document.getElementById('set-hero-sub').value,
    social_links
  };

  try {
    await API.admin.updateSettings(settings);
    showToast('Website configurations saved.', 'success');
  } catch (err) {
    showToast('Failed to save settings.', 'error');
  }
}

// 9. Database Backup & Restore handlers
async function triggerBackup() {
  try {
    showToast('Preparing database backup...', 'info');
    window.location.href = '/api/admin/backup';
  } catch(e) {
    showToast('Failed to trigger database download.', 'error');
  }
}

function triggerRestoreInput() {
  document.getElementById('restore-db-file').click();
}

async function handleDbRestore(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!confirm('This will completely overwrite the active database. Proceed?')) {
    e.target.value = '';
    return;
  }

  const formData = new FormData();
  formData.append('dbFile', file);

  try {
    showToast('Restoring database. Do not reload...', 'info');
    
    const response = await fetch('/api/admin/restore', {
      method: 'POST',
      body: formData
    });
    const res = await response.json();

    if (!response.ok) throw new Error(res.message);

    showToast('Database restored successfully! Reloading session...', 'success');
    setTimeout(() => window.location.reload(), 1500);
  } catch (err) {
    showToast(`Restore failed: ${err.message}`, 'error');
  } finally {
    e.target.value = '';
  }
}

// 10. Drag & Drop Helper logic
let uploadedFilesList = [];
function setupDragUpload(zoneId, inputId, previewId) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  
  if (!zone || !input || !preview) return;

  zone.addEventListener('click', () => input.click());

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    handleSelectedFiles(files, preview);
  });

  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleSelectedFiles(files, preview);
  });
}

function handleSelectedFiles(files, previewContainer) {
  // Allow multiple file cache
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    
    uploadedFilesList.push(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const item = document.createElement('div');
      item.className = 'upload-preview-item';
      item.innerHTML = `
        <img src="${e.target.result}" class="upload-preview-img">
        <span class="upload-preview-remove" onclick="removePendingImage(this, '${file.name}')">&times;</span>
      `;
      previewContainer.appendChild(item);
    };
    reader.readAsDataURL(file);
  });
}

function removePendingImage(button, fileName) {
  uploadedFilesList = uploadedFilesList.filter(file => file.name !== fileName);
  button.closest('.upload-preview-item').remove();
}

function closeAdminModal(modalId) {
  document.getElementById(modalId).classList.remove('open');
}

// ==================== NEW CUSTOMER MANAGEMENT ====================
async function loadAdminCustomers() {
  try {
    const searchVal = document.getElementById('admin-cust-search').value || '';
    const customers = await API.admin.getCustomers();
    const tbody = document.getElementById('admin-customers-list');
    
    const filtered = customers.filter(c => {
      const name = (c.customer_name || '').toLowerCase();
      const email = (c.customer_email || '').toLowerCase();
      const phone = (c.customer_phone || '').toLowerCase();
      const q = searchVal.toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No customers matched the search query.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(c => `
      <tr>
        <td><strong>${c.customer_name}</strong></td>
        <td><code>${c.customer_email}</code></td>
        <td>${c.customer_phone || 'N/A'}</td>
        <td>${c.orders_count} orders</td>
        <td><strong>₹${(c.total_spent || 0).toLocaleString()}</strong></td>
        <td>
          <button class="btn-admin" onclick="viewCustomerOrders('${c.customer_email}', '${c.customer_name}')">View Orders</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error("loadAdminCustomers Error:", err);
    showToast('Failed to load customers.', 'error');
  }
}

window.viewCustomerOrders = async function(email, name) {
  try {
    const orders = await API.admin.getOrders();
    const filtered = orders.filter(o => o.customer_email === email);
    const count = filtered.length;
    const spent = filtered.reduce((sum, o) => sum + o.total_amount, 0);
    alert(`Customer: ${name}\nTotal Orders: ${count}\nTotal Value: ₹${spent.toLocaleString()}`);
  } catch (err) {
    showToast('Failed to fetch customer orders.', 'error');
  }
};

// ==================== NEW BLOG MANAGEMENT ====================
let allBlogCategories = [];
async function loadAdminBlogs() {
  try {
    allBlogCategories = await API.getCategories({ type: 'blog' });
    const blogs = await API.admin.getBlogs();
    const tbody = document.getElementById('admin-blogs-list');
    
    if (blogs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No blog articles published yet.</td></tr>';
      return;
    }

    tbody.innerHTML = blogs.map(b => `
      <tr>
        <td><img src="${b.featured_image || '/uploads/placeholder.jpg'}" style="width:50px; height:35px; object-fit:cover; border-radius:4px;"></td>
        <td><strong>${b.title}</strong></td>
        <td>${b.category_name || 'General'}</td>
        <td>${new Date(b.publish_date).toLocaleString()}</td>
        <td>
          <span class="status-badge ${b.is_published ? 'status-delivered' : 'status-pending'}">
            ${b.is_published ? 'Published' : 'Draft'}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn-admin" onclick="openBlogEditModal(${b.id})">Edit</button>
            <button class="btn-admin btn-admin-danger" onclick="deleteBlog(${b.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to load blog articles.', 'error');
  }
}

window.openBlogCreateModal = function() {
  const form = document.getElementById('blog-form');
  form.reset();
  document.getElementById('blog-id').value = '';
  document.getElementById('blog-modal-title').textContent = 'Write Blog Post';
  
  const select = document.getElementById('blog-category');
  select.innerHTML = '<option value="">Select Category</option>' +
    allBlogCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  document.getElementById('blog-preview').innerHTML = '';
  uploadedFilesList = [];
  
  document.getElementById('blog-modal').classList.add('open');
};

window.openBlogEditModal = async function(id) {
  try {
    const blogs = await API.admin.getBlogs();
    const blog = blogs.find(b => b.id === id);
    if (!blog) return;

    const form = document.getElementById('blog-form');
    form.reset();

    document.getElementById('blog-id').value = blog.id;
    document.getElementById('blog-modal-title').textContent = 'Edit Blog Post';

    const select = document.getElementById('blog-category');
    select.innerHTML = '<option value="">Select Category</option>' +
      allBlogCategories.map(c => `<option value="${c.id}" ${c.id === blog.category_id ? 'selected' : ''}>${c.name}</option>`).join('');

    document.getElementById('blog-title').value = blog.title;
    document.getElementById('blog-short-desc').value = blog.short_desc || '';
    document.getElementById('blog-content').value = blog.content;
    document.getElementById('blog-published').checked = !!blog.is_published;
    
    if (blog.publish_date) {
      const date = new Date(blog.publish_date);
      const formatted = date.toISOString().slice(0, 16);
      document.getElementById('blog-publish-date').value = formatted;
    }

    const preview = document.getElementById('blog-preview');
    if (blog.featured_image) {
      preview.innerHTML = `
        <div class="upload-preview-item" data-existing="true" data-path="${blog.featured_image}">
          <img src="${blog.featured_image}" class="upload-preview-img">
          <span class="upload-preview-remove" onclick="removeExistingImage(this)">&times;</span>
        </div>
      `;
    } else {
      preview.innerHTML = '';
    }

    uploadedFilesList = [];
    document.getElementById('blog-modal').classList.add('open');
  } catch (err) {
    showToast('Failed to load article.', 'error');
  }
};

window.handleBlogFormSubmit = async function(e) {
  e.preventDefault();
  const id = document.getElementById('blog-id').value;
  
  const formData = new FormData();
  formData.append('title', document.getElementById('blog-title').value);
  formData.append('short_desc', document.getElementById('blog-short-desc').value);
  formData.append('content', document.getElementById('blog-content').value);
  formData.append('category_id', document.getElementById('blog-category').value);
  formData.append('publish_date', document.getElementById('blog-publish-date').value);
  formData.append('is_published', document.getElementById('blog-published').checked ? 'true' : 'false');

  if (uploadedFilesList.length > 0) {
    formData.append('featured_image', uploadedFilesList[0]);
  }

  try {
    if (id) {
      await API.admin.updateBlog(id, formData);
      showToast('Blog article updated successfully.', 'success');
    } else {
      await API.admin.addBlog(formData);
      showToast('New blog article published.', 'success');
    }
    closeAdminModal('blog-modal');
    await loadAdminBlogs();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.deleteBlog = async function(id) {
  if (confirm('Permanently delete this blog article?')) {
    try {
      await API.admin.deleteBlog(id);
      showToast('Article deleted.', 'warning');
      await loadAdminBlogs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

// ==================== NEW MARKETING & SUBSCRIBERS ====================
async function loadAdminSubscribers() {
  try {
    const subs = await API.admin.getSubscribers();
    const tbody = document.getElementById('admin-subscribers-list');
    if (subs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No email opt-in subscribers yet.</td></tr>';
      return;
    }
    tbody.innerHTML = subs.map(s => `
      <tr>
        <td><code>${s.email}</code></td>
        <td>${new Date(s.subscribed_at).toLocaleString()}</td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to load email subscribers.', 'error');
  }
}

window.saveMarketingSettings = async function(e) {
  e.preventDefault();
  const label = document.getElementById('set-flash-label').value;
  const discount = document.getElementById('set-flash-discount').value;
  const end = document.getElementById('set-flash-end').value;
  const active = document.getElementById('set-flash-active').checked ? '1' : '0';

  try {
    await API.admin.updateSettings({
      flash_sale_label: label,
      flash_sale_discount: discount,
      flash_sale_end: end,
      flash_sale_active: active
    });
    showToast('Flash sale countdown configurations saved successfully.', 'success');
  } catch (err) {
    showToast('Failed to save countdown configurations.', 'error');
  }
};

// ==================== CUSTOM CONTENT MANAGERS: FAQs & TESTIMONIALS ====================
let localFAQsList = [];
window.openFAQManagerModal = async function() {
  try {
    const settings = await API.getSettings();
    try {
      localFAQsList = JSON.parse(settings.faq_list || '[]');
    } catch(e) {
      localFAQsList = [];
    }
    renderFAQEditorRows();
    document.getElementById('faq-modal').classList.add('open');
  } catch (err) {
    showToast('Failed to fetch settings database.', 'error');
  }
};

function renderFAQEditorRows() {
  const container = document.getElementById('faq-list-container');
  if (localFAQsList.length === 0) {
    container.innerHTML = '<div style="color:#888; text-align:center; padding:1.5rem;">No FAQs defined. Click button below to add one.</div>';
    return;
  }
  container.innerHTML = localFAQsList.map((faq, idx) => `
    <div style="background:#FFF8F0; border:1px solid var(--primary-gold-border); padding:12px; border-radius:4px; display:flex; flex-direction:column; gap:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong>Question Row #${idx + 1}</strong>
        <button type="button" class="btn-admin btn-admin-danger" style="padding:2px 8px; font-size:0.75rem;" onclick="removeFAQRow(${idx})">Remove</button>
      </div>
      <input type="text" placeholder="Question Text" value="${faq.q || ''}" class="admin-form-input" style="background:white;" onchange="updateFAQVal(${idx}, 'q', this.value)">
      <textarea placeholder="Answer Text" class="admin-form-input" rows="2" style="background:white;" onchange="updateFAQVal(${idx}, 'a', this.value)">${faq.a || ''}</textarea>
    </div>
  `).join('');
}

window.addFAQRow = function() {
  localFAQsList.push({ q: '', a: '' });
  renderFAQEditorRows();
};

window.removeFAQRow = function(idx) {
  localFAQsList.splice(idx, 1);
  renderFAQEditorRows();
};

window.updateFAQVal = function(idx, key, val) {
  localFAQsList[idx][key] = val;
};

window.saveStoreFAQs = async function() {
  try {
    await API.admin.updateSettings({
      faq_list: JSON.stringify(localFAQsList.filter(f => f.q.trim() && f.a.trim()))
    });
    showToast('FAQs list updated successfully.', 'success');
    closeAdminModal('faq-modal');
  } catch (err) {
    showToast('Failed to save FAQs list.', 'error');
  }
};

let localTestimonialsList = [];
window.openTestimonialManagerModal = async function() {
  try {
    const settings = await API.getSettings();
    try {
      localTestimonialsList = JSON.parse(settings.testimonials_list || '[]');
    } catch(e) {
      localTestimonialsList = [];
    }
    renderTestimonialsEditorRows();
    document.getElementById('testimonial-modal').classList.add('open');
  } catch (err) {
    showToast('Failed to fetch settings database.', 'error');
  }
};

function renderTestimonialsEditorRows() {
  const container = document.getElementById('testimonial-list-container');
  if (localTestimonialsList.length === 0) {
    container.innerHTML = '<div style="color:#888; text-align:center; padding:1.5rem;">No testimonials found. Click button below to add one.</div>';
    return;
  }
  container.innerHTML = localTestimonialsList.map((t, idx) => `
    <div style="background:#FFF8F0; border:1px solid var(--primary-gold-border); padding:12px; border-radius:4px; display:flex; flex-direction:column; gap:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong>Review Row #${idx + 1}</strong>
        <button type="button" class="btn-admin btn-admin-danger" style="padding:2px 8px; font-size:0.75rem;" onclick="removeTestimonialRow(${idx})">Remove</button>
      </div>
      <div style="display:flex; gap:10px;">
        <input type="text" placeholder="Devotee Name" value="${t.name || ''}" class="admin-form-input" style="background:white; flex:1;" onchange="updateTestimonialVal(${idx}, 'name', this.value)">
        <input type="text" placeholder="Designation/Location" value="${t.title || ''}" class="admin-form-input" style="background:white; flex:1;" onchange="updateTestimonialVal(${idx}, 'title', this.value)">
      </div>
      <textarea placeholder="Feedback Comment" class="admin-form-input" rows="2" style="background:white;" onchange="updateTestimonialVal(${idx}, 'text', this.value)">${t.text || ''}</textarea>
    </div>
  `).join('');
}

window.addTestimonialRow = function() {
  localTestimonialsList.push({ name: '', title: '', text: '' });
  renderTestimonialsEditorRows();
};

window.removeTestimonialRow = function(idx) {
  localTestimonialsList.splice(idx, 1);
  renderTestimonialsEditorRows();
};

window.updateTestimonialVal = function(idx, key, val) {
  localTestimonialsList[idx][key] = val;
};

window.saveStoreTestimonials = async function() {
  try {
    await API.admin.updateSettings({
      testimonials_list: JSON.stringify(localTestimonialsList.filter(t => t.name.trim() && t.text.trim()))
    });
    showToast('Homepage Testimonials saved successfully.', 'success');
    closeAdminModal('testimonial-modal');
  } catch (err) {
    showToast('Failed to save testimonials list.', 'error');
  }
};

window.handleLogout = async function() {
  try {
    await API.logout();
    window.location.reload();
  } catch (err) {
    showToast('Logout failed.', 'error');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setupDragUpload('product-dragzone', 'product-file-input', 'product-preview');
  setupDragUpload('category-dragzone', 'category-file-input', 'category-preview');
  setupDragUpload('blog-dragzone', 'blog-file-input', 'blog-preview');
});
