import Link from 'next/link';
import Image from 'next/image';
import { getCategories } from '@/lib/db-helpers';
import { constructMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata = constructMetadata({
  title: 'Handcrafted Home Décor & Artisanal Collections | Anant Arts',
  description: 'Explore handcrafted home decor, traditional Indian wooden handicrafts, 24K gold spiritual idols, and luxury decorative items curated for elegant homes.',
  canonical: '/collections',
  keywords: [
    'handcrafted home decor',
    'Indian home decor',
    'luxury home decor',
    'decorative items for home',
    'handcrafted decor',
    'traditional home decor'
  ]
});

export default async function CollectionsPage() {
  const categories = await getCategories();

  const ALL_COLLECTIONS = [
    { name: 'Spiritual Collection', icon: '✨', slug: 'spiritual-collection', image: '/uploads/category-spiritual-collection.png', desc: 'Divine 24K gold and pure silver electroplated idols & sacred temple murtis.' },
    { name: 'Wooden Handicrafts', icon: '🪵', slug: 'wooden-handicrafts', image: '/uploads/category-wooden-handicrafts.png', desc: 'Handcrafted seasoned teak and rosewood mandir accessories & jali artwork.' },
    { name: 'Home Décor', icon: '🏡', slug: 'home-decor', image: '/uploads/category-home-decor.png', desc: 'High-lustre table accents, luxury vases, showpieces & brass wall art.' },
    { name: 'Corporate Gifts', icon: '🎁', slug: 'corporate-gifts', image: '/uploads/category-corporate-gifts.png', desc: 'Executive desk organizers, logo-engraved plaques & bulk corporate hampers.' },
    { name: 'Festival Collection', icon: '🎉', slug: 'festive-gifts', image: '/uploads/category-festive-gifts.png', desc: 'Diwali Lakshmi Ganesh specials, Chaturthi statues & festive celebration accents.' },
    { name: 'Decorative Figurines', icon: '🕯', slug: 'decorative-figurines', image: '/uploads/category-decorative-figurines.png', desc: 'Intricately chiselled figurines, elephant pairs & artistic statement sculptures.' },
    { name: 'Premium Collectibles', icon: '🛋', slug: 'office-decor', image: '/uploads/category-premium-collectibles.png', desc: 'Centerpiece sculptures for luxury drawing rooms, executive suites & lobbies.' },
    { name: 'Customized Products', icon: '🎨', slug: 'customized-products', image: '/uploads/category-customized-products.png', desc: 'Bespoke dimensions, custom deity postures, and personalized text engravings.' }
  ];

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '80vh', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Page Header */}
        <div className="section-heading" style={{ marginBottom: '3.5rem' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Artisanal Portfolio
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            Handcrafted Home Décor &amp; Artisanal Collections
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', fontSize: '0.95rem' }}>
            Discover handcrafted masterpieces spanning spiritual idols, wooden handicrafts, luxury home accents, and bespoke corporate gifting.
          </p>
        </div>

        {/* Collections Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
          gap: '2rem'
        }}>
          {ALL_COLLECTIONS.map((col, idx) => (
            <Link
              key={idx}
              href={`/shop?category=${col.slug}`}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--primary-gold-border)',
                boxShadow: 'var(--shadow-sm)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column'
              }}
              className="featured-collection-card"
            >
              <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: '#1E1A17' }}>
                <Image
                  src={col.image}
                  alt={`${col.name} — Handcrafted by Anant Arts`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(20,17,15,0.85) 100%)'
                }} />
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text-dark)', margin: 0, fontWeight: '600' }}>
                      {col.name}
                    </h2>
                    <span style={{ fontSize: '1.2rem', color: 'var(--primary-gold)' }}>
                      &rarr;
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                    {col.desc}
                  </p>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--bg-cream-dark)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary-gold-hover)', fontWeight: '600' }}>
                    Browse {col.name} &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Commercial Craftsmanship Section */}
        <div style={{ marginTop: '4rem', padding: '36px', background: 'white', borderRadius: '12px', border: '1px solid var(--primary-gold-border)', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '10px' }}>
            Master Artisan Commission Services
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '700px', margin: '0 auto 24px auto', lineHeight: '1.7' }}>
            Looking for a specific deity posture, large-scale temple installation, or bespoke corporate branding? Our master foundry in Jaipur creates custom commissions to exact proportions.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn-primary btn-md">Browse All Products</Link>
            <Link href="/materials" className="btn-secondary btn-md">Explore Materials</Link>
            <Link href="/occasions" className="btn-secondary btn-md">Shop by Occasion</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
