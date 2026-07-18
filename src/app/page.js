import Link from 'next/link';
import { 
  getSettings, 
  getBanners, 
  getCategories, 
  getProducts, 
  getTestimonials,
  getBlogs
} from '@/lib/db-helpers';
import Image from 'next/image';
import NewArrivalsCarousel from '@/components/home/NewArrivalsCarousel';
import ProductCard from '@/components/common/ProductCard';
import HeroParticles from '@/components/home/HeroParticles';
import NewsletterExitModals from '@/components/home/NewsletterExitModals';
import BulkEnquiryForm from '@/components/home/BulkEnquiryForm';

export const revalidate = 3600; // Cache home page for up to 1 hour

export default async function Home() {
  const settings = await getSettings();
  const banners = await getBanners();
  const categories = await getCategories();
  const testimonials = await getTestimonials();
  const blogs = await getBlogs();

  // Fetch bestsellers and new arrivals
  const bestsellerProducts = await getProducts({ tag: 'Best Seller', limit: 8 });
  const newArrivalProducts = await getProducts({ tag: 'New Arrival', limit: 10 });

  const heroBanner = banners[0] || {
    title: 'Timeless Electroplated Creations for Every Space',
    subtitle: 'Discover premium electroplated décor, spiritual artifacts, luxury gifts, collectibles, and customized creations crafted with exceptional artistry.',
    image_path: '/uploads/mandir-hero-bg.jpg',
    cta_link: '/shop',
    cta_text: 'Shop Collection'
  };

  const whatsappNumber = settings.whatsapp_number || '917275819354';

  return (
    <>
      {/* 1. PREMIUM HERO SECTION */}
      <section className="hero-section" style={{ position: 'relative', height: '80vh', overflow: 'hidden' }}>
        <div className="hero-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
          <video 
            src={heroBanner.video_url || "https://assets.mixkit.co/videos/preview/mixkit-gold-dust-particles-background-loop-41584-large.mp4"}
            autoPlay 
            loop 
            muted 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div className="hero-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(30,26,23,0.3) 0%, rgba(30,26,23,0.85) 100%)' }} />
        <HeroParticles />
        <div className="hero-content" style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '850px', margin: '0 auto', padding: '0 2rem' }}>
          <h1 className="hero-title" style={{ fontSize: '3.2rem', color: 'var(--text-light)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', lineHeight: '1.2' }}>
            Timeless Electroplated Creations for Every Space
          </h1>
          <p className="hero-subtitle" style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.9)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
            Discover premium electroplated décor, spiritual artifacts, luxury gifts, collectibles, and customized creations crafted with exceptional artistry.
          </p>
          <div className="hero-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn-gold">
              <i className="fas fa-gem" style={{ marginRight: '8px' }}></i> Shop Collection
            </Link>
            <a href="#categories-section" className="btn-outline-gold" style={{ color: 'var(--text-light)', borderColor: 'var(--text-light)' }}>
              <i className="fas fa-th-large" style={{ marginRight: '8px' }}></i> Explore Categories
            </a>
          </div>
        </div>
      </section>

      {/* Hero Trust Bar */}
      <div className="hero-trust-bar">
        <div className="hero-trust-container">
          <div className="hero-trust-badge"><i className="fas fa-check-circle"></i> Premium Electroplating</div>
          <div className="hero-trust-badge"><i className="fas fa-box"></i> Secure Packaging</div>
          <div className="hero-trust-badge"><i className="fas fa-wallet"></i> COD Available</div>
          <div className="hero-trust-badge"><i className="fas fa-shipping-fast"></i> Free Shipping</div>
          <div className="hero-trust-badge"><i className="fas fa-award"></i> Made in India</div>
        </div>
      </div>

      {/* 2. EXPLORE CATEGORIES SECTION */}
      <div id="categories-section" className="section-heading" style={{ marginTop: '5rem' }}>
        <h2>Explore Our Collections</h2>
        <div className="gold-line"></div>
        <p>Premium electroplated masterpieces curated for spiritual, home, and corporate spaces.</p>
      </div>

      <section className="categories-grid">
        {categories.map((cat) => (
          <Link href={`/shop?category=${cat.slug}`} key={cat.id} className="category-card">
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <Image 
                src={cat.image_path || '/images/placeholder.jpg'} 
                alt={cat.name} 
                fill 
                sizes="(max-width: 768px) 50vw, 25vw"
                style={{ objectFit: 'cover' }}
                loading="lazy"
              />
            </div>
            <div className="overlay">
              <h3>{cat.name}</h3>
            </div>
          </Link>
        ))}
      </section>

      {/* 3. BEST SELLERS SECTION */}
      <div className="section-heading" style={{ marginTop: '5rem' }}>
        <h2>Best Sellers</h2>
        <div className="gold-line"></div>
        <p>Our most treasured and adored creations in homes and workplaces worldwide.</p>
      </div>

      <section style={{ maxWidth: '1200px', margin: '0 auto 5rem auto', padding: '0 2rem' }}>
        <div className="products-grid" style={{ padding: 0 }}>
          {bestsellerProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. CORPORATE GIFTING SOLUTIONS */}
      <div className="section-heading" style={{ marginTop: '5rem' }}>
        <h2>Corporate Gifting Solutions</h2>
        <div className="gold-line"></div>
        <p>Make a lasting impression with premium electroplated business gifts.</p>
      </div>

      <section style={{ 
        maxWidth: '1200px', 
        margin: '0 auto 5rem auto', 
        padding: '0 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem'
      }}>
        {[
          { title: 'Executive Desk Accents', desc: 'Silver and gold plated clock organizers, business card holsters, and customized desk plaques.', icon: '💼' },
          { title: 'Custom Logo Engravings', desc: 'Bespoke corporate awards and identity plaques electroplated with precision branding.', icon: '🏷️' },
          { title: 'Volume Tier Pricing', desc: 'Tiered wholesale discounts for large orders starting from 10 units up to bulk requirements.', icon: '📈' },
          { title: 'Luxury Presentation Boxes', desc: 'Premium velvet, leatherette, or wooden packaging boxes with custom brand embossings.', icon: '🎁' }
        ].map((corp, idx) => (
          <div key={idx} style={{ 
            padding: '30px 24px',
            borderRadius: '8px',
            border: '1px solid var(--primary-gold-border)',
            background: 'white',
            boxShadow: 'var(--shadow-sm)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '14px' }}>{corp.icon}</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--text-dark)', marginBottom: '10px' }}>{corp.title}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{corp.desc}</p>
          </div>
        ))}
      </section>

      {/* 5. CUSTOMIZED ELECTROPLATED PRODUCTS */}
      <section style={{ 
        background: 'var(--luxury-gradient)', 
        color: 'white', 
        padding: '5rem 2rem', 
        textAlign: 'center',
        borderTop: '1px solid var(--primary-gold-border)',
        borderBottom: '1px solid var(--primary-gold-border)',
        marginBottom: '5rem',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '4px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '600' }}>Customization Studio</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.6rem', margin: '1rem 0 1.5rem 0', color: 'white', lineHeight: '1.2' }}>
            Custom Electroplated Products Crafted to Order
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: '1.8', marginBottom: '2.5rem', fontSize: '1rem' }}>
            Whether it is custom sized sculptures, personalized nameplates, or bespoke home accessories, Anant Arts provides high-grade electroplating customizations. Select your base material (brass, steel, composite), pick your plating finish (24K Gold, Pure Silver, Antique Bronze), and upload your dimensions.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#bulk-enquiry-section" className="btn-gold">Request Custom Quote</a>
            <a href={`https://wa.me/${whatsappNumber}?text=I%20am%20interested%20in%20custom%20electroplated%20products.`} target="_blank" rel="noopener noreferrer" className="btn-outline-gold" style={{ color: 'white', borderColor: 'var(--primary-gold)' }}>
              WhatsApp Custom Studio <i className="fab fa-whatsapp" style={{ marginLeft: '6px', color: '#25D366' }}></i>
            </a>
          </div>
        </div>
      </section>

      {/* 6. NEW ARRIVALS SECTION */}
      <div className="section-heading">
        <h2>New Arrivals</h2>
        <div className="gold-line"></div>
        <p>Freshly electroplated designs newly added to our collections.</p>
      </div>

      <NewArrivalsCarousel products={newArrivalProducts} />

      {/* 7. WHY CHOOSE ANANT ARTS */}
      <div className="section-heading" style={{ marginTop: '5rem' }}>
        <h2>Why Choose Anant Arts</h2>
        <div className="gold-line"></div>
        <p>Experience premium craftsmanship designed to bring elegance and luxury to any space.</p>
      </div>

      <section style={{ maxWidth: '1200px', margin: '0 auto 5rem auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {[
          { title: 'Premium Electroplating Finish', desc: 'Layered with pure 24K gold, silver, or bronze under precise electrical currents for absolute brilliance.', icon: '✨' },
          { title: 'Handcrafted Designs', desc: 'Intricately hand chiselled and cast by master traditional artisans preserving heritage structures.', icon: '🔨' },
          { title: 'Perfect for Gifting', desc: 'Luxurious gift presentation boxes, customized tags, and certificates of electroplate authenticity.', icon: '💝' },
          { title: 'Pan India Delivery', desc: 'Insured express logistics and double-reinforced packaging to ensure damage-free transit.', icon: '🚚' },
          { title: 'Customization Available', desc: 'Bespoke dimensions, customized text engravings, logo integrations, and select dual plating finishes.', icon: '🛠️' },
          { title: 'Secure Packaging', desc: 'Reinforced secure boxes, foam cushioning, and wooden-crating options for larger collector sculptures.', icon: '📦' }
        ].map((feat, idx) => (
          <div key={idx} style={{ 
            padding: '24px', 
            background: 'var(--bg-white)', 
            borderRadius: '8px', 
            border: '1px solid var(--primary-gold-border)', 
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>{feat.icon}</span>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', marginBottom: '6px' }}>{feat.title}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{feat.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 8. TESTIMONIALS SECTION */}
      <div className="section-heading">
        <h2>Customer Testimonials</h2>
        <div className="gold-line"></div>
        <p>Read inspiring experiences shared by our global patrons.</p>
      </div>

      <section style={{ maxWidth: '1200px', margin: '0 auto 5rem auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {testimonials.slice(0, 3).map((test) => (
          <div key={test.id} style={{ background: 'var(--bg-white)', padding: '32px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', gap: '4px', color: 'var(--primary-gold)', marginBottom: '16px' }}>
              {Array.from({ length: test.rating || 5 }).map((_, i) => (
                <i key={i} className="fas fa-star"></i>
              ))}
            </div>
            <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-dark)', lineHeight: '1.6', marginBottom: '20px' }}>
              "{test.comment}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💎</div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{test.name}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{test.role}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 9. BULK ENQUIRIES SECTION */}
      <div id="bulk-enquiry-section" style={{ padding: '4rem 0', background: 'var(--bg-cream)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <BulkEnquiryForm />
        </div>
      </div>

      {/* FAQ PREVIEW SECTION */}
      <div className="section-heading" style={{ marginTop: '5rem' }}>
        <h2>Frequently Asked Questions</h2>
        <div className="gold-line"></div>
      </div>

      <section style={{ maxWidth: '800px', margin: '0 auto 5rem auto', padding: '0 2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
            <h4 style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '8px' }}>How do I clean my gold-plated artifacts?</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Use a dry, soft microfiber cloth to gently wipe off dust. Avoid liquid cleaners, water, soaps, or rough materials, as they can wear off the protective lacquer finish.</p>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
            <h4 style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '8px' }}>Do you support custom sizes for home and office decor?</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Yes! We construct larger sculptures and decorative accents on order. Please fill the B2B Enquiry form or contact us on WhatsApp directly.</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href="/faq" className="btn-outline-gold" style={{ padding: '0.6rem 1.5rem', fontSize: '0.8rem' }}>View All FAQs</Link>
        </div>
      </section>

      {/* JAIPUR ARTISAN STUDIO GALLERY */}
      <div className="section-heading">
        <h2>Artisan Studio Workshop</h2>
        <div className="gold-line"></div>
        <p>Sneak peek into our workshop lines, highlighting wax casting, gold electroplating, and detailed hand engraving.</p>
      </div>

      <section style={{ 
        maxWidth: '1200px', 
        margin: '0 auto 5rem auto', 
        padding: '0 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {[
          { title: 'Wax Molding', desc: 'Rajasthan artisans molding pure beeswax templates.', img: '/uploads/artisan-mold.png' },
          { title: 'Fine Brass Casting', desc: 'Pouring molten premium bell-metal brass into molds.', img: '/uploads/artisan-cast.png' },
          { title: 'Chiseling Detail', desc: 'Hand engraving the complex features and textures of products.', img: '/uploads/artisan-chisel.png' },
          { title: 'Electroplating Rigor', desc: 'Submerging under high voltage currents to fuse gold sheets.', img: '/uploads/artisan-electroplate.png' }
        ].map((gal, idx) => (
          <div key={idx} style={{ 
            borderRadius: '6px', 
            overflow: 'hidden', 
            border: '1px solid var(--primary-gold-border)',
            background: 'white',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: '100%', height: '100%', background: 'var(--luxury-gradient)', opacity: 0.1, position: 'absolute', zIndex: 1 }}></div>
              <span style={{ position: 'absolute', top: '10px', right: '10px', color: '#fff', fontSize: '1rem', zIndex: 2 }}><i className="fab fa-instagram"></i></span>
              <Image 
                src={gal.img} 
                alt={gal.title} 
                fill 
                sizes="(max-width: 768px) 50vw, 25vw"
                style={{ objectFit: 'cover' }}
                loading="lazy"
              />
            </div>
            <div style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: '600', marginBottom: '4px' }}>{gal.title}</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{gal.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Pop-up Modals */}
      <NewsletterExitModals />
    </>
  );
}
