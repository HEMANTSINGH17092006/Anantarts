'use client';
import { useState } from 'react';
import { AppProviders } from '../context/AppContext';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import SearchDrawer from './SearchDrawer';
import WishlistDrawer from './WishlistDrawer';
import MenuDrawer from './MenuDrawer';

export default function AppLayout({ children, settings = {} }) {
  // Centralized drawer state: null | 'cart' | 'search' | 'wishlist' | 'menu'
  const [activeDrawer, setActiveDrawer] = useState(null);

  const toggleDrawer = (drawerName) => {
    setActiveDrawer((prev) => (prev === drawerName ? null : drawerName));
  };

  const closeDrawer = () => setActiveDrawer(null);

  return (
    <AppProviders>
      <div className="site-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header 
          settings={settings} 
          onCartClick={() => toggleDrawer('cart')} 
          onSearchClick={() => toggleDrawer('search')}
          onWishlistClick={() => toggleDrawer('wishlist')}
          onMenuClick={() => toggleDrawer('menu')}
          activeDrawer={activeDrawer}
        />

        {/* Centralized Exclusive Drawers */}
        <CartDrawer isOpen={activeDrawer === 'cart'} onClose={closeDrawer} />
        <SearchDrawer isOpen={activeDrawer === 'search'} onClose={closeDrawer} />
        <WishlistDrawer isOpen={activeDrawer === 'wishlist'} onClose={closeDrawer} />
        <MenuDrawer isOpen={activeDrawer === 'menu'} onClose={closeDrawer} />

        <main style={{ flex: 1 }}>
          {children}
        </main>

        <Footer 
          settings={settings} 
          onCartClick={() => toggleDrawer('cart')} 
          onSearchClick={() => toggleDrawer('search')}
          onWishlistClick={() => toggleDrawer('wishlist')}
          onMenuClick={() => toggleDrawer('menu')}
          activeDrawer={activeDrawer}
        />
      </div>
    </AppProviders>
  );
}
