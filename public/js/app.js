// Customer Side Script for Anant Arts
let websiteSettings = {};

// 1. Core initialization and page routing
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch global settings first
    websiteSettings = await API.getSettings();
    
    // Inject header, footer, cart drawer, toast container
    await injectCommonLayout();

    // Check which page is currently active and run page-specific logic
    if (document.getElementById('home-page')) {
      await initHomePage();
    } else if (document.getElementById('shop-page')) {
      await initShopPage();
    } else if (document.getElementById('product-page')) {
      await initProductPage();
    } else if (document.getElementById('checkout-page')) {
      await initCheckoutPage();
    } else if (document.getElementById('tracking-page')) {
      await initTrackingPage();
    }
  } catch (error) {
    console.error('Failed to initialize page:', error);
  }
});

// 2. Common Layout Injector
async function injectCommonLayout() {
  const siteName = websiteSettings.site_name || 'Anant Arts';
  const tagline = websiteSettings.site_tagline || 'Bringing Divine Art to Every Home';
  const phone = websiteSettings.contact_phone || '+91 98765 43210';
  const email = websiteSettings.contact_email || 'care@anantarts.com';
  const address = websiteSettings.contact_address || 'New Delhi, India';
  const waNumber = websiteSettings.whatsapp_number || '919876543210';
  
  let social = { instagram: '#', facebook: '#', youtube: '#' };
  try {
    if (websiteSettings.social_links) {
      social = JSON.parse(websiteSettings.social_links);
    }
  } catch(e){}

  // Inject Header
  const headerContainer = document.getElementById('main-header');
  if (headerContainer) {
    headerContainer.innerHTML = `
      <div class="nav-container">
        <a href="index.html" class="logo-group" style="display:flex; align-items:center; gap:12px; text-decoration:none;">
          <img src="/uploads/logo.png" alt="Anant Arts Logo" style="height:45px; width:45px; border-radius:50%; border:2px solid var(--primary-gold); object-fit:cover; box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);">
          <div style="display:flex; flex-direction:column; justify-content:center;">
            <span class="logo">${siteName}</span>
            <span class="tagline">${tagline}</span>
          </div>
        </a>
        <nav>
          <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="shop.html">Shop Idols</a></li>
            <li><a href="order-tracking.html">Track Order</a></li>
            <li><a href="admin.html" target="_blank">Admin</a></li>
          </ul>
        </nav>
        <div class="nav-icons">
          <a href="shop.html" class="nav-icon" title="Search"><i class="fas fa-search"></i></a>
          <div class="nav-icon" id="wishlist-trigger" title="Wishlist" onclick="location.href='shop.html?wishlist=true'">
            <i class="far fa-heart"></i><span class="icon-badge" id="wishlist-count">0</span>
          </div>
          <div class="nav-icon" id="cart-trigger" title="Cart" onclick="toggleCartDrawer(true)">
            <i class="fas fa-shopping-bag"></i><span class="icon-badge" id="cart-count">0</span>
          </div>
        </div>
      </div>
    `;
  }

  // Inject Cart Drawer HTML
  let cartDrawer = document.getElementById('cart-drawer');
  if (!cartDrawer) {
    cartDrawer = document.createElement('div');
    cartDrawer.id = 'cart-drawer';
    cartDrawer.className = 'cart-drawer';
    cartDrawer.innerHTML = `
      <div class="cart-header">
        <h3>Shopping Cart</h3>
        <span class="cart-close" onclick="toggleCartDrawer(false)">&times;</span>
      </div>
      <div class="cart-items-list" id="cart-items-container">
        <!-- Dyn Hydrated -->
      </div>
      <div class="cart-footer">
        <div class="cart-total-row">
          <span>Subtotal:</span>
          <span id="cart-drawer-subtotal">₹0</span>
        </div>
        <button class="cart-checkout-btn" onclick="goToCheckout()">Proceed to Checkout</button>
      </div>
    `;
    document.body.appendChild(cartDrawer);

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'cart-overlay';
    overlay.className = 'cart-overlay';
    overlay.onclick = () => toggleCartDrawer(false);
    document.body.appendChild(overlay);
  }

  // Inject Floating WhatsApp widget
  let waFloat = document.getElementById('whatsapp-float');
  if (!waFloat) {
    waFloat = document.createElement('a');
    waFloat.id = 'whatsapp-float';
    waFloat.className = 'whatsapp-float';
    waFloat.href = `https://wa.me/${waNumber}?text=Hi%20Anant%20Arts%2C%20I%20am%20interested%20in%20your%20electroplated%20god%20idols.`;
    waFloat.target = '_blank';
    waFloat.innerHTML = '<i class="fab fa-whatsapp"></i>';
    waFloat.title = 'Chat on WhatsApp';
    document.body.appendChild(waFloat);
  }

  // Inject Footer
  const footerContainer = document.getElementById('main-footer');
  if (footerContainer) {
    footerContainer.innerHTML = `
      <div class="footer-container">
        <div class="footer-column">
          <h3>Anant Arts</h3>
          <p>${websiteSettings.about_us_text ? websiteSettings.about_us_text.substring(0, 160) + '...' : tagline}</p>
          <div class="social-icons">
            <a href="${social.instagram}" target="_blank" class="social-icon"><i class="fab fa-instagram"></i></a>
            <a href="${social.facebook}" target="_blank" class="social-icon"><i class="fab fa-facebook-f"></i></a>
            <a href="${social.youtube}" target="_blank" class="social-icon"><i class="fab fa-youtube"></i></a>
          </div>
        </div>
        <div class="footer-column">
          <h3>Customer Service</h3>
          <ul class="footer-links">
            <li><a href="shop.html">Browse All Idols</a></li>
            <li><a href="order-tracking.html">Track Your Order</a></li>
            <li><a href="#" onclick="showPolicyModal('shipping')">Shipping Policy</a></li>
            <li><a href="#" onclick="showPolicyModal('return')">Returns & Replacement</a></li>
            <li><a href="#" onclick="showPolicyModal('privacy')">Privacy Policy</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h3>Contact Details</h3>
          <p><i class="fas fa-phone-alt"></i> ${phone}</p>
          <p><i class="fas fa-envelope"></i> ${email}</p>
          <p><i class="fas fa-map-marker-alt"></i> ${address}</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} Anant Arts. All Rights Reserved. Crafted with Divine Devotion.</p>
        <p>Luxury Electroplated Hindu Idols</p>
      </div>
    `;
  }

  // Listen to cart update event to hydrate list
  window.addEventListener('cartUpdated', renderCartDrawer);
  
  // Initial updates
  Cart.updateBadges();
  renderCartDrawer();
}

