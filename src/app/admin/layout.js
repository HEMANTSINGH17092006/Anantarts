'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminLogout, getAdminSessionAction } from '@/app/actions';
import { useState, useEffect } from 'react';

const rolePermissions = {
  super_admin: ['/admin', '/admin/products', '/admin/categories', '/admin/orders', '/admin/customers', '/admin/coupons', '/admin/content', '/admin/blogs', '/admin/settings'],
  admin: ['/admin', '/admin/products', '/admin/categories', '/admin/orders', '/admin/customers', '/admin/coupons', '/admin/content', '/admin/blogs', '/admin/settings'],
  manager: ['/admin', '/admin/products', '/admin/categories', '/admin/orders'],
  content_editor: ['/admin', '/admin/products', '/admin/categories', '/admin/blogs', '/admin/content']
};

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }
    getAdminSessionAction().then(res => {
      if (res.success) {
        setCurrentUser(res.user);
      } else {
        router.push('/admin/login');
      }
      setLoading(false);
    });
  }, [pathname, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await adminLogout();
    router.push('/admin/login');
  };

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: 'fa-chart-pie' },
    { href: '/admin/products', label: 'Products', icon: 'fa-box' },
    { href: '/admin/categories', label: 'Categories', icon: 'fa-folder' },
    { href: '/admin/orders', label: 'Orders', icon: 'fa-shopping-cart' },
    { href: '/admin/customers', label: 'Customers', icon: 'fa-users' },
    { href: '/admin/coupons', label: 'Marketing & Coupons', icon: 'fa-ticket-alt' },
    { href: '/admin/content', label: 'Content & Banners', icon: 'fa-sliders-h' },
    { href: '/admin/blogs', label: 'Blogs', icon: 'fa-pencil-alt' },
    { href: '/admin/settings', label: 'Settings', icon: 'fa-cog' }
  ];

  if (pathname === '/admin/login') {
    return children;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', display: 'block', animation: 'spin 2s linear infinite' }}>🪷</span>
          <p style={{ marginTop: '12px', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)' }}>Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const userRole = currentUser.role || 'manager';
  const allowedRoutes = rolePermissions[userRole] || [];
  const isAuthorized = allowedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-cream)' }}>
        {/* Sidebar */}
        <aside style={{
          width: '260px',
          background: 'var(--bg-dark)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--primary-gold-border)'
        }}>
          <div style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '1.75rem' }}>🪷</span>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--primary-gold)', margin: 0 }}>
                Anant Arts
              </h2>
              <span style={{ fontSize: '0.62rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Admin Console</span>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navLinks.filter(link => allowedRoutes.includes(link.href)).map((link) => {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    fontSize: '0.88rem',
                    color: 'rgba(255,255,255,0.85)',
                    background: 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <i className={`fas ${link.icon}`} style={{ width: '18px', color: 'var(--primary-gold)' }}></i>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div style={{ padding: '20px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '0.88rem',
                color: '#FF6B6B',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <i className="fas fa-sign-out-alt" style={{ width: '18px' }}></i>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
          <header style={{
            height: '70px',
            background: 'white',
            borderBottom: '1px solid var(--primary-gold-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 32px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--primary-gold-hover)' }}>
                {currentUser?.email?.substring(0,1).toUpperCase() || 'A'}
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600' }}>{currentUser?.email?.split('@')[0]}</span>
                <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}>role: {currentUser?.role}</span>
              </div>
            </div>
          </header>

          <main style={{ flex: 1, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ maxWidth: '450px', width: '100%', background: 'white', padding: '40px 32px', borderRadius: '8px', border: '1px solid var(--danger)', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', color: 'var(--danger)', marginBottom: '20px' }}>🔒</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--text-dark)', marginBottom: '12px' }}>Access Denied</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
                Your administrator account (<strong>{currentUser?.role}</strong>) does not have permission to access the route <code>{pathname}</code>.
              </p>
              <Link href="/admin" className="btn-gold" style={{ display: 'inline-flex', padding: '10px 24px', textDecoration: 'none' }}>
                Return to Dashboard
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-cream)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'var(--bg-dark)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--primary-gold-border)'
      }}>
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.75rem' }}>🪷</span>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--primary-gold)', margin: 0 }}>
              Anant Arts
            </h2>
            <span style={{ fontSize: '0.62rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Admin Console</span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navLinks.filter(link => allowedRoutes.includes(link.href)).map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? 'var(--text-dark)' : 'rgba(255,255,255,0.85)',
                  background: isActive ? 'var(--gold-gradient)' : 'transparent',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? 'var(--shadow-gold)' : 'none'
                }}
              >
                <i className={`fas ${link.icon}`} style={{ width: '18px', color: isActive ? 'var(--text-dark)' : 'var(--primary-gold)' }}></i>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (Logout) */}
        <div style={{ padding: '20px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '6px',
              fontSize: '0.88rem',
              color: '#FF6B6B',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.2s ease'
            }}
          >
            <i className="fas fa-sign-out-alt" style={{ width: '18px' }}></i>
            <span>{loggingOut ? 'Signing Out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Work Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        {/* Top Header */}
        <header style={{
          height: '70px',
          background: 'white',
          borderBottom: '1px solid var(--primary-gold-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 32px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--primary-gold-hover)' }}>
              {currentUser?.email?.substring(0, 1).toUpperCase() || 'A'}
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600' }}>{currentUser?.email?.split('@')[0]}</span>
              <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}>role: {currentUser?.role}</span>
            </div>
          </div>
        </header>

        {/* Content Box */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
