import Link from 'next/link';
import { getBlogs } from '@/lib/db-helpers';
import { constructMetadata } from '@/lib/seo';

export const revalidate = 3600; // Cache blog listing for up to 1 hour

export const metadata = constructMetadata({
  title: 'Artisan Blog & Temple Vastu Guides | Anant Arts',
  description: 'Read expert articles on Hindu temple deity placement, Jaipur sculpting lineages, 24K gold electroplating maintenance, and sacred Vastu Shastra decor.',
  canonical: '/blog',
});

export default async function BlogListingPage() {
  const blogs = await getBlogs();

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Semantic H1 Header */}
        <div className="section-heading" style={{ marginBottom: '3.5rem' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Wisdom &amp; Craftsmanship
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            Artisan Blogs &amp; Temple Vastu
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', fontSize: '0.95rem' }}>
            Read about Jaipur sculpting lineages, electroplating chemistry, and authentic placement guidelines for home mandirs and office sanctuaries.
          </p>
        </div>

        {blogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid var(--primary-gold-border)' }}>
            <span style={{ fontSize: '3rem' }}>✍️</span>
            <h3 style={{ marginTop: '12px', fontFamily: 'var(--font-heading)' }}>Artisan Journal in Preparation</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px', margin: '8px auto 24px auto' }}>
              Our Jaipur studio historians are compiling in-depth guides on deity symbolism, 24K electroplating techniques, and festive puja rituals.
            </p>
            <Link href="/shop" className="btn-primary btn-md">Explore Sacred Idols</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '2rem' }}>
            {blogs.map((blog) => (
              <article 
                key={blog.id} 
                style={{ 
                  background: 'white', 
                  borderRadius: '12px', 
                  border: '1px solid var(--primary-gold-border)', 
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div>
                  <img 
                    src={blog.featured_image || '/uploads/category-spiritual-collection.png'} 
                    alt={blog.title} 
                    style={{ width: '100%', height: '220px', objectFit: 'cover' }} 
                  />
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: 'var(--color-text-accent, #8C6D1F)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>
                      <span>
                        {new Date(blog.publish_date || blog.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 style={{ 
                      fontSize: '1.25rem', 
                      fontFamily: 'var(--font-heading)', 
                      margin: '0 0 10px 0', 
                      color: 'var(--color-text-primary, #1A1918)',
                      lineHeight: '1.4'
                    }}>
                      <Link href={`/blog/${blog.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {blog.title}
                      </Link>
                    </h2>
                    <p style={{ 
                      fontSize: '0.88rem', 
                      color: 'var(--color-text-muted, #6B655B)', 
                      lineHeight: '1.6', 
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {blog.excerpt || (blog.content ? blog.content.replace(/<[^>]+>/g, '').slice(0, 140) + '...' : '')}
                    </p>
                  </div>
                </div>
                
                <div style={{ padding: '0 24px 24px 24px' }}>
                  <Link 
                    href={`/blog/${blog.slug}`} 
                    style={{ 
                      color: 'var(--primary-gold-hover)', 
                      fontSize: '0.85rem', 
                      fontWeight: '600', 
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    Read Journal Article &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Commercial Internal Linking Section */}
        <div style={{ marginTop: '4rem', padding: '32px', background: 'white', borderRadius: '12px', border: '1px solid var(--primary-gold-border)', textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '8px' }}>
            Bring Divine Grace to Your Home
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto 20px auto' }}>
            Explore our handcrafted collection of 24K gold and pure silver electroplated idols made with authentic lost-wax techniques.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn-primary btn-md">Shop All Idols</Link>
            <Link href="/collections" className="btn-secondary btn-md">Explore Collections</Link>
            <Link href="/materials" className="btn-secondary btn-md">Materials Guide</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