// 3. Cart Drawer Handlers
function toggleCartDrawer(open) {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (open) {
    drawer.classList.add('open');
    overlay.classList.add('open');
    renderCartDrawer();
  } else {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
  }
}

function renderCartDrawer() {
  const container = document.getElementById('cart-items-container');
  if (!container) return;

  const cart = Cart.getCart();
  const subtotalEl = document.getElementById('cart-drawer-subtotal');
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 3rem 0; color:#888;">
        <p style="font-size:3rem; margin-bottom:1rem;">🛒</p>
        <p>Your shopping cart is empty.</p>
        <a href="shop.html" class="btn-add-cart" style="margin-top:1.5rem; display:inline-flex; width:auto; padding: 0.5rem 1rem;">Shop Collections</a>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = '₹0';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        <img src="${item.image}" alt="${item.name}">
      </div>
      <div class="cart-item-details">
        <span class="cart-item-title">${item.name}</span>
        <span class="cart-item-price">₹${item.price.toLocaleString()}</span>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="Cart.updateQty(${item.id}, ${item.qty - 1})">-</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="Cart.updateQty(${item.id}, ${item.qty + 1})">+</button>
        </div>
        <span class="cart-item-remove" onclick="Cart.removeItem(${item.id})">Remove</span>
      </div>
    </div>
  `).join('');

  const totals = Cart.getTotals();
  if (subtotalEl) {
    subtotalEl.textContent = `₹${totals.subtotal.toLocaleString()}`;
  }
}

function goToCheckout() {
  const cart = Cart.getCart();
  if (cart.length === 0) {
    showToast('Add items to your cart first!', 'warning');
    return;
  }
  window.location.href = 'checkout.html';
}

// Global policy display helper
function showPolicyModal(type) {
  let title = '', body = '';
  if (type === 'shipping') {
    title = 'Shipping Policy';
    body = websiteSettings.shipping_policy || 'Standard shipping applies.';
  } else if (type === 'return') {
    title = 'Returns & Replacement Policy';
    body = websiteSettings.return_policy || 'Returns details here.';
  } else if (type === 'privacy') {
    title = 'Privacy Policy';
    body = websiteSettings.privacy_policy || 'Privacy details here.';
  }

  // Create temporary modal alert
  const modal = document.createElement('div');
  modal.className = 'admin-modal open';
  modal.style.zIndex = '4000';
  modal.innerHTML = `
    <div class="admin-modal-content" style="max-width:550px;">
      <div class="admin-modal-header">
        <h3>${title}</h3>
        <span class="cart-close" onclick="this.closest('.admin-modal').remove()">&times;</span>
      </div>
      <div class="admin-modal-body">
        <p style="white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6; color: #444;">${body}</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// 4. Homepage Logic
async function initHomePage() {
  // Load Banners
  try {
    const banners = await API.getBanners();
    const activeBanners = banners.filter(b => b.is_active);
    const heroSection = document.querySelector('.hero-section');
    
    if (heroSection && activeBanners.length > 0) {
      // In a real app we'd construct a slide show. For this luxury single-page focus, we'll set background
      // of hero dynamically to the primary active banner.
      const mainBanner = activeBanners[0];
      heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url(${mainBanner.image_path})`;
      
      const heroTitle = heroSection.querySelector('.hero-title');
      const heroSubtitle = heroSection.querySelector('.hero-subtitle');
      const heroCta = heroSection.querySelector('.hero-cta');
      
      if (heroTitle) heroTitle.textContent = mainBanner.title;
      if (heroSubtitle) heroSubtitle.textContent = mainBanner.subtitle;
      if (heroCta) {
        heroCta.textContent = mainBanner.cta_text || 'Shop Now';
        heroCta.href = mainBanner.cta_link || 'shop.html';
      }
    }
  } catch (err) { console.error('Error hydrating home banners:', err); }

  // Load Categories list
  try {
    const categories = await API.getCategories();
    const activeCategories = categories.filter(c => !c.is_hidden);
    const catGrid = document.getElementById('home-categories-grid');
    
    if (catGrid) {
      catGrid.innerHTML = activeCategories.map(cat => `
        <a href="shop.html?category=${cat.slug}" class="category-card">
          <div class="category-card-img">
            <img src="${cat.image_path || '/uploads/placeholder.jpg'}" alt="${cat.name}">
          </div>
          <span class="category-card-title">${cat.name}</span>
        </a>
      `).join('');
    }
  } catch(err) { console.error('Error hydrating categories:', err); }

  // Load Featured, New Arrivals & Best Sellers
  try {
    const products = await API.getProducts({ limit: 12 });
    
    const featuredGrid = document.getElementById('featured-grid');
    const bestSellersGrid = document.getElementById('bestsellers-grid');
    const newArrivalsGrid = document.getElementById('newarrivals-grid');

    const featuredProds = products.filter(p => {
      try {
        const tags = JSON.parse(p.tags || '[]');
        return tags.includes('Featured');
      } catch(e) { return false; }
    }).slice(0, 4);

    const bestProds = products.filter(p => {
      try {
        const tags = JSON.parse(p.tags || '[]');
        return tags.includes('Best Seller');
      } catch(e) { return false; }
    }).slice(0, 4);

    const newProds = products.filter(p => {
      try {
        const tags = JSON.parse(p.tags || '[]');
        return tags.includes('New Arrival');
      } catch(e) { return false; }
    }).slice(0, 4);

    if (featuredGrid) featuredGrid.innerHTML = renderProductGrid(featuredProds.length > 0 ? featuredProds : products.slice(0, 4));
    if (bestSellersGrid) bestSellersGrid.innerHTML = renderProductGrid(bestProds.length > 0 ? bestProds : products.slice(1, 5));
    if (newArrivalsGrid) newArrivalsGrid.innerHTML = renderProductGrid(newProds.length > 0 ? newProds : products.slice(2, 6));

  } catch(err) { console.error('Error hydrating products:', err); }

  // Hydrate Testimonials
  try {
    const testimonials = await API.getTestimonials();
    const approvedTest = testimonials.filter(t => t.is_approved);
    const testContainer = document.getElementById('testimonials-container');
    
    if (testContainer && approvedTest.length > 0) {
      testContainer.innerHTML = approvedTest.map(t => `
        <div class="testimonial-slide">
          <p class="testimonial-comment">"${t.comment}"</p>
          <div class="testimonial-rating" style="color:#FFC107;">
            ${Array.from({length: 5}, (_, i) => `<i class="${i < t.rating ? 'fas' : 'far'} fa-star"></i>`).join('')}
          </div>
          <h4 class="testimonial-author">${t.name}</h4>
          <span class="testimonial-role">${t.role || ''}</span>
        </div>
      `).join('');
    }
  } catch(err) { console.error('Error loading testimonials:', err); }
}

function renderProductGrid(productsList) {
  return productsList.map(p => {
    let tagsList = [];
    try { tagsList = JSON.parse(p.tags || '[]'); } catch(e){}
    
    const isFeatured = tagsList.includes('Featured');
    const isBestSeller = tagsList.includes('Best Seller');
    const isNew = tagsList.includes('New Arrival');
    const isSpecial = tagsList.includes('Festival Special');
    
    const hasDiscount = p.discount_price && p.discount_price < p.price;
    const finalPrice = hasDiscount ? p.discount_price : p.price;

    return `
      <div class="product-card">
        <div class="badge-container">
          ${isFeatured ? '<span class="badge badge-featured">Featured</span>' : ''}
          ${isBestSeller ? '<span class="badge badge-bestseller">Best Seller</span>' : ''}
          ${isNew ? '<span class="badge badge-new">New</span>' : ''}
          ${isSpecial ? '<span class="badge badge-bestseller">Festival Special</span>' : ''}
          ${hasDiscount ? `<span class="badge badge-discount">-${Math.round((p.price - p.discount_price)/p.price * 100)}%</span>` : ''}
          ${p.stock_quantity === 0 ? '<span class="badge badge-discount" style="background:#444;">Out of Stock</span>' : ''}
        </div>
        <button class="wishlist-btn ${Cart.isInWishlist(p.id) ? 'active' : ''}" onclick="toggleProductWishlist(event, ${p.id}, '${p.name}', '${p.slug}', ${p.price}, ${p.discount_price || 'null'}, '${p.image_path}')">
          <i class="${Cart.isInWishlist(p.id) ? 'fas' : 'far'} fa-heart"></i>
        </button>
        <a href="product.html?slug=${p.slug}" class="product-img-wrapper">
          <img src="${p.image_path || '/uploads/placeholder.jpg'}" alt="${p.name}">
        </a>
        <div class="product-info">
          <span class="product-category">${p.category_name || 'Idol'}</span>
          <a href="product.html?slug=${p.slug}"><h4 class="product-title">${p.name}</h4></a>
          <div class="rating-stars" style="color:#FFC107;">
            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
            <span style="color:#666; font-size:0.8rem; margin-left:3px;">(5.0)</span>
          </div>
          <div class="price-wrapper">
            <span class="price">₹${finalPrice.toLocaleString()}</span>
            ${hasDiscount ? `<span class="compare-price">₹${p.price.toLocaleString()}</span>` : ''}
          </div>
          <button class="btn-add-cart" ${p.stock_quantity === 0 ? 'disabled' : ''} onclick="quickAddToCart(event, ${JSON.stringify(p).replace(/"/g, '&quot;')})">
            ${p.stock_quantity === 0 ? 'Out of Stock' : '<i class="fas fa-shopping-cart" style="margin-right:5px;"></i> Add to Cart'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function quickAddToCart(e, product) {
  e.preventDefault();
  Cart.addItem(product, 1);
}

function toggleProductWishlist(e, id, name, slug, price, discount_price, image) {
  e.preventDefault();
  const btn = e.currentTarget;
  const product = { id, name, slug, price, discount_price, image_path: image };
  const added = Cart.toggleWishlist(product);
  
  if (added) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }
}

// 5. Catalog / Shop Page Logic
async function initShopPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const selectedCat = urlParams.get('category') || '';
  const searchVal = urlParams.get('search') || '';
  const wishlistOnly = urlParams.get('wishlist') === 'true';

  // Load category sidebar checkboxes
  try {
    const categories = await API.getCategories();
    const activeCategories = categories.filter(c => !c.is_hidden);
    const filterCatContainer = document.getElementById('filter-categories');
    
    if (filterCatContainer) {
      filterCatContainer.innerHTML = activeCategories.map(cat => `
        <label class="filter-checkbox-label">
          <input type="checkbox" name="category" value="${cat.slug}" ${selectedCat === cat.slug ? 'checked' : ''}>
          <span>${cat.name}</span>
        </label>
      `).join('');
    }
  } catch(e){}

  // Bind filter triggers
  const filterInputs = document.querySelectorAll('.shop-filter-trigger');
  filterInputs.forEach(input => {
    input.addEventListener('change', () => fetchFilteredProducts());
  });

  const searchInput = document.getElementById('shop-search-input');
  if (searchInput) {
    searchInput.value = searchVal;
    searchInput.addEventListener('input', debounce(() => fetchFilteredProducts(), 400));
  }

  // Pre-load
  await fetchFilteredProducts(wishlistOnly);
}

