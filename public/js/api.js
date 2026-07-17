// Shared API calls for Anant Arts
const API = {
  baseUrl: '',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Set headers
    options.headers = options.headers || {};
    if (!(options.body instanceof FormData)) {
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  // Auth APIs
  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async logout() {
    return this.request('/api/auth/logout', { method: 'POST' });
  },

  async checkAuth() {
    return this.request('/api/auth/check');
  },

  // Category APIs
  async getCategories() {
    return this.request('/api/categories');
  },

  // Product APIs
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/products?${queryString}`);
  },

  async getProductBySlug(slug) {
    return this.request(`/api/products/${slug}`);
  },

  async getRelatedProducts(productId) {
    return this.request(`/api/products/${productId}/related`);
  },

  // Order APIs
  async createOrder(orderData) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  async trackOrder(orderNumber) {
    return this.request(`/api/orders/track/${orderNumber}`);
  },

  // Reviews API
  async getReviews(productId) {
    return this.request(`/api/products/${productId}/reviews`);
  },

  async addReview(productId, reviewData) {
    return this.request(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  },

  // Coupon API
  async applyCoupon(code, amount) {
    return this.request('/api/coupons/apply', {
      method: 'POST',
      body: JSON.stringify({ code, amount })
    });
  },

  // Settings / Settings Page Settings
  async getSettings() {
    return this.request('/api/settings');
  },

  // Banners API
  async getBanners() {
    return this.request('/api/banners');
  },

  // Testimonials API
  async getTestimonials() {
    return this.request('/api/testimonials');
  },

  // Admin specific APIs
  admin: {
    async getStats() {
      return API.request('/api/admin/stats');
    },

    async getOrders() {
      return API.request('/api/admin/orders');
    },

    async updateOrderStatus(orderId, status) {
      return API.request(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    },

    async sendWhatsAppUpdate(orderId) {
      return API.request(`/api/admin/orders/${orderId}/whatsapp`, {
        method: 'POST'
      });
    },

    async getCustomers() {
      return API.request('/api/admin/customers');
    },

    async getCoupons() {
      return API.request('/api/admin/coupons');
    },

    async createCoupon(couponData) {
      return API.request('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(couponData)
      });
    },

    async deleteCoupon(couponId) {
      return API.request(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE'
      });
    },

    async addProduct(formData) {
      return API.request('/api/admin/products', {
        method: 'POST',
        body: formData
      });
    },

    async updateProduct(id, formData) {
      return API.request(`/api/admin/products/${id}`, {
        method: 'PUT',
        body: formData
      });
    },

    async duplicateProduct(id) {
      return API.request(`/api/admin/products/${id}/duplicate`, {
        method: 'POST'
      });
    },

    async deleteProduct(id) {
      return API.request(`/api/admin/products/${id}`, {
        method: 'DELETE'
      });
    },

    async addCategory(formData) {
      return API.request('/api/admin/categories', {
        method: 'POST',
        body: formData
      });
    },

    async updateCategory(id, formData) {
      return API.request(`/api/admin/categories/${id}`, {
        method: 'PUT',
        body: formData
      });
    },

    async deleteCategory(id) {
      return API.request(`/api/admin/categories/${id}`, {
        method: 'DELETE'
      });
    },

    async updateSettings(settings) {
      return API.request('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings })
      });
    },

    async importProducts(csvFile) {
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      return API.request('/api/admin/products/import', {
        method: 'POST',
        body: formData
      });
    }
  }
};
