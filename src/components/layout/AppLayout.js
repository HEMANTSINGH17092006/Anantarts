'use client';
import { useState } from 'react';
import { AppProviders } from '../context/AppContext';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';

export default function AppLayout({ children, settings = {} }) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <AppProviders>
      <div className="site-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header settings={settings} onCartClick={() => setCartOpen(true)} />
        <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <Footer settings={settings} />
      </div>
    </AppProviders>
  );
}
