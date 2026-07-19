'use client';
import { useState } from 'react';
import { AppProviders } from '../context/AppContext';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import SearchDrawer from './SearchDrawer';
import WishlistDrawer from './WishlistDrawer';

export default function AppLayout({ children, settings = {} }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  return (
    <AppProviders>
      <div className="site-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header 
          settings={settings} 
          onCartClick={() => setCartOpen(true)} 
          onSearchClick={() => setSearchOpen(true)}
          onWishlistClick={() => setWishlistOpen(true)}
        />
        <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        <SearchDrawer isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        <WishlistDrawer isOpen={wishlistOpen} onClose={() => setWishlistOpen(false)} />
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <Footer 
          settings={settings} 
          onCartClick={() => setCartOpen(true)} 
          onSearchClick={() => setSearchOpen(true)}
          onWishlistClick={() => setWishlistOpen(true)}
          cartOpen={cartOpen}
          searchOpen={searchOpen}
          wishlistOpen={wishlistOpen}
        />
      </div>
    </AppProviders>
  );
}
