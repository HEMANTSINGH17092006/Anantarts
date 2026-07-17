const Cart = {
  getCart() {
    return JSON.parse(localStorage.getItem('anant_cart')) || [];
  },

  saveCart(cart) {
    localStorage.setItem('anant_cart', JSON.stringify(cart));
    this.updateBadges();
    // Dispatch an event so other listeners know the cart changed
    window.dispatchEvent(new Event('cartUpdated'));
  },

  addItem(product, qty = 1) {
    const cart = this.getCart();
    const existingItem = cart.find(item => item.id === product.id);
    
    // Check stock limit
    const currentQty = existingItem ? existingItem.qty : 0;
    if (currentQty + qty > product.stock_quantity) {
      showToast(`Only ${product.stock_quantity} units available in stock.`, 'warning');
      return false;
    }

    if (existingItem) {
      existingItem.qty += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.discount_price || product.price,
        image: product.image_path || '/uploads/placeholder.jpg',
        qty: qty,
        stock: product.stock_quantity
      });
    }

    this.saveCart(cart);
    showToast(`Added ${product.name} to Cart.`, 'success');
    return true;
  },

  updateQty(productId, qty) {
    let cart = this.getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
      if (qty <= 0) {
        this.removeItem(productId);
        return;
      }
      if (qty > item.stock) {
        showToast(`Only ${item.stock} items available in stock.`, 'warning');
        return;
      }
      item.qty = qty;
      this.saveCart(cart);
    }
  },

  removeItem(productId) {
    let cart = this.getCart();
    const item = cart.find(i => i.id === productId);
    cart = cart.filter(item => item.id !== productId);
    this.saveCart(cart);
    if (item) {
      showToast(`Removed ${item.name} from Cart.`, 'warning');
    }
  },

  clearCart() {
    localStorage.removeItem('anant_cart');
    this.updateBadges();
    window.dispatchEvent(new Event('cartUpdated'));
  },

  getTotals() {
    const cart = this.getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    return {
      subtotal,
      itemCount: cart.reduce((sum, item) => sum + item.qty, 0)
    };
  },

  /* Wishlist Methods */
  getWishlist() {
    return JSON.parse(localStorage.getItem('anant_wishlist')) || [];
  },

  toggleWishlist(product) {
    let wishlist = this.getWishlist();
    const idx = wishlist.findIndex(item => item.id === product.id);
    
    if (idx >= 0) {
      wishlist.splice(idx, 1);
      localStorage.setItem('anant_wishlist', JSON.stringify(wishlist));
      this.updateBadges();
      showToast(`Removed from Wishlist`, 'warning');
      return false; // Not in wishlist anymore
    } else {
      wishlist.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.discount_price || product.price,
        image: product.image_path || '/uploads/placeholder.jpg'
      });
      localStorage.setItem('anant_wishlist', JSON.stringify(wishlist));
      this.updateBadges();
      showToast(`Added to Wishlist`, 'success');
      return true; // Added
    }
  },

  isInWishlist(productId) {
    const wishlist = this.getWishlist();
    return wishlist.some(item => item.id === productId);
  },

  /* Recently Viewed Products */
  getRecentlyViewed() {
    return JSON.parse(localStorage.getItem('anant_recent')) || [];
  },

  addRecentlyViewed(product) {
    let recent = this.getRecentlyViewed();
    recent = recent.filter(item => item.id !== product.id); // Remove duplicates
    
    recent.unshift({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.discount_price || product.price,
      image: product.image_path || '/uploads/placeholder.jpg'
    });

    if (recent.length > 5) {
      recent.pop(); // Keep only 5 items
    }

    localStorage.setItem('anant_recent', JSON.stringify(recent));
  },

  /* Update header badges */
  updateBadges() {
    const cartCountEl = document.getElementById('cart-count');
    const wishlistCountEl = document.getElementById('wishlist-count');
    
    if (cartCountEl) {
      const cart = this.getCart();
      const count = cart.reduce((sum, item) => sum + item.qty, 0);
      cartCountEl.textContent = count;
      cartCountEl.style.display = count > 0 ? 'block' : 'none';
    }

    if (wishlistCountEl) {
      const wishlist = this.getWishlist();
      wishlistCountEl.textContent = wishlist.length;
      wishlistCountEl.style.display = wishlist.length > 0 ? 'block' : 'none';
    }
  }
};

// Global Toast utility
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  
  container.appendChild(toast);
  
  // Trigger entry animation
  setTimeout(() => toast.classList.add('show'), 50);
  
  // Remove toast after 3s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// Automatically sync badges on load
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadges();
});
