'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettings, createAdminAction, toggleAdminStatusAction, deleteAdminAction } from '@/app/actions';

export default function SettingsManager({ settings, logs = [], currentUser, admins = [] }) {
  const router = useRouter();
  const [isTransitionPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('WhatsApp');

  // WhatsApp States
  const [wpEnabled, setWpEnabled] = useState(settings.whatsapp_notifications_enabled === '1');
  const [wpNumber, setWpNumber] = useState(settings.whatsapp_admin_number || '');
  const [wpTemplate, setWpTemplate] = useState(settings.whatsapp_message_template || '');
  
  // Admin Management States
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('manager');
  const [adminCreating, setAdminCreating] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  const handleSaveWhatsApp = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = [
      { key: 'whatsapp_notifications_enabled', value: wpEnabled ? '1' : '0' },
      { key: 'whatsapp_admin_number', value: wpNumber },
      { key: 'whatsapp_message_template', value: wpTemplate }
    ];

    const res = await updateSettings(payload);
    setLoading(false);

    if (res.success) {
      showAlert('success', 'WhatsApp settings updated successfully.');
      startTransition(() => { router.refresh(); });
    } else {
      showAlert('danger', res.message || 'Failed to update settings.');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminPassword || !newAdminRole) return;
    setAdminCreating(true);
    
    const res = await createAdminAction(newAdminEmail, newAdminPassword, newAdminRole);
    setAdminCreating(false);

    if (res.success) {
      showAlert('success', 'New administrator account created successfully.');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminRole('manager');
      setAdminModalOpen(false);
      startTransition(() => { router.refresh(); });
    } else {
      showAlert('danger', res.message || 'Failed to create administrator account.');
    }
  };

  const handleToggleStatus = async (adminId, currentStatus) => {
    const res = await toggleAdminStatusAction(adminId, !currentStatus);
    if (res.success) {
      showAlert('success', 'Administrator status updated.');
      startTransition(() => { router.refresh(); });
    } else {
      showAlert('danger', res.message || 'Failed to update administrator status.');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!confirm('Are you sure you want to delete this administrator account? This action cannot be undone.')) return;
    const res = await deleteAdminAction(adminId);
    if (res.success) {
      showAlert('success', 'Administrator account deleted.');
      startTransition(() => { router.refresh(); });
    } else {
      showAlert('danger', res.message || 'Failed to delete administrator account.');
    }
  };

  const tabStyle = (tab) => ({
    padding: '10px 20px',
    border: activeTab === tab ? '1px solid var(--primary-gold-border)' : '1px solid transparent',
    background: activeTab === tab ? 'white' : 'transparent',
    borderTopLeftRadius: '6px',
    borderTopRightRadius: '6px',
    borderBottom: activeTab === tab ? '1px solid white' : 'none',
    fontSize: '0.82rem',
    fontWeight: activeTab === tab ? '600' : '400',
    cursor: 'pointer',
    color: activeTab === tab ? 'var(--text-dark)' : 'var(--text-muted)'
  });

  return (
    <div>
      {/* Alert Banner */}
      {alert.message && (
        <div style={{
          padding: '12px 20px',
          borderRadius: '4px',
          background: alert.type === 'success' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(198, 40, 40, 0.1)',
          border: `1px solid ${alert.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: alert.type === 'success' ? 'var(--success)' : 'var(--danger)',
          marginBottom: '20px',
          fontSize: '0.85rem'
        }}>
          {alert.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: 0 }}>System Settings</h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Configure external integrations and global store preferences.</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--primary-gold-border)', paddingBottom: '1px', marginBottom: '24px' }}>
        <button onClick={() => setActiveTab('WhatsApp')} style={tabStyle('WhatsApp')}>
          WhatsApp API
        </button>
        <button onClick={() => setActiveTab('Logs')} style={tabStyle('Logs')}>
          Notification Logs
        </button>
        {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
          <button onClick={() => setActiveTab('Admins')} style={tabStyle('Admins')}>
            Manage Admins
          </button>
        )}
      </div>

      {/* ============ WHATSAPP TAB ============ */}
      {activeTab === 'WhatsApp' && (
        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', padding: '24px', maxWidth: '800px' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>WhatsApp Order Notifications</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Automatically send a WhatsApp message to the admin when a new order is placed (COD or prepaid).
          </p>

          <form onSubmit={handleSaveWhatsApp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-cream)', padding: '16px', borderRadius: '6px', border: '1px solid var(--primary-gold-border)' }}>
              <input 
                type="checkbox" 
                id="wp-enable" 
                checked={wpEnabled} 
                onChange={(e) => setWpEnabled(e.target.checked)} 
                style={{ accentColor: 'var(--primary-gold)', width: '18px', height: '18px' }} 
              />
              <label htmlFor="wp-enable" style={{ fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                Enable Automatic WhatsApp Notifications
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>
                Admin WhatsApp Number * (Include country code, no + symbol)
              </label>
              <input 
                type="text" 
                required 
                value={wpNumber} 
                onChange={(e) => setWpNumber(e.target.value)} 
                placeholder="e.g. 919876543210" 
                style={{ width: '100%', maxWidth: '300px', padding: '10px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} 
              />
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Must be a valid WhatsApp registered number. E.g. for India, start with 91.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>
                Notification Message Template *
              </label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Available variables: {'{{order_id}}, {{customer_name}}, {{customer_phone}}, {{customer_email}}, {{product_list}}, {{order_total}}, {{payment_method}}, {{payment_status}}, {{full_address}}, {{order_date}}, {{admin_order_link}}'}
              </p>
              <textarea 
                required 
                value={wpTemplate} 
                onChange={(e) => setWpTemplate(e.target.value)} 
                rows={15}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem' }} 
              />
            </div>

            <div style={{ borderTop: '1px solid var(--bg-cream-dark)', paddingTop: '20px' }}>
              <button type="submit" className="btn-gold" style={{ padding: '10px 24px' }} disabled={loading}>
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============ LOGS TAB ============ */}
      {activeTab === 'Logs' && (
        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bg-cream-dark)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>Timestamp</th>
                <th style={{ padding: '12px' }}>Order ID</th>
                <th style={{ padding: '12px' }}>Phone Number</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Message Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No WhatsApp notifications have been logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(l.created_at).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{l.order_number}</td>
                    <td style={{ padding: '12px' }}>+{l.phone_number}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: '600',
                        backgroundColor: l.status === 'Sent' ? 'rgba(46,125,50,0.1)' : l.status === 'Retrying' ? 'rgba(255,152,0,0.1)' : 'rgba(198,40,40,0.1)',
                        color: l.status === 'Sent' ? 'var(--success)' : l.status === 'Retrying' ? '#E65100' : 'var(--danger)'
                      }}>
                        {l.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ============ ADMINS TAB ============ */}
      {activeTab === 'Admins' && (currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>System Administrators ({admins.length})</h2>
            {currentUser?.role === 'super_admin' && (
              <button onClick={() => setAdminModalOpen(true)} className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                + Add Administrator
              </button>
            )}
          </div>

          {/* Admins Table */}
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--bg-cream-dark)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Email Address</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Created At</th>
                  {currentUser?.role === 'super_admin' && <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {admins.map((adm) => {
                  const isSelf = adm.email === currentUser?.email;
                  return (
                    <tr key={adm.id} style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>
                        {adm.email} {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--primary-gold-hover)', fontStyle: 'italic' }}>(You)</span>}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.68rem',
                          fontWeight: '600',
                          backgroundColor: adm.role === 'super_admin' ? 'rgba(212,175,55,0.1)' : adm.role === 'manager' ? 'rgba(76,175,80,0.1)' : 'rgba(33,150,243,0.1)',
                          color: adm.role === 'super_admin' ? 'var(--primary-gold-hover)' : adm.role === 'manager' ? '#2e7d32' : '#1565c0',
                          textTransform: 'uppercase'
                        }}>
                          {adm.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {currentUser?.role === 'super_admin' && !isSelf ? (
                          <button
                            onClick={() => handleToggleStatus(adm.id, adm.is_active)}
                            style={{
                              background: 'transparent',
                              border: '1px solid',
                              borderColor: adm.is_active ? 'var(--success)' : 'var(--text-muted)',
                              color: adm.is_active ? 'var(--success)' : 'var(--text-muted)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            {adm.is_active ? 'Active' : 'Inactive'}
                          </button>
                        ) : (
                          <span style={{ color: adm.is_active ? 'var(--success)' : 'var(--text-muted)', fontWeight: '600' }}>
                            {adm.is_active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                        {new Date(adm.created_at).toLocaleDateString('en-IN')}
                      </td>
                      {currentUser?.role === 'super_admin' && (
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteAdmin(adm.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                              }}
                              title="Delete Administrator"
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Admin Modal */}
          {adminModalOpen && (
            <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
              <div className="admin-modal-content" style={{ maxWidth: '400px', width: '90%', padding: '24px' }}>
                <span className="modal-close-btn" onClick={() => setAdminModalOpen(false)}>&times;</span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '16px' }}>Add New Administrator</h3>
                <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Email Address *</label>
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Password *</label>
                    <input
                      type="password"
                      required
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Role *</label>
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', background: 'white' }}
                    >
                      <option value="manager">Manager (Products & Orders)</option>
                      <option value="content_editor">Content Editor (Products & Blogs)</option>
                      <option value="super_admin">Super Admin (Full Access)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="button" onClick={() => setAdminModalOpen(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--text-muted)' }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }} disabled={adminCreating}>
                      {adminCreating ? 'Creating...' : 'Create Admin'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
