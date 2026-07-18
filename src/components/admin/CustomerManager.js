'use client';
import { useState } from 'react';
import { formatPrice } from '@/lib/utils';

export default function CustomerManager({ orders = [] }) {
  const [search, setSearch] = useState('');

  // Group orders by email to calculate client profiles
  const customersMap = {};
  orders.forEach(o => {
    const email = o.customer_email?.trim().toLowerCase();
    if (!email) return;

    if (!customersMap[email]) {
      customersMap[email] = {
        name: o.customer_name,
        email: o.customer_email,
        phone: o.customer_phone,
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: o.created_at
      };
    }

    customersMap[email].totalOrders += 1;
    customersMap[email].totalSpent += o.total_amount;
    if (new Date(o.created_at) > new Date(customersMap[email].lastOrderDate)) {
      customersMap[email].lastOrderDate = o.created_at;
    }
  });

  const customersList = Object.values(customersMap);

  const filteredCustomers = customersList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Customer Name', 'Email Address', 'Phone Number', 'Total Orders Placed', 'Total Revenue Spent (₹)', 'Last Order Date'];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.email,
      c.phone || '',
      c.totalOrders,
      c.totalSpent,
      new Date(c.lastOrderDate).toLocaleDateString('en-IN')
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `anant_arts_customers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: 0 }}>Customer Relations</h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Analyze client lists, total transactions, and search historical order contact data</span>
        </div>
        <button onClick={handleExportCSV} className="btn-outline-gold" style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
          <i className="fas fa-file-export" style={{ marginRight: '6px' }}></i> Export Customers CSV
        </button>
      </div>

      {/* Search Filter */}
      <div style={{ background: 'white', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search by client name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            maxWidth: '400px',
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid var(--primary-gold-border)',
            fontSize: '0.82rem'
          }}
        />
      </div>

      {/* Table grid */}
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--bg-cream-dark)', color: 'var(--text-muted)', backgroundColor: '#FAF9F6' }}>
              <th style={{ padding: '14px 12px' }}>Customer Name</th>
              <th style={{ padding: '14px 12px' }}>Email Address</th>
              <th style={{ padding: '14px 12px' }}>Phone Number</th>
              <th style={{ padding: '14px 12px', textAlign: 'center' }}>Total Orders</th>
              <th style={{ padding: '14px 12px', textAlign: 'right' }}>Total Spent</th>
              <th style={{ padding: '14px 12px', textAlign: 'right' }}>Last Transaction</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No customer records found.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((c, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                  <td style={{ padding: '14px 12px', fontWeight: '600', color: 'var(--text-dark)' }}>{c.name}</td>
                  <td style={{ padding: '14px 12px' }}>{c.email}</td>
                  <td style={{ padding: '14px 12px' }}>{c.phone || '-'}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'center', fontWeight: '600' }}>{c.totalOrders}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: '600', color: 'var(--primary-gold-hover)' }}>
                    {formatPrice(c.totalSpent)}
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                    {new Date(c.lastOrderDate).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