async function fetchFilteredProducts(wishlistOnly = false) {
  const gridContainer = document.getElementById('shop-products-grid');
  if (!gridContainer) return;

  gridContainer.innerHTML = '<div style="text-align:center; grid-column: 1/-1; padding:4rem;">Divine designs loading... 🏵️</div>';

  if (wishlistOnly) {
    const wishlist = Cart.getWishlist();
    if (wishlist.length === 0) {
      gridContainer.innerHTML = '<div style="text-align:center; grid-column: 1/-1; padding:4rem; color:#888;"><p style="font-size:3rem;">❤️</p><p>Your Wishlist is empty.</p></div>';
      return;
    }
    // Reformat slightly to match product grid keys
    const items = wishlist.map(w => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      price: w.price,
      discount_price: null,
      image_path: w.image,
      stock_quantity: 10,
      tags: '[]'
    }));
    gridContainer.innerHTML = renderProductGrid(items);
    return;
  }

  // Collect parameters
  const searchInput = document.getElementById('shop-search-input');
  const search = searchInput ? searchInput.value : '';

  const catCheckboxes = document.querySelectorAll('input[name="category"]:checked');
  const categories = Array.from(catCheckboxes).map(cb => cb.value).join(',');

  const sortSelect = document.getElementById('shop-sort-select');
  const sort = sortSelect ? sortSelect.value : 'popularity';

  const priceRange = document.getElementById('shop-price-range');
  const maxPrice = priceRange ? priceRange.value : 100000;
  
  const priceValEl = document.getElementById('price-range-val');
  if (priceValEl) priceValEl.textContent = `₹${parseInt(maxPrice).toLocaleString()}`;

  const stockCheck = document.getElementById('shop-stock-only');
  const inStock = stockCheck && stockCheck.checked ? 1 : 0;

  try {
    const products = await API.getProducts({
      search,
      categories,
      sort,
      maxPrice,
      inStock
    });

    if (products.length === 0) {
      gridContainer.innerHTML = '<div style="text-align:center; grid-column: 1/-1; padding:4rem; color:#888;"><p style="font-size:3rem;">🌸</p><p>No divine statues found matching your criteria.</p></div>';
      return;
    }

    gridContainer.innerHTML = renderProductGrid(products);
  } catch (err) {
    gridContainer.innerHTML = '<div style="text-align:center; grid-column: 1/-1; padding:4rem; color:red;">Failed to retrieve products. Please reload.</div>';
  }
}

