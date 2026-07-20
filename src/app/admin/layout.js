'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminLogout, getAdminSessionAction, getAdminNotificationsAction, markNotificationsReadAction } from '@/app/actions';
import { useState, useEffect } from 'react';

const rolePermissions = {
  super_admin: ['/admin', '/admin/products', '/admin/categories', '/admin/orders', '/admin/customers', '/admin/payment-recovery', '/admin/coupons', '/admin/content', '/admin/blogs', '/admin/settings'],
  admin: ['/admin', '/admin/products', '/admin/categories', '/admin/orders', '/admin/customers', '/admin/payment-recovery', '/admin/coupons', '/admin/content', '/admin/blogs', '/admin/settings'],
  manager: ['/admin', '/admin/products', '/admin/categories', '/admin/orders', '/admin/payment-recovery'],
  content_editor: ['/admin', '/admin/products', '/admin/categories', '/admin/blogs', '/admin/content']
};

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifCounts, setNotifCounts] = useState({ authorizedPayments: 0, lowStock: 0, newOrders: 0 });

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }
    getAdminSessionAction().then(res => {
      if (res.success) {
        setCurrentUser(res.user);
        // Fetch notifications
        getAdminNotificationsAction().then(nRes => {
          if (nRes.success) {
            setNotifications(nRes.notifications || []);
            setNotifCounts(nRes.counts || { authorizedPayments: 0, lowStock: 0, newOrders: 0 });
          }
        });
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

  const handleMarkNotifsRead = async () => {
    await markNotificationsReadAction();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  const navLinks = [
    { href: '/admin', label: 'Dashboard Overview', icon: 'fa-chart-pie' },
    { href: '/admin/orders', label: 'Order Fulfillment', icon: 'fa-shopping-bag' },
    { href: '/admin/products', label: 'Products & Inventory', icon: 'fa-boxes' },
    { href: '/admin/categories', label: 'Categories & Deities', icon: 'fa-folder-tree' },
    { href: '/admin/customers', label: 'Customer Management', icon: 'fa-users' },
    { href: '/admin/payment-recovery', label: 'Payment Recovery', icon: 'fa-shield-halved' },
    { href: '/admin/coupons', label: 'Discounts & Coupons', icon: 'fa-ticket' },
    { href: '/admin/content', label: 'Banners & Layout', icon: 'fa-sliders' },
    { href: '/admin/blogs', label: 'Blog & Articles', icon: 'fa-newspaper' },
    { href: '/admin/settings', label: 'Enterprise Settings', icon: 'fa-sliders-h' }
  ];

  if (pathname === '/admin/login') {
    return children;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0D0D0D', color: '#D4AF37' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', display: 'block', animation: 'pulse 1.5s infinite' }}>🪷</span>
          <p style={{ marginTop: '16px', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Loading Anant Arts Enterprise Console...
          </p>
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

  const safeNotifs = Array.isArray(notifications) ? notifications : [];
  const safeCounts = notifCounts || { authorizedPayments: 0, lowStock: 0, newOrders: 0 };
  const totalUnreadNotifs = (safeNotifs.filter(n => !n?.is_read).length) + (safeCounts.authorizedPayments || 0) + (safeCounts.lowStock || 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6F8', fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Luxury Enterprise Dark Sidebar */}
      <aside style={{
        width: '270px',
        background: 'linear-gradient(180deg, #0A0A0A 0%, #141414 100%)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(212, 175, 55, 0.25)',
        zIndex: 100,
        position: 'relative'
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.5))' }}>🪷</span>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: '#D4AF37', margin: 0, letterSpacing: '0.5px' }}>
              Anant Arts
            </h2>
            <span style={{ fontSize: '0.62rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: '700' }}>
              ENTERPRISE ADMIN
            </span>
          </div>
        </div>

        {/* View Store Button */}
        <div style={{ padding: '16px 20px 8px 20px' }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: '#D4AF37',
              fontSize: '0.8rem',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span><i className="fas fa-external-link-alt" style={{ marginRight: '8px' }}></i> View Live Website</span>
            <span style={{ fontSize: '0.65rem', background: '#2E7D32', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>ONLINE</span>
          </a>
        </div>

        {/* Navigation Section */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
          {navLinks.filter(link => allowedRoutes.includes(link.href)).map((link) => {
            const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#111111' : 'rgba(255,255,255,0.85)',
                  background: isActive ? 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)' : 'transparent',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 15px rgba(212, 175, 55, 0.4)' : 'none',
                  textDecoration: 'none'
                }}
              >
                <i className={`fas ${link.icon}`} style={{ width: '20px', fontSize: '1rem', color: isActive ? '#111111' : '#D4AF37' }}></i>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin User Info & Logout */}
        <div style={{ padding: '16px 16px 20px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem' }}>
                {currentUser?.email?.substring(0, 1).toUpperCase() || 'A'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#FFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '130px' }}>
                  {currentUser?.email?.split('@')[0]}
                </span>
                <span style={{ display: 'block', fontSize: '0.68rem', color: '#D4AF37', textTransform: 'uppercase', fontWeight: '600' }}>
                  {currentUser?.role || 'Admin'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              color: '#FF6B6B',
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.2)',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>{loggingOut ? 'Signing Out...' : 'Sign Out Admin'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        
        {/* Glassmorphism Top Header Bar */}
        <header style={{
          height: '70px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          {/* Breadcrumb / Title Context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Anant Arts Hub ➔ <strong style={{ color: '#111' }}>{pathname.replace('/admin', '').replace('/', '') || 'Dashboard'}</strong>
            </span>
          </div>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
            {/* Live Notification Bell Icon */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: '#333',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '8px'
                }}
                title="Notifications"
              >
                <i className="fas fa-bell"></i>
                {totalUnreadNotifs > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    background: '#C62828',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 6px rgba(198,40,40,0.5)'
                  }}>
                    {totalUnreadNotifs}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popover */}
              {notifOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '45px',
                  width: '360px',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  zIndex: 200,
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '16px', background: '#111', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontFamily: "'Playfair Display', serif", color: '#D4AF37' }}>
                      🔔 Operational Notifications
                    </h4>
                    <button onClick={handleMarkNotifsRead} style={{ background: 'none', border: 'none', color: '#AAA', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
                      Mark all read
                    </button>
                  </div>

                  {/* Summary Alert Badges */}
                  <div style={{ padding: '12px 16px', background: '#FAF9F6', borderBottom: '1px solid #EEE', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {notifCounts.authorizedPayments > 0 && (
                      <Link href="/admin/orders" onClick={() => setNotifOpen(false)} style={{ background: '#FFF3E0', border: '1px solid #FFE082', color: '#E65100', padding: '4px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', textDecoration: 'none' }}>
                        ⚠️ {notifCounts.authorizedPayments} Stuck Payments
                      </Link>
                    )}
                    {notifCounts.lowStock > 0 && (
                      <Link href="/admin/products" onClick={() => setNotifOpen(false)} style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', color: '#C62828', padding: '4px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', textDecoration: 'none' }}>
                        📦 {notifCounts.lowStock} Low Stock Alerts
                      </Link>
                    )}
                  </div>

                  {/* Log List */}
                  <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notifications.length === 0 ? (
                      <p style={{ fontStyle: 'italic', color: '#888', fontSize: '0.8rem', textAlign: 'center', margin: '20px 0' }}>No recent log alerts.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          background: n.is_read ? '#FAFAFA' : '#FFFDF5',
                          borderLeft: `3px solid ${n.type === 'warning' ? '#C62828' : '#D4AF37'}`
                        }}>
                          <p style={{ margin: 0, color: '#333', lineHeight: '1.4' }}>{n.message}</p>
                          <span style={{ fontSize: '0.65rem', color: '#999', marginTop: '4px', display: 'block' }}>
                            {new Date(n.created_at).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Links / Health Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', background: 'rgba(46, 125, 50, 0.1)', color: '#2E7D32', padding: '6px 12px', borderRadius: '20px', fontWeight: '700' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2E7D32', display: 'inline-block' }}></span>
              Razorpay API Active
            </div>

          </div>
        </header>

        {/* Page Content Render Area */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {isAuthorized ? children : (
            <div style={{ maxWidth: '450px', margin: '40px auto', background: 'white', padding: '40px 32px', borderRadius: '12px', border: '1px solid var(--danger)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', color: 'var(--danger)', marginBottom: '16px' }}>🔒</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem' }}>Access Restricted</h2>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>Your admin account role does not have permission to view this section.</p>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
