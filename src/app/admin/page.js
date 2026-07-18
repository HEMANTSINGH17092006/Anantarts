import { createAdminClient } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; // Do not cache admin dashboards

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  // 1. Fetch Orders, Products, and Notifications
  const { data: orders = [] } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  const { data: products = [] } = await supabase.from('products').select('*');
  const { data: notifications = [] } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(6);
  const { data: categories = [] } = await supabase.from('categories').select('id');
  const { data: coupons = [] } = await supabase.from('coupons').select('id');

  // 2. Calculations
  const totalOrders = orders.length;
  
  // Calculate total revenue from paid or pending COD orders
  const totalRevenue = orders
    .filter(o => o.payment_status === 'Paid' || o.payment_method === 'COD')
    .reduce((acc, o) => acc + o.total_amount, 0);

  // Identify low stock products (less than 5 items left)
  const lowStockProducts = products.filter(p => p.stock_quantity < 5);

  // 3. SVG sales graph math: group sales by month
  // Create last 6 months sales buckets
  const salesByMonth = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Pre-populate last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    salesByMonth[label] = 0;
  }

  // Populate actual sales
  orders.forEach(o => {
    if (o.payment_status === 'Paid' || o.payment_method === 'COD') {
      const d = new Date(o.created_at);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (salesByMonth[label] !== undefined) {
        salesByMonth[label] += o.total_amount;
      }
    }
  });

  const monthLabels = Object.keys(salesByMonth);
  const monthRevenue = Object.values(salesByMonth);
  const maxMonthlyRevenue = Math.max(...monthRevenue, 10000);

  // Generate SVG Points for Line Chart
  const svgWidth = 500;
  const svgHeight = 200;
  const padding = 30;
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = svgHeight - padding * 2;

  const points = monthRevenue.map((val, idx) => {
    const x = padding + (idx / (monthRevenue.length - 1)) * chartWidth;
    const y = padding + chartHeight - (val / maxMonthlyRevenue) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: 0 }}>Business Analytics</h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time shop metrics and inventory overview</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {/* Metric 1: Revenue */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Total Revenue</span>
            <span style={{ fontSize: '1.5rem' }}>💰</span>
          </div>
          <strong style={{ fontSize: '1.5rem', display: 'block', color: 'var(--text-dark)' }}>{formatPrice(totalRevenue)}</strong>
          <span style={{ fontSize: '0.72rem', color: 'var(--success)' }}>Active shop earnings</span>
        </div>

        {/* Metric 2: Orders */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Total Orders</span>
            <span style={{ fontSize: '1.5rem' }}>🛒</span>
          </div>
          <strong style={{ fontSize: '1.5rem', display: 'block', color: 'var(--text-dark)' }}>{totalOrders}</strong>
          <span style={{ fontSize: '0.72rem', color: 'var(--info)' }}>Registered orders list</span>
        </div>

        {/* Metric 3: Products */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Products Listed</span>
            <span style={{ fontSize: '1.5rem' }}>📦</span>
          </div>
          <strong style={{ fontSize: '1.5rem', display: 'block', color: 'var(--text-dark)' }}>{products.length}</strong>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Categories: {categories.length} / Coupons: {coupons.length}</span>
        </div>

        {/* Metric 4: Stock Alerts */}
        <div style={{ 
          background: lowStockProducts.length > 0 ? 'rgba(198, 40, 40, 0.05)' : 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          border: lowStockProducts.length > 0 ? '1px solid var(--danger)' : '1px solid var(--primary-gold-border)', 
          boxShadow: 'var(--shadow-sm)' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', color: lowStockProducts.length > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>Inventory Alerts</span>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          </div>
          <strong style={{ fontSize: '1.5rem', display: 'block', color: lowStockProducts.length > 0 ? 'var(--danger)' : 'var(--text-dark)' }}>
            {lowStockProducts.length}
          </strong>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {lowStockProducts.length > 0 ? 'Low stock items require upload' : 'All stock levels healthy'}
          </span>
        </div>
      </div>

      {/* Graphs & Alerts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        
        {/* Sales Graph */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '20px' }}>Monthly Sales Trends</h3>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', minWidth: '400px' }}>
              {/* Grids */}
              <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#F5ECD7" />
              <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#F5ECD7" />
              
              <line x1={padding} y1={padding + chartHeight * 0.5} x2={svgWidth - padding} y2={padding + chartHeight * 0.5} stroke="#FFF8F0" strokeDasharray="4,4" />
              
              {/* Sales line path */}
              <polyline
                fill="none"
                stroke="var(--primary-gold)"
                strokeWidth="3"
                points={points}
              />
              
              {/* Plot dots */}
              {monthRevenue.map((val, idx) => {
                const x = padding + (idx / (monthRevenue.length - 1)) * chartWidth;
                const y = padding + chartHeight - (val / maxMonthlyRevenue) * chartHeight;
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="5" fill="var(--text-dark)" stroke="var(--primary-gold)" strokeWidth="2" />
                    <text x={x} y={y - 10} fontSize="8" textAnchor="middle" fontWeight="700" fill="var(--text-dark)">
                      ₹{Math.round(val / 1000)}k
                    </text>
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {monthLabels.map((lbl, idx) => {
                const x = padding + (idx / (monthLabels.length - 1)) * chartWidth;
                return (
                  <text key={idx} x={x} y={svgHeight - 10} fontSize="8" textAnchor="middle" fill="var(--text-muted)">
                    {lbl}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', margin: 0 }}>Log & Notifications</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto', maxHeight: '180px' }}>
            {notifications.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No new log messages.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  borderLeft: `3px solid ${n.type === 'warning' ? 'var(--danger)' : n.type === 'success' ? 'var(--success)' : 'var(--primary-gold)'}`,
                  background: 'var(--bg-cream)'
                }}>
                  <p style={{ margin: 0, lineHeight: '1.4' }}>{n.message}</p>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    {new Date(n.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Recent Orders Table */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', margin: 0 }}>Recent Orders</h3>
          <Link href="/admin/orders" style={{ fontSize: '0.8rem', color: 'var(--primary-gold-hover)', fontWeight: '600' }}>
            View All Orders
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bg-cream-dark)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>Order Number</th>
                <th style={{ padding: '12px' }}>Customer Name</th>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Amount</th>
                <th style={{ padding: '12px' }}>Payment Status</th>
                <th style={{ padding: '12px' }}>Order Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{o.order_number}</td>
                  <td style={{ padding: '12px' }}>{o.customer_name}</td>
                  <td style={{ padding: '12px' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{formatPrice(o.total_amount)}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      backgroundColor: o.payment_status === 'Paid' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(239, 108, 0, 0.1)',
                      color: o.payment_status === 'Paid' ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      backgroundColor: o.order_status === 'Delivered' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(21, 101, 192, 0.1)',
                      color: o.order_status === 'Delivered' ? 'var(--success)' : 'var(--info)'
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
    </div>
  );
}