// 6. Product Detail Page
let currentProduct = null;
async function initProductPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');
  
  if (!slug) {
    window.location.href = 'shop.html';
    return;
  }

  try {
    const data = await API.getProductBySlug(slug);
    currentProduct = data.product;
    const images = data.images;

    // Log to recently viewed
    Cart.addRecentlyViewed(currentProduct);

    // Render breadcrumbs / Title
    document.title = `${currentProduct.name} - Anant Arts`;
    document.getElementById('p-title').textContent = currentProduct.name;
    document.getElementById('p-category').textContent = currentProduct.category_name;
    document.getElementById('p-material').textContent = currentProduct.material || 'Electroplated Brass';
    document.getElementById('p-dimensions').textContent = currentProduct.dimensions || 'N/A';
    document.getElementById('p-weight').textContent = currentProduct.weight ? `${currentProduct.weight} Kg` : 'N/A';
    document.getElementById('p-sku').textContent = currentProduct.sku || 'N/A';
    document.getElementById('p-desc').textContent = currentProduct.description;

    // Price
    const hasDiscount = currentProduct.discount_price && currentProduct.discount_price < currentProduct.price;
    const finalPrice = hasDiscount ? currentProduct.discount_price : currentProduct.price;
    
    document.getElementById('p-price').textContent = `₹${finalPrice.toLocaleString()}`;
    const compEl = document.getElementById('p-compare-price');
    if (hasDiscount) {
      compEl.textContent = `₹${currentProduct.price.toLocaleString()}`;
      compEl.style.display = 'inline';
    } else {
      compEl.style.display = 'none';
    }

    // Stock alert
    const stockEl = document.getElementById('p-stock-alert');
    const addToCartBtn = document.getElementById('p-add-cart-btn');
    const buyNowBtn = document.getElementById('p-buy-now-btn');
    
    if (currentProduct.stock_quantity === 0) {
      stockEl.textContent = 'Out of Stock';
      stockEl.style.color = 'var(--color-danger)';
      if (addToCartBtn) addToCartBtn.disabled = true;
      if (buyNowBtn) buyNowBtn.disabled = true;
    } else if (currentProduct.stock_quantity < 5) {
      stockEl.textContent = `Only ${currentProduct.stock_quantity} left in stock - order soon!`;
      stockEl.style.color = 'var(--color-warning)';
    } else {
      stockEl.textContent = 'In Stock (Ready to Ship)';
      stockEl.style.color = 'var(--color-success)';
    }

    // Images display
    const mainImg = document.getElementById('p-main-image');
    const thumbContainer = document.getElementById('p-thumbnails');
    
    if (images.length > 0) {
      const primaryImg = images.find(img => img.is_primary) || images[0];
      mainImg.src = primaryImg.image_path;

      thumbContainer.innerHTML = images.map((img, index) => `
        <div class="thumb-wrapper ${img.is_primary ? 'active' : ''}" onclick="changeProductImage(this, '${img.image_path}')">
          <img src="${img.image_path}" alt="Product Thumbnail ${index+1}">
        </div>
      `).join('');
    } else {
      mainImg.src = '/uploads/placeholder.jpg';
      thumbContainer.innerHTML = '';
    }

    // Setup interactive Zoom
    setupImageZoom(mainImg);

    // Reviews list
    await loadProductReviews(currentProduct.id);

    // Related products
    await loadRelatedProducts(currentProduct.id);

    // Recently viewed list hydration
    loadRecentlyViewedSection();

  } catch (err) {
    console.error('Error loading product detail:', err);
    showToast('Failed to load product details.', 'error');
  }
}

