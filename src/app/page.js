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

export const revalidate = 3600; // Cache home page for up to 1 hour, revalidate on tag trigger

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
    title: 'Bring Divine Blessings Into Every Home',
    subtitle: 'Premium Electroplated Idols Crafted With Timeless Indian Artistry.',
    image_path: '/uploads/mandir-hero-bg.jpg',
    cta_link: '/shop',
    cta_text: 'Explore Collection'
  };

  const whatsappNumber = settings.whatsapp_number || '917275819354';

  return (
    <>
      {/* 1. PREMIUM HERO SECTION */}
      <section className="hero-section" style={{ position: 'relative', height: '80vh', overflow: 'hidden' }}>
        <div className="hero-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
          <Image
            src={heroBanner.image_path}
            alt="Anant Arts Luxury Hero Banner"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className="hero-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(30,26,23,0.3) 0%, rgba(30,26,23,0.85) 100%)' }} />
        <HeroParticles />
        <div className="hero-content" style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
          <h1 className="hero-title" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>
            {heroBanner.title}
          </h1>
          <p className="hero-subtitle" style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
            {heroBanner.subtitle}
          </p>
          <div className="hero-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={heroBanner.cta_link || '/shop'} className="btn-gold">
              <i className="fas fa-gem" style={{ marginRight: '8px' }}></i> {heroBanner.cta_text || 'Explore Collection'}
            </Link>
            <Link href="/shop?tag=Best+Seller" className="btn-outline-gold" style={{ color: 'var(--text-light)', borderColor: 'var(--text-light)' }}>
              <i className="fas fa-fire" style={{ marginRight: '8px' }}></i> Shop Best Sellers
            </Link>
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

      {/* 2. SHOP BY DEITY SECTION */}
      <div className="section-heading" style={{ marginTop: '5rem' }}>
        <h2>Shop By Deity</h2>
        <div className="gold-line"></div>
        <p>Select from our revered collections curated with sacred precision.</p>
      </div>

      <section className="deity-collection-grid" id="deity-categories-grid" style={{ maxWidth: '1200px', margin: '0 auto 5rem auto', padding: '0 2rem' }}>
        {categories.map((cat) => (
          <Link href={`/shop?category=${cat.slug}`} key={cat.id} className="deity-card" style={{ position: 'relative', height: '350px', display: 'block', overflow: 'hidden' }}>
            <Image 
              src={cat.image_path || '/images/placeholder.jpg'} 
              alt={cat.name} 
              fill 
              sizes="(max-width: 768px) 100vw, 33vw"
              style={{ objectFit: 'cover' }}
              loading="lazy"
            />
            <div className="deity-card-overlay" style={{ zIndex: 2 }}>
              <h3 className="deity-title">{cat.name}</h3>
              <span className="deity-link">Explore Collection <i className="fas fa-arrow-right" style={{ marginLeft: '4px' }}></i></span>
            </div>
          </Link>
        ))}
      </section>

      {/* 3. BEST SELLERS SECTION */}
      <div className="section-heading">
        <h2>Best Sellers</h2>
        <div className="gold-line"></div>
        <p>Our most treasured and adored creations in homes and workspaces worldwide.</p>
      </div>

      <section style={{ maxWidth: '1200px', margin: '0 auto 5rem auto', padding: '0 2rem' }}>
        <div className="products-grid" style={{ padding: 0 }}>
          {bestsellerProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3.5. SHOP BY OCCASION SECTION */}
      <div className="section-heading" style={{ marginTop: '5rem' }}>
        <h2>Shop By Occasion</h2>
        <div className="gold-line"></div>
        <p>Mark auspicious moments and celebrate milestones with timeless spiritual gifts.</p>
      </div>

      <section style={{ 
        maxWidth: '1200px', 
        margin: '0 auto 5rem auto', 
        padding: '0 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '2rem'
      }}>
        {[
          { title: 'Diwali & Festive Gifting', desc: 'Invoke wealth and prosperity under the gold sheen of Laxmi & Ganesh.', link: '/shop?tag=Festive', bg: '/uploads/diwali-gifting.jpg', icon: '🪷' },
          { title: 'Griha Pravesh', desc: 'Sanctify new thresholds with the protective, auspicious gaze of Lord Ganesha.', link: '/shop?tag=Griha+Pravesh', bg: '/uploads/griha-pravesh.jpg', icon: '🗝️' },
          { title: 'Corporate Milestones', desc: 'Reward partners and patrons with hand-plated brass executive accents.', link: '/corporate-gifts', bg: '/uploads/corporate-milestone.jpg', icon: '💼' },
          { title: 'Wedding Blessings', desc: 'Gift divine spiritual grace with Radha Krishna and eternal avatars.', link: '/shop?tag=Wedding', bg: '/uploads/wedding-blessing.jpg', icon: '✨' }
        ].map((occ, idx) => (
          <div key={idx} className="luxury-shimmer" style={{ 
            height: '240px',
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--primary-gold-border)',
            background: 'var(--bg-dark)'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--luxury-gradient)',
              opacity: 0.7,
              zIndex: 1
            }}></div>
            <div style={{
              position: 'relative',
              zIndex: 2,
              padding: '24px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: 'white'
            }}>
              <div>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>{occ.icon}</span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'white', marginBottom: '8px' }}>{occ.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.5' }}>{occ.desc}</p>
              </div>
              <Link href={occ.link} style={{ fontSize: '0.78rem', color: 'var(--primary-gold)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                View Occasion Catalog <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* 4. BRAND PROMO SECTION (Glow Effect) */}
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
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '4px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '600' }}>Crafted with Devotion</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', margin: '1rem 0 1.5rem 0', color: 'white' }}>
            Bring Divine Positive Energy to Your Spaces
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.8', marginBottom: '2.5rem', fontSize: '1rem' }}>
            Each idol undergoes a meticulous 24-step electroplating process, creating a layered micro-sheet of pure 24K Gold or Sterling Silver. A high-durability protective lacquer finish guarantees the sculpture will never blacken or tarnish in home temples, requiring zero daily maintenance.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn-gold">Explore Shop</Link>
            <a href={`https://wa.me/${whatsappNumber}?text=I%20am%20interested%20in%20custom%20pooja%20room%20idols.`} target="_blank" rel="noopener noreferrer" className="btn-outline-gold" style={{ color: 'white', borderColor: 'var(--primary-gold)' }}>
              Custom Orders <i className="fab fa-whatsapp" style={{ marginLeft: '6px', color: '#25D366' }}></i>
            </a>
          </div>
        </div>
      </section>

      {/* 5. NEW ARRIVALS SECTION */}
      <div className="section-heading">
        <h2>New Arrivals</h2>
        <div className="gold-line"></div>
        <p>Freshly casted spiritual designs newly added to our collections.</p>
      </div>

      <NewArrivalsCarousel products={newArrivalProducts} />

      {/* 6. WHY CHOOSE ANANT ARTS & CUSTOMER COUNTERS */}
      <div className="section-heading" style={{ marginTop: '5rem' }}>
        <h2>Why Choose Anant Arts</h2>
        <div className="gold-line"></div>
        <p>Authentic spiritual luxury designed to last for generations.</p>
      </div>

      <section style={{ maxWidth: '1200px', margin: '0 auto 5rem auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
        <div style={{ textAlign: 'center', padding: '32px', background: 'var(--bg-white)', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
          <strong style={{ display: 'block', fontSize: '2.8rem', fontFamily: 'var(--font-heading)', color: 'var(--primary-gold)', marginBottom: '8px' }}>15+</strong>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '8px' }}>Jaipur Lineage Families</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>We co-design with traditional sthapatis preserving ancient shastra measurements for holy feature alignments.</p>
        </div>
        <div style={{ textAlign: 'center', padding: '32px', background: 'var(--bg-white)', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
          <strong style={{ display: 'block', fontSize: '2.8rem', fontFamily: 'var(--font-heading)', color: 'var(--primary-gold)', marginBottom: '8px' }}>24-Step</strong>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '8px' }}>Plating & Lacquer Bake</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>Layered with pure 24K gold or silver sheets under electrical currents, baked with lacquer to prevent fading.</p>
        </div>
        <div style={{ textAlign: 'center', padding: '32px', background: 'var(--bg-white)', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
          <strong style={{ display: 'block', fontSize: '2.8rem', fontFamily: 'var(--font-heading)', color: 'var(--primary-gold)', marginBottom: '8px' }}>10,000+</strong>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '8px' }}>Pooja Temples Blessed</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>Adorning home sanctuaries and high-end corporate tables with secure transit wooden crate delivery.</p>
        </div>
      </section>

      {/* 7. TESTIMONIALS SECTION */}
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
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🪷</div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{test.name}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{test.role}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 8. FAQ PREVIEW SECTION */}
      <div className="section-heading">
        <h2>Frequently Asked Questions</h2>
        <div className="gold-line"></div>
      </div>

      <section style={{ maxWidth: '800px', margin: '0 auto 5rem auto', padding: '0 2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
            <h4 style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '8px' }}>How do I clean my gold-plated idol?</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Use a dry, soft microfiber cloth to gently wipe off dust. Avoid liquid cleaners, water, soaps, or rough materials, as they can wear off the protective lacquer finish.</p>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
            <h4 style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '8px' }}>Do you support custom sizes for home temples?</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Yes! We construct larger sculptures (above 15 inches up to 4 feet) on order. Contact us on WhatsApp or fill the form on our Corporate Gifting/Contact page.</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href="/faq" className="btn-outline-gold" style={{ padding: '0.6rem 1.5rem', fontSize: '0.8rem' }}>View All FAQs</Link>
        </div>
      </section>

      {/* 8.5. JAIPUR ARTISAN STUDIO GALLERY */}
      <div className="section-heading">
        <h2>Jaipur Artisan Studio</h2>
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
          { title: 'Sacred Wax Molding', desc: 'Rajasthan artisans molding pure beeswax templates.', img: '/uploads/artisan-mold.jpg' },
          { title: 'Fine Brass Casting', desc: 'Pouring molten premium bell-metal brass into sacred molds.', img: '/uploads/artisan-cast.jpg' },
          { title: 'Chiseling Detail', desc: 'Hand engraving the complex features and textures of deities.', img: '/uploads/artisan-chisel.jpg' },
          { title: '24K Electroplating Rigor', desc: 'Submerging under high voltage currents to fuse gold sheets.', img: '/uploads/artisan-electroplate.jpg' }
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

      {/* 9. RECENT BLOGS SECTION */}
      {blogs.length > 0 && (
        <>
          <div className="section-heading">
            <h2>Artisan Blogs</h2>
            <div className="gold-line"></div>
            <p>Learn the stories, design lineages, and temple vastu guidelines.</p>
          </div>
          <section style={{ maxWidth: '1200px', margin: '0 auto 5rem auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {blogs.slice(0, 3).map((blog) => (
              <div key={blog.id} style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                    <Image 
                      src={blog.featured_image || '/uploads/blog-placeholder.jpg'} 
                      alt={blog.title} 
                      fill 
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>
                  <div style={{ padding: '20px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-gold)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {new Date(blog.publish_date || blog.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', margin: '8px 0 12px 0', fontFamily: 'var(--font-heading)', height: '50px', overflow: 'hidden' }}>{blog.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', height: '80px', overflow: 'hidden' }}>{blog.short_desc}</p>
                  </div>
                </div>
                <div style={{ padding: '0 20px 20px 20px' }}>
                  <Link href={`/blog/${blog.slug}`} className="btn-outline-gold" style={{ width: '100%', padding: '6px', fontSize: '0.78rem', justifyContent: 'center' }}>
                    Read Article
                  </Link>
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {/* Pop-up Modals */}
      <NewsletterExitModals />
    </>
  );
}
