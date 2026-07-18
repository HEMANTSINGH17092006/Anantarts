'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateWebsiteSettings } from '@/app/actions';

const INPUT_STYLE = { width: '100%', padding: '9px 12px', border: '1px solid var(--primary-gold-border)', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '0.85rem', background: '#fafafa', boxSizing: 'border-box' };
const LABEL_STYLE = { display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' };
const SECTION_STYLE = { background: 'white', padding: '28px 32px', borderRadius: '10px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', marginBottom: '24px' };
const SECTION_TITLE = { fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--primary-gold-border)' };

export default function ContentManager({ settings = {}, banners = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('identity');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Tab 1: Site Identity
  const [siteName, setSiteName] = useState(settings.site_name || 'Anant Arts');
  const [siteTagline, setSiteTagline] = useState(settings.site_tagline || 'Bringing Divine Art to Every Home');

  // Tab 2: Contact & Email
  const [contactPhone, setContactPhone] = useState(settings.contact_phone || '+91 72758 19354');
  const [contactEmail, setContactEmail] = useState(settings.contact_email || 'care@anantarts.in');
  const [supportEmail, setSupportEmail] = useState(settings.support_email || 'support@anantarts.in');
  const [ordersEmail, setOrdersEmail] = useState(settings.orders_email || 'orders@anantarts.in');
  const [contactAddress, setContactAddress] = useState(settings.contact_address || 'Bhoirwadi, Dombivli East, Maharashtra');
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsapp_number || '917275819354');

  // Tab 3: SEO
  const [seoTitle, setSeoTitle] = useState(settings.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(settings.seo_description || '');
  const [gscVerification, setGscVerification] = useState(settings.gsc_verification || '');
  const [gaMeasurementId, setGaMeasurementId] = useState(settings.ga_measurement_id || '');
  const [clarityProjectId, setClarityProjectId] = useState(settings.clarity_project_id || '');

  // Tab 4: Policies
  const [aboutUsText, setAboutUsText] = useState(settings.about_us_text || '');
  const [shippingPolicy, setShippingPolicy] = useState(settings.shipping_policy || '');
  const [returnPolicy, setReturnPolicy] = useState(settings.return_policy || '');
  const [refundPolicy, setRefundPolicy] = useState(settings.refund_policy || '');
  const [privacyPolicy, setPrivacyPolicy] = useState(settings.privacy_policy || '');
  const [termsConditions, setTermsConditions] = useState(settings.terms_conditions || '');

  // Tab 5: Social Links
  let socialLinksObj = { instagram: '', facebook: '', youtube: '', pinterest: '' };
  try {
    if (settings.social_links) {
      socialLinksObj = typeof settings.social_links === 'string' ? JSON.parse(settings.social_links) : settings.social_links;
    }
  } catch (e) {}
  const [instagram, setInstagram] = useState(socialLinksObj.instagram || '');
  const [facebook, setFacebook] = useState(socialLinksObj.facebook || '');
  const [youtube, setYoutube] = useState(socialLinksObj.youtube || '');
  const [pinterest, setPinterest] = useState(socialLinksObj.pinterest || '');

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  const handleSave = async (payload, label = 'Settings') => {
    setLoading(true);
    const res = await updateWebsiteSettings(payload);
    setLoading(false);
    if (res.success) {
      showAlert('success', `✅ ${label} saved successfully!`);
      startTransition(() => router.refresh());
    } else {
      showAlert('danger', `❌ ${res.message}`);
    }
  };

  const tabs = [
    { id: 'identity', label: '🏷️ Identity', icon: 'fa-id-card' },
    { id: 'contact', label: '📞 Contact', icon: 'fa-phone' },
    { id: 'seo', label: '🔍 SEO & Analytics', icon: 'fa-search' },
    { id: 'policies', label: '📋 Policies', icon: 'fa-file-alt' },
    { id: 'social', label: '🌐 Social', icon: 'fa-share-alt' },
    { id: 'banners', label: '🖼️ Banners', icon: 'fa-image' },
  ];

  return (
    <div>
      {/* Alert Banner */}
      {alert.message && (
        <div style={{
          padding: '12px 20px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.875rem',
          background: alert.type === 'success' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(198, 40, 40, 0.1)',
          border: `1px solid ${alert.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: alert.type === 'success' ? 'var(--success)' : 'var(--danger)',
        }}>
          {alert.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: '0 0 4px 0' }}>Content & Settings</h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage site identity, contact info, SEO, policies, social links and banners</span>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px', borderBottom: '2px solid var(--primary-gold-border)', paddingBottom: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer', fontSize: '0.82rem',
              borderRadius: '6px 6px 0 0', fontWeight: activeTab === tab.id ? '600' : '400',
              background: activeTab === tab.id ? 'var(--primary-gold)' : 'white',
              color: activeTab === tab.id ? 'var(--bg-dark)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary-gold)' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ====================== TAB 1: IDENTITY ====================== */}
      {activeTab === 'identity' && (
        <div style={SECTION_STYLE}>
          <h3 style={SECTION_TITLE}>🏷️ Site Identity</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={LABEL_STYLE}>Site Name</label>
              <input type="text" value={siteName} onChange={e => setSiteName(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Tagline</label>
              <input type="text" value={siteTagline} onChange={e => setSiteTagline(e.target.value)} style={INPUT_STYLE} />
            </div>
          </div>
          <button
            className="btn-gold"
            style={{ marginTop: '20px', padding: '11px 28px' }}
            disabled={loading}
            onClick={() => handleSave({ site_name: siteName, site_tagline: siteTagline }, 'Site Identity')}
          >
            {loading ? 'Saving...' : 'Save Identity'}
          </button>
        </div>
      )}

      {/* ====================== TAB 2: CONTACT ====================== */}
      {activeTab === 'contact' && (
        <div style={SECTION_STYLE}>
          <h3 style={SECTION_TITLE}>📞 Contact & Email Settings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={LABEL_STYLE}>Primary Contact Email (care@)</label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Support Email (support@)</label>
              <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Orders Email (orders@)</label>
              <input type="email" value={ordersEmail} onChange={e => setOrdersEmail(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Support Phone</label>
              <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>WhatsApp Number (with country code)</label>
              <input type="text" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} style={INPUT_STYLE} placeholder="917275819354" />
            </div>
            <div>
              <label style={LABEL_STYLE}>Studio / Office Address</label>
              <input type="text" value={contactAddress} onChange={e => setContactAddress(e.target.value)} style={INPUT_STYLE} />
            </div>
          </div>
          <button
            className="btn-gold"
            style={{ marginTop: '20px', padding: '11px 28px' }}
            disabled={loading}
            onClick={() => handleSave({
              contact_email: contactEmail, support_email: supportEmail, orders_email: ordersEmail,
              contact_phone: contactPhone, whatsapp_number: whatsappNumber, contact_address: contactAddress,
            }, 'Contact & Email Settings')}
          >
            {loading ? 'Saving...' : 'Save Contact Settings'}
          </button>
        </div>
      )}

      {/* ====================== TAB 3: SEO ====================== */}
      {activeTab === 'seo' && (
        <div style={SECTION_STYLE}>
          <h3 style={SECTION_TITLE}>🔍 SEO & Analytics Configuration</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={LABEL_STYLE}>Homepage SEO Title <span style={{ color: 'var(--text-muted)', fontWeight: '400', textTransform: 'none' }}>({seoTitle.length}/70 chars)</span></label>
              <input type="text" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} style={INPUT_STYLE} maxLength={70} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Homepage Meta Description <span style={{ color: 'var(--text-muted)', fontWeight: '400', textTransform: 'none' }}>({seoDescription.length}/160 chars)</span></label>
              <textarea rows="3" value={seoDescription} onChange={e => setSeoDescription(e.target.value)} style={{ ...INPUT_STYLE, resize: 'vertical' }} maxLength={160} />
            </div>

            <div style={{ padding: '16px', background: '#f9f5e7', borderRadius: '6px', border: '1px solid var(--primary-gold-border)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 14px 0', fontStyle: 'italic' }}>
                💡 The following IDs are used by the Layout to inject analytics scripts on every page. Leave blank to disable.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={LABEL_STYLE}>Google Analytics 4 Measurement ID</label>
                  <input type="text" value={gaMeasurementId} onChange={e => setGaMeasurementId(e.target.value)} style={INPUT_STYLE} placeholder="G-XXXXXXXXXX" />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Microsoft Clarity Project ID</label>
                  <input type="text" value={clarityProjectId} onChange={e => setClarityProjectId(e.target.value)} style={INPUT_STYLE} placeholder="your_clarity_project_id" />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Google Search Console Verification</label>
                  <input type="text" value={gscVerification} onChange={e => setGscVerification(e.target.value)} style={INPUT_STYLE} placeholder="GSC meta tag content value" />
                </div>
              </div>
            </div>
          </div>
          <button
            className="btn-gold"
            style={{ marginTop: '20px', padding: '11px 28px' }}
            disabled={loading}
            onClick={() => handleSave({
              seo_title: seoTitle, seo_description: seoDescription,
              ga_measurement_id: gaMeasurementId, clarity_project_id: clarityProjectId,
              gsc_verification: gscVerification,
            }, 'SEO & Analytics')}
          >
            {loading ? 'Saving...' : 'Save SEO Settings'}
          </button>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
            ⚠️ Changes to analytics IDs require a server restart to take effect (they are loaded via environment variables).
            Update your <code>.env.local</code> / Vercel dashboard for permanent changes.
          </p>
        </div>
      )}

      {/* ====================== TAB 4: POLICIES ====================== */}
      {activeTab === 'policies' && (
        <div style={SECTION_STYLE}>
          <h3 style={SECTION_TITLE}>📋 Pages & Policy Content</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-10px', marginBottom: '20px' }}>
            You can use HTML tags in these fields (e.g., &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;).
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[
              { label: 'Brand Story (About Us page)', value: aboutUsText, set: setAboutUsText, rows: 5 },
              { label: 'Shipping Policy', value: shippingPolicy, set: setShippingPolicy, rows: 4 },
              { label: 'Return Policy', value: returnPolicy, set: setReturnPolicy, rows: 4 },
              { label: 'Refund Policy (/refund-policy)', value: refundPolicy, set: setRefundPolicy, rows: 4 },
              { label: 'Privacy Policy', value: privacyPolicy, set: setPrivacyPolicy, rows: 4 },
              { label: 'Terms & Conditions (/terms-and-conditions)', value: termsConditions, set: setTermsConditions, rows: 5 },
            ].map(({ label, value, set, rows }) => (
              <div key={label}>
                <label style={LABEL_STYLE}>{label}</label>
                <textarea
                  rows={rows}
                  value={value}
                  onChange={e => set(e.target.value)}
                  style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: '1.6' }}
                />
              </div>
            ))}
          </div>
          <button
            className="btn-gold"
            style={{ marginTop: '20px', padding: '11px 28px' }}
            disabled={loading}
            onClick={() => handleSave({
              about_us_text: aboutUsText, shipping_policy: shippingPolicy, return_policy: returnPolicy,
              refund_policy: refundPolicy, privacy_policy: privacyPolicy, terms_conditions: termsConditions,
            }, 'Policies & Page Content')}
          >
            {loading ? 'Saving...' : 'Save All Policies'}
          </button>
        </div>
      )}

      {/* ====================== TAB 5: SOCIAL ====================== */}
      {activeTab === 'social' && (
        <div style={SECTION_STYLE}>
          <h3 style={SECTION_TITLE}>🌐 Social Media Links</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Instagram URL', value: instagram, set: setInstagram, icon: 'fab fa-instagram', placeholder: 'https://instagram.com/anantarts' },
              { label: 'Facebook URL', value: facebook, set: setFacebook, icon: 'fab fa-facebook', placeholder: 'https://facebook.com/anantarts' },
              { label: 'YouTube URL', value: youtube, set: setYoutube, icon: 'fab fa-youtube', placeholder: 'https://youtube.com/anantarts' },
              { label: 'Pinterest URL', value: pinterest, set: setPinterest, icon: 'fab fa-pinterest', placeholder: 'https://pinterest.com/anantarts' },
            ].map(({ label, value, set, icon, placeholder }) => (
              <div key={label}>
                <label style={LABEL_STYLE}>
                  <i className={icon} style={{ marginRight: '6px', color: 'var(--primary-gold)' }}></i>
                  {label}
                </label>
                <input type="url" value={value} onChange={e => set(e.target.value)} style={INPUT_STYLE} placeholder={placeholder} />
              </div>
            ))}
          </div>
          <button
            className="btn-gold"
            style={{ marginTop: '20px', padding: '11px 28px' }}
            disabled={loading}
            onClick={() => handleSave({
              social_links: JSON.stringify({ instagram, facebook, youtube, pinterest }),
            }, 'Social Media Links')}
          >
            {loading ? 'Saving...' : 'Save Social Links'}
          </button>
        </div>
      )}

      {/* ====================== TAB 6: BANNERS ====================== */}
      {activeTab === 'banners' && (
        <div style={SECTION_STYLE}>
          <h3 style={SECTION_TITLE}>🖼️ Homepage Banners</h3>
          {banners.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <i className="fas fa-image" style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block', opacity: '0.4' }}></i>
              <p>No banners configured. Add banners via the Product Manager or Supabase directly.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {banners.map((b) => (
                <div key={b.id} style={{ border: '1px solid var(--primary-gold-border)', borderRadius: '8px', overflow: 'hidden', background: '#fafafa' }}>
                  {b.image_path && (
                    <img src={b.image_path} alt={b.title || 'Banner'} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '14px', fontSize: '0.8rem' }}>
                    <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.88rem' }}>{b.title || 'Untitled Banner'}</strong>
                    {b.subtitle && <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>{b.subtitle}</span>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <code style={{ fontSize: '0.72rem', background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>{b.cta_link || '/'}</code>
                      <span style={{
                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', fontWeight: '600',
                        background: b.is_active ? 'rgba(46, 125, 50, 0.12)' : 'rgba(150,150,150,0.12)',
                        color: b.is_active ? 'var(--success)' : 'var(--text-muted)',
                      }}>
                        {b.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '20px' }}>
            💡 To add or remove banners, go to <strong>Supabase → Table Editor → banners</strong>, or use the Product Manager banners section.
          </p>
        </div>
      )}

    </div>
  );
}