function changeProductImage(element, src) {
  document.getElementById('p-main-image').src = src;
  document.querySelectorAll('.thumb-wrapper').forEach(t => t.classList.remove('active'));
  element.classList.add('active');
}

function setupImageZoom(imgElement) {
  const container = imgElement.parentElement;
  
  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    imgElement.style.transformOrigin = `${x}px ${y}px`;
    imgElement.style.transform = 'scale(2)';
  });

  container.addEventListener('mouseleave', () => {
    imgElement.style.transformOrigin = 'center';
    imgElement.style.transform = 'scale(1)';
  });
}

function addProductToCart() {
  if (!currentProduct) return;
  const qtyInput = document.getElementById('p-qty');
  const qty = qtyInput ? parseInt(qtyInput.value) : 1;
  Cart.addItem(currentProduct, qty);
}

function buyProductNow() {
  if (!currentProduct) return;
  const qtyInput = document.getElementById('p-qty');
  const qty = qtyInput ? parseInt(qtyInput.value) : 1;
  const added = Cart.addItem(currentProduct, qty);
  if (added) {
    window.location.href = 'checkout.html';
  }
}

async function loadProductReviews(productId) {
  const container = document.getElementById('reviews-list');
  if (!container) return;

  try {
    const reviews = await API.getReviews(productId);
    const approved = reviews.filter(r => r.is_approved);
    
    if (approved.length === 0) {
      container.innerHTML = '<p style="color:#666; font-style:italic;">No reviews yet. Be the first to review this holy sculpture!</p>';
      return;
    }

    container.innerHTML = approved.map(r => `
      <div style="border-bottom:1px solid #EEE; padding:1.25rem 0;">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
          <strong style="color:var(--luxury-maroon);">${r.reviewer_name}</strong>
          <span style="color:#FFC107;">
            ${Array.from({length: 5}, (_, i) => `<i class="${i < r.rating ? 'fas' : 'far'} fa-star"></i>`).join('')}
          </span>
        </div>
        <p style="font-size:0.95rem; color:#444;">${r.comment}</p>
        <span style="font-size:0.75rem; color:#888;">Posted on: ${new Date(r.created_at).toLocaleDateString()}</span>
      </div>
    `).join('');
  } catch(e) {}
}

async function submitReview(e) {
  e.preventDefault();
  if (!currentProduct) return;

  const name = document.getElementById('rev-name').value;
  const email = document.getElementById('rev-email').value;
  const rating = document.querySelector('input[name="rev-rating"]:checked')?.value || 5;
  const comment = document.getElementById('rev-comment').value;

  try {
    await API.addReview(currentProduct.id, {
      reviewer_name: name,
      reviewer_email: email,
      rating,
      comment
    });
    showToast('Thank you! Your review has been submitted.', 'success');
    e.target.reset();
    await loadProductReviews(currentProduct.id);
  } catch (err) {
    showToast('Failed to save review.', 'error');
  }
}

