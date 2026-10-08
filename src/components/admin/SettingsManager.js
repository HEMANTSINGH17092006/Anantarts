'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettings, createAdminAction, toggleAdminStatusAction, deleteAdminAction, exportFullBackupAction, uploadUpiQrAction } from '@/app/actions';

export default function SettingsManager({ settings = {}, logs = [], currentUser, admins = [] }) {
  const router = useRouter();
  const [isTransitionPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('Payment');

  // 1. Payment Settings State
  const [razorpayKeyId, setRazorpayKeyId] = useState(settings.razorpay_key_id || '');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState(settings.razorpay_key_secret || '');
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState(settings.razorpay_webhook_secret || '');
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(settings.razorpay_auto_capture !== '0');

  // 1b. Direct UPI QR Settings State
  const [upiQrEnabled, setUpiQrEnabled] = useState(settings.upi_qr_enabled !== '0');
  const [upiId, setUpiId] = useState(settings.upi_id || '');
  const [upiDisplayName, setUpiDisplayName] = useState(settings.upi_display_name || 'Anant Arts');
  const [upiQrImageUrl, setUpiQrImageUrl] = useState(settings.upi_qr_image_url || '');
  const [uploadingQr, setUploadingQr] = useState(false);

  // 2. Shipping Settings State
  const [freeShippingMin, setFreeShippingMin] = useState(settings.free_shipping_threshold || '5000');
  const [flatShippingFee, setFlatShippingFee] = useState(settings.flat_shipping_fee || '150');
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState(settings.estimated_delivery_days || '3-7 Business Days');

  // 3. SEO Settings State
  const [seoTitle, setSeoTitle] = useState(settings.seo_title || 'Anant Arts | Premium Divine Electroplated Idols');
  const [seoDescription, setSeoDescription] = useState(settings.seo_description || 'Handcrafted 24K gold and silver electroplated divine idols for home mandir and corporate gifting.');
  const [seoKeywords, setSeoKeywords] = useState(settings.seo_keywords || 'divine idols, brass idols, gold plated ganesh, lakshmi idol, anant arts');
  const [ogImageUrl, setOgImageUrl] = useState(settings.og_image_url || '/logo.png');

  // 4. Email & SMTP State
  const [smtpHost, setSmtpHost] = useState(settings.smtp_host || '');
  const [smtpPort, setSmtpPort] = useState(settings.smtp_port || '587');
  const [smtpUser, setSmtpUser] = useState(settings.smtp_user || '');
  const [smtpFrom, setSmtpFrom] = useState(settings.smtp_from || 'orders@anantarts.in');
  const [emailHeaderMsg, setEmailHeaderMsg] = useState(settings.email_header_msg || 'Thank you for choosing Anant Arts for your divine idol purchase.');

  // 5. Tax & GST State
  const [gstRate, setGstRate] = useState(settings.gst_rate || '18');
  const [hsnCode, setHsnCode] = useState(settings.hsn_code || '83062990');
  const [taxInclusive, setTaxInclusive] = useState(settings.tax_inclusive !== '0');

  // 6. WhatsApp & Admin State
  const [wpEnabled, setWpEnabled] = useState(settings.whatsapp_notifications_enabled === '1');
  const [wpNumber, setWpNumber] = useState(settings.whatsapp_admin_number || '');
  const [wpTemplate, setWpTemplate] = useState(settings.whatsapp_message_template || '');

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('manager');
  const [adminCreating, setAdminCreating] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  const handleSaveSettings = async (payload) => {
    setSaving(true);
    const res = await updateSettings(payload);
    setSaving(false);

    if (res.success) {
      showAlert('success', 'Settings updated and applied live across store successfully.');
      startTransition(() => { router.refresh(); });
    } else {
      showAlert('danger', res.message || 'Failed to update settings.');
    }
  };

  const handleUploadQr = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image MIME type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes((file.type || '').toLowerCase())) {
      showAlert('danger', 'Invalid file type. Only PNG, JPG, and WEBP image files are supported.');
      e.target.value = '';
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert('danger', 'Image size exceeds 5MB limit. Please upload a smaller image.');
      e.target.value = '';
      return;
    }

    setUploadingQr(true);
    const fd = new FormData();
    fd.append('qr_image', file);
    const res = await uploadUpiQrAction(fd);
    setUploadingQr(false);
    if (res.success && res.url) {
      setUpiQrImageUrl(res.url);
      showAlert('success', 'UPI QR uploaded successfully.');
      startTransition(() => { router.refresh(); });
    } else {
      showAlert('danger', res.message || 'Failed to upload QR image.');
    }
    e.target.value = '';
  };

  const handleExportBackup = async () => {
    setExporting(true);
    const res = await exportFullBackupAction();
    setExporting(false);

    if (res.success && res.backup) {
      const blob = new Blob([JSON.stringify(res.backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anant_arts_store_backup_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showAlert('success', 'Store database backup downloaded successfully.');
    } else {
      showAlert('danger', res.message || 'Failed to generate store backup.');
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

  const tabs = [
    { id: 'Payment', label: '💳 Payment Gateway', icon: 'fa-credit-card' },
    { id: 'Shipping', label: '🚚 Shipping & Delivery', icon: 'fa-truck' },
    { id: 'SEO', label: '🔍 SEO & Meta', icon: 'fa-magnifying-glass' },
    { id: 'Email', label: '✉️ Email & SMTP', icon: 'fa-envelope' },
    { id: 'Taxation', label: '🏷️ GST & Tax Rate', icon: 'fa-receipt' },
    { id: 'Backup', label: '💾 Backup & Health', icon: 'fa-database' },
    { id: 'Team', label: '👥 Team & WhatsApp', icon: 'fa-users-cog' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', margin: 0, color: '#111' }}>
          Enterprise Store Settings
        </h1>
        <span style={{ fontSize: '0.85rem', color: '#666' }}>
          Configure payment gateways, shipping thresholds, tax rates, email templates, and database backups
        </span>
      </div>

      {/* Alert Banner */}
      {alert.message && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '8px',
          background: alert.type === 'success' ? '#E8F5E9' : '#FFEBEE',
          border: `1px solid ${alert.type === 'success' ? '#2E7D32' : '#C62828'}`,
          color: alert.type === 'success' ? '#2E7D32' : '#C62828',
          fontSize: '0.88rem',
          fontWeight: '600'
        }}>
          {alert.message}
        </div>
      )}

      {/* Tabs Header */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #EAEAEA', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #D4AF37' : '3px solid transparent',
              color: activeTab === tab.id ? '#111' : '#666',
              fontWeight: activeTab === tab.id ? '700' : '500',
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PAYMENT SETTINGS */}
      {activeTab === 'Payment' && (
        <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', marginBottom: '20px', color: '#111' }}>
            💳 Razorpay Payment Gateway Configuration
          </h3>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveSettings([
              { key: 'razorpay_key_id', value: razorpayKeyId },
              { key: 'razorpay_key_secret', value: razorpayKeySecret },
              { key: 'razorpay_webhook_secret', value: razorpayWebhookSecret },
              { key: 'razorpay_auto_capture', value: autoCaptureEnabled ? '1' : '0' }
            ]);
          }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '650px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Razorpay Key ID</label>
              <input type="text" value={razorpayKeyId} onChange={(e) => setRazorpayKeyId(e.target.value)} placeholder="rzp_live_xxxxxxxxxxxx" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Razorpay Key Secret</label>
              <input type="password" value={razorpayKeySecret} onChange={(e) => setRazorpayKeySecret(e.target.value)} placeholder="••••••••••••••••••••" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Razorpay Webhook Secret</label>
              <input type="password" value={razorpayWebhookSecret} onChange={(e) => setRazorpayWebhookSecret(e.target.value)} placeholder="whsec_xxxxxxxxxxxx" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FAF8F5', padding: '14px', borderRadius: '8px', border: '1px solid #EAE3D2' }}>
              <input type="checkbox" id="autoCap" checked={autoCaptureEnabled} onChange={(e) => setAutoCaptureEnabled(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#D4AF37' }} />
              <label htmlFor="autoCap" style={{ fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', color: '#111' }}>
                Enable Automatic Payment Capture (Captures authorized funds instantly without manual review)
              </label>
            </div>

            <button type="submit" className="btn-gold" style={{ padding: '12px 24px', width: 'fit-content', borderRadius: '6px', fontWeight: '700' }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Razorpay Settings'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ borderTop: '2px dashed #EAE3D2', margin: '36px 0 28px 0' }}></div>

          {/* DIRECT UPI QR CONFIGURATION */}
          <div id="upi-qr">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', margin: 0, color: '#111' }}>
                  📱 Direct UPI QR Payment Configuration
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#666', margin: '4px 0 0 0' }}>
                  Allow customers to pay directly to your bank account via UPI QR and enter their Transaction UTR for manual review.
                </p>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '12px',
                background: !upiQrEnabled ? '#FFEBEE' : (!upiQrImageUrl ? '#FFF3E0' : '#E8F5E9'),
                color: !upiQrEnabled ? '#C62828' : (!upiQrImageUrl ? '#E65100' : '#2E7D32')
              }}>
                {!upiQrEnabled ? '○ UPI QR DISABLED' : (!upiQrImageUrl ? '⚠️ UPI QR IS NOT UPLOADED' : '● UPI QR ACTIVE')}
              </span>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveSettings([
                { key: 'upi_qr_enabled', value: upiQrEnabled ? '1' : '0' },
                { key: 'upi_id', value: upiId },
                { key: 'upi_display_name', value: upiDisplayName }
              ]);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '650px' }}>

              {/* Enable / Disable Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FAF8F5', padding: '14px', borderRadius: '8px', border: '1px solid #EAE3D2' }}>
                <input
                  type="checkbox"
                  id="enableUpiQr"
                  checked={upiQrEnabled}
                  onChange={(e) => setUpiQrEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#D4AF37' }}
                />
                <label htmlFor="enableUpiQr" style={{ fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', color: '#111' }}>
                  Enable Direct UPI QR Payment option at customer checkout
                </label>
              </div>

              {/* QR Image Upload & Preview Card */}
              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '8px', border: '1px solid #EAE3D2' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#111', marginBottom: '8px' }}>
                  Current QR Preview
                </label>
                <p style={{ fontSize: '0.78rem', color: '#666', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                  Upload your official merchant UPI QR code. Stored securely on Supabase Storage and displayed to customers during checkout.
                </p>

                {upiQrImageUrl ? (
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{
                      background: '#FFFFFF',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #D4AF37',
                      boxShadow: '0 4px 12px rgba(212,175,55,0.15)',
                      display: 'inline-block'
                    }}>
                      <img
                        src={upiQrImageUrl}
                        alt="Current QR Preview"
                        style={{ width: '160px', height: '160px', objectFit: 'contain', display: 'block', imageRendering: 'crisp-edges' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#2E7D32', fontWeight: '700' }}>
                        ✓ Merchant QR Code Active
                      </span>
                      <label style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: '#FAF8F5',
                        border: '1px solid #D4AF37',
                        borderRadius: '6px',
                        color: '#B78103',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: uploadingQr ? 'not-allowed' : 'pointer'
                      }}>
                        {uploadingQr ? 'Uploading New QR...' : 'Replace QR'}
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handleUploadQr}
                          disabled={uploadingQr}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>
                        Supports PNG, JPG, WEBP (Max 5MB)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    border: '2px dashed #E53935',
                    padding: '24px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    background: '#FFF8F8'
                  }}>
                    <strong style={{ display: 'block', fontSize: '0.92rem', color: '#C62828', marginBottom: '4px' }}>
                      No QR uploaded
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#666', display: 'block', marginBottom: '14px' }}>
                      UPI QR is not uploaded. Upload your merchant QR image below to enable QR scanning at checkout.
                    </span>
                    <label style={{
                      display: 'inline-block',
                      padding: '10px 20px',
                      background: '#D4AF37',
                      color: '#111',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: uploadingQr ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}>
                      {uploadingQr ? 'Uploading QR Image...' : 'Upload QR'}
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleUploadQr}
                        disabled={uploadingQr}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* UPI ID Field */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: '#111' }}>
                  UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. anantarts@okaxis or 9876543210@paytm"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#777', marginTop: '4px', display: 'block' }}>
                  Displayed below the QR code for customers paying via UPI ID on the same phone.
                </span>
              </div>

              {/* Payee Display Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: '#111' }}>
                  Payee / Business Display Name
                </label>
                <input
                  type="text"
                  value={upiDisplayName}
                  onChange={(e) => setUpiDisplayName(e.target.value)}
                  placeholder="e.g. Anant Arts"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#777', marginTop: '4px', display: 'block' }}>
                  Customer will see this payee name on their UPI payment screen to confirm legitimate recipient.
                </span>
              </div>

              <button
                type="submit"
                className="btn-gold"
                style={{ padding: '12px 24px', width: 'fit-content', borderRadius: '6px', fontWeight: '700' }}
                disabled={saving}
              >
                {saving ? 'Saving Settings...' : 'Save UPI QR Settings'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SHIPPING SETTINGS */}
      {activeTab === 'Shipping' && (
        <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', marginBottom: '20px', color: '#111' }}>
            🚚 Shipping Rates &amp; Logistics Configuration
          </h3>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveSettings([
              { key: 'free_shipping_threshold', value: freeShippingMin },
              { key: 'flat_shipping_fee', value: flatShippingFee },
              { key: 'estimated_delivery_days', value: estimatedDeliveryDays }
            ]);
          }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '650px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Free Shipping Threshold (₹ Amount)</label>
              <input type="number" value={freeShippingMin} onChange={(e) => setFreeShippingMin(e.target.value)} placeholder="5000" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
              <span style={{ fontSize: '0.75rem', color: '#777', marginTop: '4px', display: 'block' }}>Orders equal or above this cart value qualify for complimentary shipping nationwide.</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Standard Flat Shipping Fee (₹)</label>
              <input type="number" value={flatShippingFee} onChange={(e) => setFlatShippingFee(e.target.value)} placeholder="150" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Estimated Delivery Time Frame Label</label>
              <input type="text" value={estimatedDeliveryDays} onChange={(e) => setEstimatedDeliveryDays(e.target.value)} placeholder="3-7 Business Days" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
            </div>

            <button type="submit" className="btn-gold" style={{ padding: '12px 24px', width: 'fit-content', borderRadius: '6px', fontWeight: '700' }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Shipping Settings'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: SEO SETTINGS */}
      {activeTab === 'SEO' && (
        <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', marginBottom: '20px', color: '#111' }}>
            🔍 Search Engine &amp; Meta Configuration
          </h3>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveSettings([
              { key: 'seo_title', value: seoTitle },
              { key: 'seo_description', value: seoDescription },
              { key: 'seo_keywords', value: seoKeywords },
              { key: 'og_image_url', value: ogImageUrl }
            ]);
          }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '650px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Default Store Meta Title</label>
              <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Meta Description</label>
              <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows="3" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Meta Keywords (Comma separated)</label>
              <input type="text" value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Social Sharing Banner URL (OG Image)</label>
              <input type="text" value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
            </div>

            <button type="submit" className="btn-gold" style={{ padding: '12px 24px', width: 'fit-content', borderRadius: '6px', fontWeight: '700' }} disabled={saving}>
              {saving ? 'Saving...' : 'Save SEO Metadata'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: EMAIL & SMTP */}
      {activeTab === 'Email' && (
        <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', marginBottom: '20px', color: '#111' }}>
            ✉️ Email Templates &amp; SMTP Transport Configuration
          </h3>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveSettings([
              { key: 'smtp_host', value: smtpHost },
              { key: 'smtp_port', value: smtpPort },
              { key: 'smtp_user', value: smtpUser },
              { key: 'smtp_from', value: smtpFrom },
              { key: 'email_header_msg', value: emailHeaderMsg }
            ]);
          }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '650px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>SMTP Server Host</label>
                <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com / smtp.mailgun.org" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Port</label>
                <input type="text" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Sender Email Address (From)</label>
              <input type="email" value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} placeholder="orders@anantarts.in" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Order Confirmation Header Message</label>
              <textarea value={emailHeaderMsg} onChange={(e) => setEmailHeaderMsg(e.target.value)} rows="3" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
            </div>

            <button type="submit" className="btn-gold" style={{ padding: '12px 24px', width: 'fit-content', borderRadius: '6px', fontWeight: '700' }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Email Configuration'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: TAXATION & GST */}
      {activeTab === 'Taxation' && (
        <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', marginBottom: '20px', color: '#111' }}>
            🏷️ GST &amp; Tax Compliance Configuration
          </h3>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveSettings([
              { key: 'gst_rate', value: gstRate },
              { key: 'hsn_code', value: hsnCode },
              { key: 'tax_inclusive', value: taxInclusive ? '1' : '0' }
            ]);
          }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '650px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>GST Rate (%)</label>
              <input type="number" value={gstRate} onChange={(e) => setGstRate(e.target.value)} placeholder="18" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Default HSN Code for Idols</label>
              <input type="text" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} placeholder="83062990" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FAF8F5', padding: '14px', borderRadius: '8px', border: '1px solid #EAE3D2' }}>
              <input type="checkbox" id="taxInc" checked={taxInclusive} onChange={(e) => setTaxInclusive(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#D4AF37' }} />
              <label htmlFor="taxInc" style={{ fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', color: '#111' }}>
                All product display prices are inclusive of GST tax
              </label>
            </div>

            <button type="submit" className="btn-gold" style={{ padding: '12px 24px', width: 'fit-content', borderRadius: '6px', fontWeight: '700' }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Tax Settings'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: BACKUP & SYSTEM HEALTH */}
      {activeTab === 'Backup' && (
        <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', marginBottom: '12px', color: '#111' }}>
            💾 Database Backup &amp; Disaster Recovery
          </h3>
          <p style={{ color: '#666', fontSize: '0.88rem', marginBottom: '24px' }}>
            Generate and download a complete full-data JSON snapshot of your products, categories, orders, customers, coupons, and website settings.
          </p>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#FAF8F5', padding: '20px', borderRadius: '8px', border: '1px solid #EAE3D2', marginBottom: '24px' }}>
            <span style={{ fontSize: '2.5rem' }}>📦</span>
            <div>
              <strong style={{ display: 'block', fontSize: '1rem', color: '#111' }}>Full Store Database Snapshot</strong>
              <span style={{ fontSize: '0.8rem', color: '#666' }}>Exports all database records securely in standard JSON format.</span>
            </div>
            <button onClick={handleExportBackup} className="btn-gold" style={{ marginLeft: 'auto', padding: '12px 24px', borderRadius: '6px', fontWeight: '700', whiteSpace: 'nowrap' }} disabled={exporting}>
              {exporting ? 'Generating JSON...' : 'Download Full Backup'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 7: TEAM & WHATSAPP */}
      {activeTab === 'Team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* WhatsApp Box */}
          <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', marginBottom: '20px', color: '#111' }}>
              📱 WhatsApp Business Notifications
            </h3>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveSettings([
                { key: 'whatsapp_notifications_enabled', value: wpEnabled ? '1' : '0' },
                { key: 'whatsapp_admin_number', value: wpNumber },
                { key: 'whatsapp_message_template', value: wpTemplate }
              ]);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '650px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" id="wpEnable" checked={wpEnabled} onChange={(e) => setWpEnabled(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#D4AF37' }} />
                <label htmlFor="wpEnable" style={{ fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer' }}>Enable WhatsApp Admin Alerts</label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Admin WhatsApp Phone Number</label>
                <input type="text" value={wpNumber} onChange={(e) => setWpNumber(e.target.value)} placeholder="+91 9876543210" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.88rem' }} />
              </div>

              <button type="submit" className="btn-gold" style={{ padding: '12px 24px', width: 'fit-content', borderRadius: '6px', fontWeight: '700' }} disabled={saving}>
                {saving ? 'Saving...' : 'Save WhatsApp Settings'}
              </button>
            </form>
          </div>

          {/* Admin Team Members Table */}
          <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', margin: 0, color: '#111' }}>
                👥 Admin Accounts &amp; Permissions
              </h3>
              {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
                <button onClick={() => setAdminModalOpen(true)} className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.82rem', borderRadius: '6px' }}>
                  + Add Admin User
                </button>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F0F0F0', color: '#888' }}>
                    <th style={{ padding: '10px' }}>Email</th>
                    <th style={{ padding: '10px' }}>Role</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                      <td style={{ padding: '10px', fontWeight: '600' }}>{a.email}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ background: '#FAF8F5', border: '1px solid #D4AF37', color: '#B59021', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>
                          {a.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ color: a.is_active ? '#2E7D32' : '#C62828', fontWeight: '700' }}>
                          {a.is_active ? '● Active' : '○ Disabled'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {currentUser?.role === 'super_admin' && a.id !== currentUser.id && (
                          <button onClick={() => toggleAdminStatusAction(a.id, !a.is_active)} className="btn-outline-gold" style={{ padding: '4px 10px', fontSize: '0.75rem', marginRight: '6px' }}>
                            {a.is_active ? 'Disable' : 'Enable'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Modal to Create Admin */}
      {adminModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '90%', maxWidth: '480px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontFamily: "'Playfair Display', serif" }}>Add Administrator Account</h3>
            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Email Address</label>
                <input type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Password</label>
                <input type="password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Role</label>
                <select value={newAdminRole} onChange={(e) => setNewAdminRole(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD', background: 'white' }}>
                  <option value="manager">Manager (Orders &amp; Products)</option>
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setAdminModalOpen(false)} style={{ padding: '10px 20px', border: 'none', background: '#EEE', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-gold" style={{ padding: '10px 20px', borderRadius: '6px' }} disabled={adminCreating}>
                  {adminCreating ? 'Creating...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
