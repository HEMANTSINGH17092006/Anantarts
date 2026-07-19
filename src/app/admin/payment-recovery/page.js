'use client';
import { useEffect, useState } from 'react';

export default function SystemHealthDashboard() {
  const [audits, setAudits] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [locks, setLocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/system-health');
      if (res.ok) {
        const data = await res.json();
        setAudits(data.audits || []);
        setJobs(data.jobs || []);
        setLocks(data.locks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runRecovery = async () => {
    if (!confirm('Run recovery cron job now?')) return;
    try {
      const res = await fetch('/api/cron/payment-recovery');
      const data = await res.json();
      alert(`Recovery complete. Recovered: ${data.recoveredCount}. Failed: ${data.failedCount}.`);
      fetchData();
    } catch (e) {
      alert('Error running recovery: ' + e.message);
    }
  };

  const runJobs = async () => {
    if (!confirm('Process background jobs now?')) return;
    try {
      const res = await fetch('/api/cron/process-jobs');
      const data = await res.json();
      alert(`Jobs processed: ${data.processed}.`);
      fetchData();
    } catch (e) {
      alert('Error processing jobs: ' + e.message);
    }
  };

  const runReconciliation = async () => {
    if (!confirm('Run daily Razorpay reconciliation now?')) return;
    try {
      const res = await fetch('/api/cron/daily-reconciliation');
      const data = await res.json();
      if(data.success) {
        alert(`Reconciliation complete. Anomalies found: ${data.anomalies}.`);
      } else {
        alert(`Reconciliation failed: ${data.message || data.error}`);
      }
      fetchData();
    } catch (e) {
      alert('Error running reconciliation: ' + e.message);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading System Health...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)' }}>System Health & Reconciliation Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={runReconciliation} style={{ background: '#1976D2', color: 'white', padding: '10px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Run Daily Reconciliation
          </button>
          <button onClick={runRecovery} style={{ background: '#E65100', color: 'white', padding: '10px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Trigger Recovery Scan
          </button>
          <button onClick={runJobs} style={{ background: '#2E7D32', color: 'white', padding: '10px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Process Job Queue
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
        
        {/* Active Inventory Locks */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--primary-gold-border)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Active Inventory Locks</h2>
          {locks.length === 0 ? <p>No active locks. Stock is free.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Order Ref</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Prod ID</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {locks.map(l => (
                    <tr key={l.id}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{l.order_number}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{l.product_id}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{l.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Audit Table */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--primary-gold-border)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Payment Audit Logs (Recovery)</h2>
          {audits.length === 0 ? <p>No audit logs found.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Order</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Recovered</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map(a => (
                    <tr key={a.id}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{a.order_id || a.payment_id}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                        {a.recovered === 1 ? <span style={{ color: 'green', fontWeight: 'bold' }}>Yes</span> : <span style={{ color: 'red', fontWeight: 'bold' }}>No</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Background Jobs Table */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--primary-gold-border)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Background Job Queue</h2>
          {jobs.length === 0 ? <p>No background jobs found.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Type</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Tries</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(j => (
                    <tr key={j.id}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{j.type}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                        <span style={{ color: j.status === 'completed' ? 'green' : (j.status === 'failed' ? 'red' : 'orange'), fontWeight: 'bold' }}>{j.status}</span>
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{j.attempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