async function loadRelatedProducts(productId) {
  const container = document.getElementById('related-products-grid');
  if (!container) return;

  try {
    const products = await API.getRelatedProducts(productId);
    if (products.length === 0) {
      container.parentElement.style.display = 'none';
      return;
    }
    container.innerHTML = renderProductGrid(products.slice(0, 4));
  } catch(e){}
}

function loadRecentlyViewedSection() {
  const container = document.getElementById('recent-products-grid');
  if (!container) return;

  const items = Cart.getRecentlyViewed().filter(item => item.id !== currentProduct.id);
  if (items.length === 0) {
    container.parentElement.style.display = 'none';
    return;
  }

  // Structure items to fit card rendering
  const mapped = items.map(i => ({
    id: i.id,
    name: i.name,
    slug: i.slug,
    price: i.price,
    discount_price: null,
    image_path: i.image,
    stock_quantity: 10,
    tags: '[]'
  }));

  container.innerHTML = renderProductGrid(mapped);
}

// 7. Checkout Logic
let appliedCoupon = null;
async function initCheckoutPage() {
  renderCheckoutSummary();

  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  // Watch coupon
  const couponBtn = document.getElementById('apply-coupon-btn');
  if (couponBtn) {
    couponBtn.addEventListener('click', applyCouponCode);
  }
}

