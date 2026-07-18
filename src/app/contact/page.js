'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ContactPage() {
  const [phone, setPhone] = useState('+91 72758 19354');
  const [email, setEmail] = useState('care@anantarts.com');
  const [address, setAddress] = useState('Bhoirwadi, Dombivli East, Maharashtra, India');
  const [whatsapp, setWhatsapp] = useState('917275819354');

  // Form states
  const [name, setName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch settings dynamically on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('website_settings').select('*');
        if (data) {
          const s = {};
          data.forEach(r => { s[r.key] = r.value; });
          if (s.contact_phone) setPhone(s.contact_phone);
          if (s.contact_email) setEmail(s.contact_email);
          if (s.contact_address) setAddress(s.contact_address);
          if (s.whatsapp_number) setWhatsapp(s.whatsapp_number);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !formEmail || !subject || !message) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const supabase = createClient();
      
      const inquiryMessage = `📧 General Inquiry from ${name} (${formEmail}) on Subject: "${subject}". Msg: "${message}"`;
      
      const { error: dbErr } = await supabase
        .from('notifications')
        .insert({
          message: inquiryMessage,
          is_read: 0,
          type: 'info',
          link: '/admin'
        });

      if (dbErr) throw new Error('Failed to register inquiry.');
      
      setSuccess('Your message has been sent successfully. Our support team will get back to you shortly.');
      setName('');
      setFormEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem' }}>
        
        <div className="section-heading" style={{ marginBottom: '3.5rem' }}>
          <h2>Contact Patron Support</h2>
          <div className="gold-line"></div>
          <p>Reach out for support, custom order tracking, bulk catalogs, or Jaipur studio inquiries.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'flex-start' }}>
          
          {/* Left Column: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', marginBottom: '10px' }}>Contact Channels</h3>
            
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem' }}>📞</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Call Support</strong>
                  <a href={`tel:${phone.replace(/\s+/g, '')}`} style={{ fontSize: '0.85rem', color: 'var(--primary-gold-hover)' }}>{phone}</a>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem' }}>✉️</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Email Support</strong>
                  <a href={`mailto:${email}`} style={{ fontSize: '0.85rem', color: 'var(--primary-gold-hover)' }}>{email}</a>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem' }}>💬</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>WhatsApp Chat</strong>
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#25D366', fontWeight: '600' }}>Chat Online</a>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem' }}>📍</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Headquarters</strong>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '20px' }}>Inquiry Message Portal</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hemant Singh"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. support@example.com"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Custom order size question"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Inquiry Message *</label>
                <textarea
                  rows="4"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message details here..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.85rem', fontFamily: 'var(--font-body)' }}
                ></textarea>
              </div>

              {error && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', margin: 0 }}>{error}</p>}
              {success && <p style={{ color: 'var(--success)', fontSize: '0.82rem', margin: 0 }}>{success}</p>}

              <button type="submit" className="btn-gold" style={{ justifyContent: 'center', padding: '12px' }} disabled={loading}>
                {loading ? 'Sending message...' : 'Send Message'}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
