import { createAdminClient } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  // 1. Parallel DB queries for enterprise stats
  const [
    { data: orders = [] },
    { data: products = [] },
    { data: users = [] },
    { data: notifications = [] },
    { data: orderItems = [] }
  ] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('*'),
    supabase.from('users').select('id, email, full_name, created_at'),
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(6),
    supabase.from('order_items').select('product_id, product_name, price, quantity, total_price')
  ]);

  // 2. Dashboard Statistics Calculations
  const totalOrders = orders.length;
  
  // Total Revenue: Paid/Captured orders + COD orders
  const paidOrders = orders.filter(o => o.payment_status === 'Captured' || o.payment_status === 'Paid' || o.payment_method === 'COD');
  const totalRevenue = paidOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Customers Count
  const totalCustomers = users.length;

  // Failed & Refunded payments count
  const failedPaymentsCount = orders.filter(o => o.payment_status === 'Failed' || o.payment_status === 'Refunded' || o.payment_status === 'Authorized').length;

  // Low Stock Items (< 5)
  const lowStockProducts = products.filter(p => p.stock_quantity < 5);

  // Best Sellers Calculation from order_items
  const productSalesMap = {};
  orderItems.forEach(item => {
    const key = item.product_name || `Product #${item.product_id}`;
    if (!productSalesMap[key]) {
      productSalesMap[key] = { name: key, unitsSold: 0, revenue: 0 };
    }
    productSalesMap[key].unitsSold += (item.quantity || 1);
    productSalesMap[key].revenue += (item.total_price || (item.price * item.quantity) || 0);
  });

  const bestSellers = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // 3. Monthly Sales Trends SVG Data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const salesByMonth = {};
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    salesByMonth[label] = 0;
  }

  orders.forEach(o => {
    if (o.payment_status === 'Captured' || o.payment_status === 'Paid' || o.payment_method === 'COD') {
      const d = new Date(o.created_at);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (salesByMonth[label] !== undefined) {
        salesByMonth[label] += (o.total_amount || 0);
      }
    }
  });

  const monthLabels = Object.keys(salesByMonth);
  const monthRevenue = Object.values(salesByMonth);
  const maxMonthlyRevenue = Math.max(...monthRevenue, 10000);

  const svgWidth = 550;
  const svgHeight = 220;
  const padding = 35;
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = svgHeight - padding * 2;

  const points = monthRevenue.map((val, idx) => {
    const x = padding + (idx / Math.max(monthRevenue.length - 1, 1)) * chartWidth;
    const y = padding + chartHeight - (val / maxMonthlyRevenue) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.85rem', color: '#111', margin: 0 }}>
            Enterprise Dashboard &amp; Operations
          </h1>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>
            Real-time sales performance, inventory alerts, and customer analytics
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/admin/orders" className="btn-gold" style={{ padding: '10px 20px', fontSize: '0.85rem', textDecoration: 'none', borderRadius: '6px' }}>
            <i className="fas fa-shopping-cart" style={{ marginRight: '8px' }}></i> Manage Orders
          </Link>
          <Link href="/admin/products" className="btn-outline-gold" style={{ padding: '10px 20px', fontSize: '0.85rem', textDecoration: 'none', borderRadius: '6px' }}>
            <i className="fas fa-plus" style={{ marginRight: '8px' }}></i> Add Product
          </Link>
        </div>
      </div>

      {/* 5 Enterprise Metric Glass Cards (Requirement 2) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1: Revenue */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF8F2 100%)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', fontWeight: '700' }}>Gross Revenue</span>
            <span style={{ fontSize: '1.4rem' }}>💰</span>
          </div>
          <strong style={{ fontSize: '1.6rem', display: 'block', color: '#111', fontFamily: "'Playfair Display', serif" }}>{formatPrice(totalRevenue)}</strong>
          <span style={{ fontSize: '0.75rem', color: '#2E7D32', fontWeight: '600', display: 'block', marginTop: '6px' }}>
            Avg Order: {formatPrice(averageOrderValue)}
          </span>
        </div>

        {/* Card 2: Total Orders */}
        <div style={{
          background: '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', fontWeight: '700' }}>Total Orders</span>
            <span style={{ fontSize: '1.4rem' }}>🛒</span>
          </div>
          <strong style={{ fontSize: '1.6rem', display: 'block', color: '#111' }}>{totalOrders}</strong>
          <span style={{ fontSize: '0.75rem', color: '#1976D2', fontWeight: '600', display: 'block', marginTop: '6px' }}>
            {paidOrders.length} Paid / Captured
          </span>
        </div>

        {/* Card 3: Total Customers */}
        <div style={{
          background: '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', fontWeight: '700' }}>Registered Customers</span>
            <span style={{ fontSize: '1.4rem' }}>👥</span>
          </div>
          <strong style={{ fontSize: '1.6rem', display: 'block', color: '#111' }}>{totalCustomers}</strong>
          <span style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: '600', display: 'block', marginTop: '6px' }}>
            Persistent session users
          </span>
        </div>

        {/* Card 4: Failed / Authorized Payments */}
        <div style={{
          background: failedPaymentsCount > 0 ? '#FFF8F6' : '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          border: failedPaymentsCount > 0 ? '1px solid #FFCDD2' : '1px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: failedPaymentsCount > 0 ? '#C62828' : '#888', fontWeight: '700' }}>Payment Issues</span>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
          </div>
          <strong style={{ fontSize: '1.6rem', display: 'block', color: failedPaymentsCount > 0 ? '#C62828' : '#111' }}>{failedPaymentsCount}</strong>
          <span style={{ fontSize: '0.75rem', color: '#C62828', fontWeight: '600', display: 'block', marginTop: '6px' }}>
            {failedPaymentsCount > 0 ? 'Requires Capture / Recovery' : 'No payment issues'}
          </span>
        </div>

        {/* Card 5: Inventory Low Stock Alerts */}
        <div style={{
          background: lowStockProducts.length > 0 ? '#FFFDE7' : '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          border: lowStockProducts.length > 0 ? '1px solid #FFE082' : '1px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: lowStockProducts.length > 0 ? '#E65100' : '#888', fontWeight: '700' }}>Low Stock Alerts</span>
            <span style={{ fontSize: '1.4rem' }}>📦</span>
          </div>
          <strong style={{ fontSize: '1.6rem', display: 'block', color: lowStockProducts.length > 0 ? '#E65100' : '#111' }}>{lowStockProducts.length}</strong>
          <span style={{ fontSize: '0.75rem', color: '#E65100', fontWeight: '600', display: 'block', marginTop: '6px' }}>
            {lowStockProducts.length > 0 ? 'Stock quantity < 5 units' : 'Inventory healthy'}
          </span>
        </div>
      </div>

      {/* Analytics Row: Sales Graph & Best Sellers Ranking (Requirement 4) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Monthly Revenue Chart */}
        <div style={{
          background: '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', margin: 0, color: '#111' }}>Revenue Trends</h3>
              <span style={{ fontSize: '0.75rem', color: '#777' }}>Last 6 months growth graph</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: '700' }}>24K Gold Revenue Analytics</span>
          </div>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', minWidth: '400px' }}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#F0E6D2" />
              <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#F0E6D2" />
              <line x1={padding} y1={padding + chartHeight * 0.5} x2={svgWidth - padding} y2={padding + chartHeight * 0.5} stroke="#FAF5EB" strokeDasharray="4,4" />

              {/* Area Fill */}
              <polygon
                fill="url(#goldGradient)"
                points={`${padding},${svgHeight - padding} ${points} ${svgWidth - padding},${svgHeight - padding}`}
              />

              {/* Polyline */}
              <polyline
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3"
                points={points}
              />

              {/* Data Dots & Value Labels */}
              {monthRevenue.map((val, idx) => {
                const x = padding + (idx / Math.max(monthRevenue.length - 1, 1)) * chartWidth;
                const y = padding + chartHeight - (val / maxMonthlyRevenue) * chartHeight;
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="5" fill="#111" stroke="#D4AF37" strokeWidth="2" />
                    <text x={x} y={y - 12} fontSize="9" textAnchor="middle" fontWeight="700" fill="#111">
                      ₹{Math.round(val / 1000)}k
                    </text>
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {monthLabels.map((lbl, idx) => {
                const x = padding + (idx / Math.max(monthLabels.length - 1, 1)) * chartWidth;
                return (
                  <text key={idx} x={x} y={svgHeight - 8} fontSize="9" textAnchor="middle" fill="#777" fontWeight="500">
                    {lbl}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Best Sellers Ranking */}
        <div style={{
          background: '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', margin: '0 0 16px 0', color: '#111' }}>
            🏆 Top Best Sellers
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {bestSellers.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: '#888', fontSize: '0.85rem' }}>No product sales recorded yet.</p>
            ) : (
              bestSellers.map((item, idx) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: '#FAF8F5', border: '1px solid #EAE3D2', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <span style={{ fontWeight: '800', color: '#D4AF37', width: '18px' }}>#{idx + 1}</span>
                    <div style={{ overflow: 'hidden' }}>
                      <strong style={{ display: 'block', color: '#111', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '140px' }}>{item.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#777' }}>{item.unitsSold} units sold</span>
                    </div>
                  </div>
                  <strong style={{ color: '#2E7D32', fontSize: '0.85rem' }}>{formatPrice(item.revenue)}</strong>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Recent Orders Table & Log Notifications Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Recent Orders */}
        <div style={{
          background: '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', margin: 0 }}>Recent Orders</h3>
            <Link href="/admin/orders" style={{ fontSize: '0.82rem', color: '#D4AF37', fontWeight: '700', textDecoration: 'none' }}>
              View All Orders ➔
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F0F0F0', color: '#888' }}>
                  <th style={{ padding: '10px' }}>Order Number</th>
                  <th style={{ padding: '10px' }}>Customer</th>
                  <th style={{ padding: '10px' }}>Amount</th>
                  <th style={{ padding: '10px' }}>Payment</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                    <td style={{ padding: '10px', fontWeight: '700', color: '#111' }}>{o.order_number}</td>
                    <td style={{ padding: '10px', color: '#555' }}>{o.customer_name}</td>
                    <td style={{ padding: '10px', fontWeight: '700' }}>{formatPrice(o.total_amount)}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        background: o.payment_status === 'Captured' || o.payment_status === 'Paid' ? '#E8F5E9' : '#FFF3E0',
                        color: o.payment_status === 'Captured' || o.payment_status === 'Paid' ? '#2E7D32' : '#E65100'
                      }}>
                        {o.payment_status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        background: 'rgba(212, 175, 55, 0.15)',
                        color: '#B59021'
                      }}>
                        {o.order_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Activity & Notifications Log */}
        <div style={{
          background: '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', margin: '0 0 16px 0', color: '#111' }}>
            📜 System Activity Log
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
            {notifications.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: '#888', fontSize: '0.8rem' }}>No system logs recorded.</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ padding: '10px', borderRadius: '6px', background: '#FAF8F5', borderLeft: '3px solid #D4AF37', fontSize: '0.78rem' }}>
                  <p style={{ margin: 0, color: '#333', lineHeight: '1.4' }}>{n.message}</p>
                  <span style={{ fontSize: '0.65rem', color: '#888', marginTop: '4px', display: 'block' }}>
                    {new Date(n.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