function renderCheckoutSummary() {
  const container = document.getElementById('checkout-items');
  if (!container) return;

  const cart = Cart.getCart();
  if (cart.length === 0) {
    container.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid #EEE; padding-bottom:0.75rem;">
      <div style="display:flex; gap:1rem; align-items:center;">
        <img src="${item.image}" alt="${item.name}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
        <div>
          <h5 style="margin:0; font-size:0.9rem;">${item.name}</h5>
          <span style="font-size:0.8rem; color:#666;">Qty: ${item.qty}</span>
        </div>
      </div>
      <strong style="font-size:0.95rem;">₹${(item.price * item.qty).toLocaleString()}</strong>
    </div>
  `).join('');

  updateCheckoutTotals();
}

function updateCheckoutTotals() {
  const { subtotal } = Cart.getTotals();
  const subtotalEl = document.getElementById('chk-subtotal');
  const discountRowEl = document.getElementById('chk-discount-row');
  const discountValEl = document.getElementById('chk-discount');
  const shippingEl = document.getElementById('chk-shipping');
  const totalEl = document.getElementById('chk-total');

  subtotalEl.textContent = `₹${subtotal.toLocaleString()}`;

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discount = (subtotal * appliedCoupon.discount_value) / 100;
    } else if (appliedCoupon.discount_type === 'flat') {
      discount = appliedCoupon.discount_value;
    } else if (appliedCoupon.discount_type === 'free_shipping') {
      discount = 0; // Handled under shipping
    }
  }

  if (discount > 0) {
    discountValEl.textContent = `-₹${discount.toLocaleString()}`;
    discountRowEl.style.display = 'flex';
  } else {
    discountRowEl.style.display = 'none';
  }

  let shipping = 150; // Standard shipping
  if (subtotal > 15000 || (appliedCoupon && appliedCoupon.discount_type === 'free_shipping')) {
    shipping = 0;
  }
  shippingEl.textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;

  const total = subtotal - discount + shipping;
  totalEl.textContent = `₹${total.toLocaleString()}`;
}

async function applyCouponCode() {
  const codeInput = document.getElementById('coupon-code-input');
  const code = codeInput.value.trim().toUpperCase();
  if (!code) return;

  const { subtotal } = Cart.getTotals();
  try {
    const res = await API.applyCoupon(code, subtotal);
    appliedCoupon = res.coupon;
    updateCheckoutTotals();
    showToast(`Coupon "${code}" applied successfully!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  
  try {
    const cart = Cart.getCart();
    if (cart.length === 0) {
      showToast('Your cart is empty.', 'error');
      return;
    }

    // Gather details
    const name = document.getElementById('billing-name').value;
    const email = document.getElementById('billing-email').value;
    const phone = document.getElementById('billing-phone').value;
    const address = document.getElementById('billing-address').value;
    const city = document.getElementById('billing-city').value;
    const state = document.getElementById('billing-state').value;
    const pin = document.getElementById('billing-pin').value;
    const notes = document.getElementById('billing-notes').value;
    const payMethod = document.querySelector('input[name="payment-method"]:checked').value;

    const fullAddress = `${address}, ${city}, ${state} - ${pin}`;
    
    const { subtotal } = Cart.getTotals();
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'percentage') {
        discount = (subtotal * appliedCoupon.discount_value) / 100;
      } else if (appliedCoupon.discount_type === 'flat') {
        discount = appliedCoupon.discount_value;
      }
    }

    let shipping = subtotal > 15000 || (appliedCoupon && appliedCoupon.discount_type === 'free_shipping') ? 0 : 150;
    const total = subtotal - discount + shipping;

    const orderData = {
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      shipping_address: fullAddress,
      billing_address: fullAddress,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      discount_amount: discount,
      shipping_charge: shipping,
      subtotal: subtotal,
      total_amount: total,
      payment_method: payMethod,
      notes: notes,
      items: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.qty
      }))
    };

    // Razorpay Checkout routing
    if (payMethod !== 'COD') {
      const razorpayKey = websiteSettings.razorpay_key_id ? websiteSettings.razorpay_key_id.trim() : '';

      if (razorpayKey !== '' && typeof Razorpay !== 'undefined') {
        showToast('Opening secure Razorpay Sandbox gateway...', 'info');
        const options = {
          "key": razorpayKey,
          "amount": Math.round(total * 100), // In paisa
          "currency": "INR",
          "name": "Anant Arts",
          "description": "Payment for Luxury Divine Idols",
          "theme": {
            "color": "#800020"
          },
          "prefill": {
            "name": name,
            "email": email,
            "contact": phone
          },
          "handler": async function (response) {
            orderData.payment_status = 'Paid';
            orderData.transaction_id = response.razorpay_payment_id || ('PAY-' + Date.now());
            await submitFinalOrder(orderData);
          },
          "modal": {
            "ondismiss": function() {
              showToast('Payment cancelled by user.', 'warning');
            }
          }
        };
        const rzp = new Razorpay(options);
        rzp.open();
      } else {
        // Fallback popup if key is not saved or script not loaded
        showToast('Opening local Sandbox Payment terminal...', 'info');
        const payModal = document.createElement('div');
        payModal.className = 'admin-modal open';
        payModal.style.zIndex = '5000';
        payModal.innerHTML = `
          <div class="admin-modal-content" style="max-width:420px; text-align:center; padding: 2rem; border-top: 5px solid var(--luxury-maroon);">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #EEE; padding-bottom:1rem; margin-bottom:1.5rem;">
              <strong style="color:var(--luxury-maroon); font-size:1.1rem; font-family:var(--font-heading);">Razorpay Sandbox</strong>
              <span style="font-size:0.75rem; background:#E0F2F1; color:#004D40; padding:2px 6px; border-radius:4px; font-weight:bold;">TEST MODE</span>
            </div>
            
            <div style="background:var(--bg-cream); padding:1rem; border-radius:4px; margin-bottom:1rem; text-align:left; border:1px solid var(--primary-gold-border);">
              <div style="font-size:0.8rem; color:#666;">PAYING TO</div>
              <strong style="font-size:1rem; color:var(--luxury-maroon);">Anant Arts Studio</strong>
              <div style="display:flex; justify-content:space-between; margin-top:0.75rem; border-top:1px dashed #CCC; padding-top:0.5rem;">
                <span>Amount:</span>
                <strong style="color:var(--luxury-maroon);">₹${total.toLocaleString()}</strong>
              </div>
            </div>

            <small style="color:#666; font-size:0.75rem; display:block; margin-bottom:1.5rem; text-align:left; line-height:1.4;">
              💡 <strong>Merchant Note:</strong> To load the real official Razorpay Sandbox screen overlay instead, paste your **Razorpay Test Key ID** into the settings form in your **Admin Control Panel**.
            </small>

            <p style="font-size:0.85rem; color:#555; margin-bottom:1.5rem;">Select simulated authorization result to complete this order:</p>
            
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              <button class="btn-add-cart" id="btn-mock-pay-success" style="background:var(--gold-gradient); color:var(--text-dark); border:none;">
                Authorize & Confirm (Success) ✔
              </button>
              <button class="btn-add-cart btn-admin-danger" id="btn-mock-pay-fail" style="border:none;">
                Decline & Cancel (Fail) ✘
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(payModal);

        return new Promise((resolve) => {
          document.getElementById('btn-mock-pay-success').onclick = async () => {
            payModal.remove();
            orderData.payment_status = 'Paid';
            orderData.transaction_id = 'PAY-RZP-MOCK-' + Date.now();
            await submitFinalOrder(orderData);
            resolve();
          };
          
          document.getElementById('btn-mock-pay-fail').onclick = () => {
            payModal.remove();
            showToast('Payment declined by sandbox gateway.', 'error');
            resolve();
          };
        });
      }
    } else {
      orderData.payment_status = 'Pending';
      await submitFinalOrder(orderData);
    }
  } catch (error) {
    console.error('Checkout submission error:', error);
    showToast(`Checkout Error: ${error.message}`, 'error');
  }
}

async function submitFinalOrder(orderData) {
  try {
    const res = await API.createOrder(orderData);
    Cart.clearCart();
    
    // Show order success modal with dynamic details
    const successModal = document.createElement('div');
    successModal.className = 'admin-modal open';
    successModal.style.zIndex = '5000';
    successModal.innerHTML = `
      <div class="admin-modal-content" style="max-width:500px; text-align:center; padding: 2.5rem;">
        <span style="font-size:4rem; color:var(--color-success);">🌸</span>
        <h2 style="color:var(--luxury-maroon); margin: 1rem 0;">Order Placed Successfully!</h2>
        <p style="font-size:0.95rem; margin-bottom:1rem;">Thank you for shopping at Anant Arts. Your order has been registered.</p>
        <div style="background:var(--bg-cream); padding:1rem; border-radius:4px; margin-bottom:1.5rem; border: 1px solid var(--primary-gold-border);">
          <p>Order Number: <strong style="color:var(--luxury-maroon); font-size:1.1rem;">${res.order.order_number}</strong></p>
          <p>Estimated Delivery: <strong>3-7 Business Days</strong></p>
        </div>
        <p style="font-size:0.8rem; color:#666; margin-bottom:1.5rem;">A mock WhatsApp confirmation has been dispatched to ${orderData.customer_phone}</p>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          <a href="/api/orders/${res.order.id}/invoice" target="_blank" class="btn-add-cart">Download Invoice PDF 📄</a>
          <a href="order-tracking.html?order=${res.order.order_number}" class="btn-add-cart" style="background:var(--gold-gradient); color:var(--text-dark); border:none;">Track Order Status 🚚</a>
          <a href="index.html" style="color:var(--luxury-maroon); font-weight:bold; margin-top:1rem;">Continue Shopping</a>
        </div>
      </div>
    `;
    document.body.appendChild(successModal);
  } catch (err) {
    showToast(`Order submission failed: ${err.message}`, 'error');
  }
}

// 8. Order Tracking Logic
async function initTrackingPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderNum = urlParams.get('order') || '';
  
  const searchInput = document.getElementById('tracking-input');
  if (searchInput) {
    searchInput.value = orderNum;
  }

  if (orderNum) {
    await fetchOrderTracking(orderNum);
  }

  const trackForm = document.getElementById('tracking-form');
  if (trackForm) {
    trackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('tracking-input').value.trim();
      if (code) {
        fetchOrderTracking(code);
      }
    });
  }
}

async function fetchOrderTracking(orderNumber) {
  const resultsContainer = document.getElementById('tracking-results');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = '<div style="text-align:center; padding:3rem;">Retrieving order journey... 🏵Y</div>';

  try {
    const data = await API.trackOrder(orderNumber);
    const order = data.order;
    const items = data.items;

    // Track status index helper
    const stages = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
    const activeIndex = stages.indexOf(order.order_status);

    resultsContainer.innerHTML = `
      <div class="admin-card" style="margin-top:2rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #EEE; padding-bottom:1rem; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
          <div>
            <h3>Order ID: #${order.order_number}</h3>
            <span style="color:#888; font-size:0.85rem;">Date Placed: ${new Date(order.created_at).toLocaleString()}</span>
          </div>
          <div>
            <span class="status-badge status-${order.order_status.toLowerCase()}">${order.order_status}</span>
          </div>
        </div>

        <!-- Tracking Visualizer -->
        <div style="display:flex; justify-content:space-between; position:relative; margin:3rem 0; padding:0 1rem;">
          <div style="position:absolute; top:12px; left:2rem; right:2rem; height:4px; background:#DDD; z-index:1;">
            <div style="height:100%; width:${(activeIndex / (stages.length - 1)) * 100}%; background:var(--primary-gold); transition: width 0.8s ease;"></div>
          </div>
          ${stages.map((stage, idx) => {
            const isCompleted = idx <= activeIndex;
            return `
              <div style="display:flex; flex-direction:column; align-items:center; z-index:2; position:relative;">
                <div style="width:28px; height:28px; border-radius:50%; background:${isCompleted ? 'var(--primary-gold)' : '#FFF'}; border: 4px solid ${isCompleted ? 'var(--luxury-maroon)' : '#DDD'}; display:flex; align-items:center; justify-content:center; color:${isCompleted ? '#FFF' : '#888'}; font-size:0.6rem; font-weight:bold;">
                  ${isCompleted ? '✔' : ''}
                </div>
                <span style="font-size:0.8rem; font-weight:${isCompleted ? 'bold' : 'normal'}; color:${isCompleted ? 'var(--luxury-maroon)' : '#888'}; margin-top:0.5rem;">${stage}</span>
              </div>
            `;
          }).join('')}
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:2rem; margin-top:2rem; border-top:1px solid #EEE; padding-top:2rem;">
          <div>
            <h4 style="color:var(--luxury-maroon); margin-bottom:0.75rem;">Delivery Address</h4>
            <p style="font-size:0.9rem; color:#555; white-space:pre-line;">${order.shipping_address}</p>
          </div>
          <div>
            <h4 style="color:var(--luxury-maroon); margin-bottom:0.75rem;">Journey Summary</h4>
            <table style="width:100%; font-size:0.9rem;">
              <tr>
                <td style="color:#666; padding:4px 0;">Payment Method:</td>
                <td><strong>${order.payment_method}</strong></td>
              </tr>
              <tr>
                <td style="color:#666; padding:4px 0;">Payment Status:</td>
                <td><strong style="color:${order.payment_status === 'Paid' ? 'var(--color-success)' : 'var(--color-warning)'}">${order.payment_status}</strong></td>
              </tr>
              <tr>
                <td style="color:#666; padding:4px 0;">Items Purchased:</td>
                <td><strong>${items.reduce((acc, i) => acc + i.quantity, 0)} items</strong></td>
              </tr>
              <tr>
                <td style="color:#666; padding:4px 0;">Grand Total:</td>
                <td><strong style="color:var(--luxury-maroon); font-size:1.1rem;">₹${order.total_amount.toLocaleString()}</strong></td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    resultsContainer.innerHTML = `
      <div class="admin-card" style="text-align:center; color:var(--color-danger); padding:3rem;">
        <p>Order number not found. Please verify the code and try again.</p>
      </div>
    `;
  }
}

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
