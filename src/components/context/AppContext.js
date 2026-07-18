'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();
const WishlistContext = createContext();

export function AppProviders({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load cart and wishlist from LocalStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('anant_cart');
      const savedWishlist = localStorage.getItem('anant_wishlist');
      const savedCoupon = localStorage.getItem('anant_coupon');

      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
      if (savedCoupon) setCoupon(JSON.parse(savedCoupon));
    } catch (e) {
      console.error('Error loading cart/wishlist from storage:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save cart to LocalStorage when changed
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('anant_cart', JSON.stringify(cart));
    }
  }, [cart, loading]);

  // Save wishlist to LocalStorage when changed
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('anant_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, loading]);

  // Save coupon to LocalStorage when changed
  useEffect(() => {
    if (!loading) {
      if (coupon) {
        localStorage.setItem('anant_coupon', JSON.stringify(coupon));
      } else {
        localStorage.removeItem('anant_coupon');
      }
    }
  }, [coupon, loading]);

  // --- Cart Helpers ---
  const addToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      const stock = product.stock_quantity ?? 99;
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, stock);
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        const newQty = Math.min(quantity, stock);
        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            discount_price: product.discount_price,
            image_path: product.image_path,
            sku: product.sku,
            stock_quantity: stock,
            quantity: newQty,
          },
        ];
      }
    });
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === id) {
          const stock = item.stock_quantity ?? 99;
          const newQty = Math.max(1, Math.min(quantity, stock));
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setCoupon(null);
  };

  const applyCoupon = async (code) => {
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: getSubtotal() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid coupon');
      setCoupon(data.coupon);
      return { success: true, message: 'Coupon applied successfully' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  const getSubtotal = () => {
    return cart.reduce((acc, item) => {
      const activePrice = item.discount_price && item.discount_price > 0 ? item.discount_price : item.price;
      return acc + activePrice * item.quantity;
    }, 0);
  };

  const getOriginalSubtotal = () => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const getDiscountAmount = () => {
    if (!coupon) return 0;
    const subtotal = getSubtotal();
    if (subtotal < (coupon.min_order_amount || 0)) return 0;

    if (coupon.discount_type === 'percentage') {
      return Math.round((subtotal * coupon.discount_value) / 100);
    } else if (coupon.discount_type === 'flat') {
      return Math.min(coupon.discount_value, subtotal);
    }
    return 0;
  };

  const getShippingCharge = () => {
    const subtotal = getSubtotal();
    if (subtotal === 0) return 0;
    if (coupon && coupon.discount_type === 'free_shipping') return 0;
    // Free shipping above 10000, else 150 shipping charge
    return subtotal >= 10000 ? 0 : 150;
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    const shipping = getShippingCharge();
    return Math.max(0, subtotal - discount + shipping);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // --- Wishlist Helpers ---
  const addToWishlist = (product) => {
    setWishlist((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          discount_price: product.discount_price,
          image_path: product.image_path,
        },
      ];
    });
  };

  const removeFromWishlist = (id) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  };

  const isInWishlist = (id) => {
    return wishlist.some((item) => item.id === id);
  };

  const toggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      return false;
    } else {
      addToWishlist(product);
      return true;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        subtotal: getSubtotal(),
        originalSubtotal: getOriginalSubtotal(),
        discount: getDiscountAmount(),
        shipping: getShippingCharge(),
        total: getTotal(),
        coupon,
        applyCoupon,
        removeCoupon,
      }}
    >
      <WishlistContext.Provider
        value={{
          wishlist,
          addToWishlist,
          removeFromWishlist,
          isInWishlist,
          toggleWishlist,
          wishlistCount: wishlist.length,
        }}
      >
        {children}
      </WishlistContext.Provider>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within AppProviders');
  return context;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within AppProviders');
  return context;
}
