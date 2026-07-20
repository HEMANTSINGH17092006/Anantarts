'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppProviders } from '../context/AppContext';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import SearchDrawer from './SearchDrawer';
import WishlistDrawer from './WishlistDrawer';
import MenuDrawer from './MenuDrawer';

export default function AppLayout({ children, settings = {} }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  // Single Source of Truth for mobile navigation tab & open drawer:
  // null | 'search' | 'wishlist' | 'cart' | 'menu'
  const [activeTab, setActiveTab] = useState(null);

  const toggleTab = (tabName) => {
    setActiveTab((prev) => (prev === tabName ? null : tabName));
  };

  const closeTab = () => setActiveTab(null);

  if (isAdmin) {
    return (
      <AppProviders>
        <div style={{ minHeight: '100vh', background: '#F8FAF9' }}>
          {children}
        </div>
      </AppProviders>
    );
  }

  return (
    <AppProviders>
      <div className="site-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header 
          settings={settings} 
          onCartClick={() => toggleTab('cart')} 
          onSearchClick={() => toggleTab('search')}
          onWishlistClick={() => toggleTab('wishlist')}
          onMenuClick={() => toggleTab('menu')}
          activeTab={activeTab}
        />

        {/* Centralized Exclusive Drawers */}
        <CartDrawer isOpen={activeTab === 'cart'} onClose={closeTab} />
        <SearchDrawer isOpen={activeTab === 'search'} onClose={closeTab} />
        <WishlistDrawer isOpen={activeTab === 'wishlist'} onClose={closeTab} />
        <MenuDrawer isOpen={activeTab === 'menu'} onClose={closeTab} />

        <main style={{ flex: 1 }}>
          {children}
        </main>

        <Footer 
          settings={settings} 
          onCartClick={() => toggleTab('cart')} 
          onSearchClick={() => toggleTab('search')}
          onWishlistClick={() => toggleTab('wishlist')}
          onMenuClick={() => toggleTab('menu')}
          activeTab={activeTab}
        />
      </div>
    </AppProviders>
  );
}
