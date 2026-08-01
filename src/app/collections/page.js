import Link from 'next/link';
import Image from 'next/image';
import { getCategories } from '@/lib/db-helpers';

export const metadata = {
  title: 'All Collections | Anant Arts Luxury Marketplace',
  description: 'Explore our complete range of handcrafted collections including Spiritual Art, Wooden Handicrafts, Home Décor, Corporate Gifts, and Festive Specials.',
};

export default async function CollectionsPage() {
  const categories = await getCategories();

  const ALL_COLLECTIONS = [
    { name: 'Spiritual Collection', icon: '✨', slug: 'spiritual-collection', image: '/uploads/category-spiritual-collection.png', desc: 'Divine 24K gold and pure silver electroplated idols & sacred art.' },
    { name: 'Wooden Handicrafts', icon: '🪵', slug: 'wooden-handicrafts', image: '/uploads/category-wooden-handicrafts.png', desc: 'Handcrafted wooden décor and timeless artisan creations for elegant homes.' },
    { name: 'Home Décor', icon: '🏡', slug: 'home-decor', image: '/uploads/category-home-decor.png', desc: 'High-lustre table accents, luxury vases, showpieces & wall art.' },
    { name: 'Corporate Gifts', icon: '🎁', slug: 'corporate-gifts', image: '/uploads/category-corporate-gifts.png', desc: 'Executive desk organizers, logo plaques & bulk corporate hampers.' },
    { name: 'Festival Collection', icon: '🎉', slug: 'festival-collection', image: '/uploads/category-festive-gifts.png', desc: 'Diwali, Ganesh Chaturthi & seasonal celebration specials.' },
    { name: 'Office Collection', icon: '🏢', slug: 'office-decor', image: '/uploads/category-office-decor.png', desc: 'Professional workspace accents, clock plaques & motivational art.' },
    { name: 'Decorative Items', icon: '🕯', slug: 'decorative-items', image: '/uploads/category-decorative-figurines.png', desc: 'Intricate figurines, candle holders & decorative showpieces.' },
    { name: 'Living Collection', icon: '🛋', slug: 'living-collection', image: '/uploads/category-premium-collectibles.png', desc: 'Statement centerpiece art for luxury living rooms & foyers.' },
    { name: 'Customized Gifts', icon: '🎨', slug: 'customized-gifts', image: '/uploads/category-customized-products.png', desc: 'Bespoke personalized gifts crafted to your exact specifications.' }
  ];

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '80vh', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Artisanal Portfolio
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--text-dark)', marginTop: '6px', marginBottom: '12px' }}>
            Explore Our Collections
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem' }}>
            Discover handcrafted masterpieces spanning spiritual idols, wooden handicrafts, luxury home décor, and bespoke gifting.
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
              className="category-card-hover"
            >
              <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: '#1E1A17' }}>
                <Image
                  src={col.image}
                  alt={col.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(20,17,15,0.7) 100%)'
                }} />
                <span style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  fontSize: '1.6rem',
                  background: 'rgba(255,255,255,0.9)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {col.icon}
                </span>
              </div>

              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text-dark)', margin: '0 0 8px 0', fontWeight: '600' }}>
                    {col.name}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                    {col.desc}
                  </p>
                </div>
                <span className="btn-gold" style={{ fontSize: '0.8rem', padding: '10px 16px', justifyContent: 'center' }}>
                  Browse {col.name} &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
