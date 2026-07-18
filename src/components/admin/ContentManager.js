'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateWebsiteSettings, addOrUpdateCategory } from '@/app/actions'; // We can write a specific banner action or use settings updates

export default function ContentManager({ settings = {}, banners = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Settings states
  const [siteName, setSiteName] = useState(settings.site_name || 'Anant Arts');
  const [siteTagline, setSiteTagline] = useState(settings.site_tagline || 'Bringing Divine Art to Every Home');
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsapp_number || '917275819354');
  const [contactPhone, setContactPhone] = useState(settings.contact_phone || '+91 72758 19354');
  const [contactEmail, setContactEmail] = useState(settings.contact_email || 'care@anantarts.com');
  const [contactAddress, setContactAddress] = useState(settings.contact_address || 'Bhoirwadi, Dombivli East, Maharashtra');
  
  // Policies states
  const [aboutUsText, setAboutUsText] = useState(settings.about_us_text || '');
  const [shippingPolicy, setShippingPolicy] = useState(settings.shipping_policy || '');
  const [returnPolicy, setReturnPolicy] = useState(settings.return_policy || '');
  const [privacyPolicy, setPrivacyPolicy] = useState(settings.privacy_policy || '');

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      site_name: siteName,
      site_tagline: siteTagline,
      whatsapp_number: whatsappNumber,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      contact_address: contactAddress,
      about_us_text: aboutUsText,
      shipping_policy: shippingPolicy,
      return_policy: returnPolicy,
      privacy_policy: privacyPolicy
    };

    const res = await updateWebsiteSettings(payload);
    setLoading(false);

    if (res.success) {
      showAlert('success', 'Website settings and content successfully updated!');
      startTransition(() => {
        router.refresh();
      });
    } else {
      showAlert('danger', res.message);
    }
  };

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

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: 0 }}>Content & Page Management</h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Modify contact details, about story, and policy contents</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Left Card: Core Settings */}
        <div style={{ flex: '1 1 400px', background: 'white', padding: '32px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '20px' }}>Site Identity & Contacts</h3>
          
          <form onSubmit={handleSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Site Title</label>
                <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Tagline</label>
                <input type="text" value={siteTagline} onChange={(e) => setSiteTagline(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Support Email</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Support Phone</label>
                <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>WhatsApp Number</label>
                <input type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Studio Address</label>
                <input type="text" value={contactAddress} onChange={(e) => setContactAddress(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--primary-gold-border)' }} />

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', margin: '10px 0 4px 0' }}>Pages & Policy Texts</h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Brand Story Text (About Us)</label>
              <textarea rows="4" value={aboutUsText} onChange={(e) => setAboutUsText(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', fontFamily: 'var(--font-body)', fontSize: '0.82rem' }}></textarea>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Shipping Policy details</label>
              <textarea rows="3" value={shippingPolicy} onChange={(e) => setShippingPolicy(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', fontFamily: 'var(--font-body)', fontSize: '0.82rem' }}></textarea>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Return & Refund Policy details</label>
              <textarea rows="3" value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', fontFamily: 'var(--font-body)', fontSize: '0.82rem' }}></textarea>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Privacy Policy details</label>
              <textarea rows="3" value={privacyPolicy} onChange={(e) => setPrivacyPolicy(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', fontFamily: 'var(--font-body)', fontSize: '0.82rem' }}></textarea>
            </div>

            <button type="submit" className="btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '10px' }} disabled={loading}>
              {loading ? 'Saving adjustments...' : 'Save Settings & Policies'}
            </button>
          </form>
        </div>

        {/* Right Card: Banners list preview */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px' }}>Active Banners</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {banners.map((b) => (
                <div key={b.id} style={{ border: '1px solid var(--primary-gold-border)', borderRadius: '6px', overflow: 'hidden' }}>
                  <img src={b.image_path} alt="" style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                  <div style={{ padding: '12px', fontSize: '0.78rem' }}>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>{b.title}</strong>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>{b.subtitle}</span>
                    <span>CTA Link: <code>{b.cta_link}</code></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
