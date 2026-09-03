import Link from 'next/link';
import { getBlogs } from '@/lib/db-helpers';
import { constructMetadata } from '@/lib/seo';

export const revalidate = 3600; // Cache blog listing for up to 1 hour

export const metadata = constructMetadata({
  title: 'Artisan Blog & Temple Vastu Guides | Anant Arts',
  description: 'Read expert articles on Hindu temple deity placement, Jaipur sculpting lineages, 24K gold electroplating maintenance, and sacred Vastu Shastra decor.',
  canonical: '/blog',
});

const FOUNDATIONAL_GUIDES = [
  {
    title: 'The Sacred Science of 24K Gold Electroplating in Temple Statuary',
    category: 'Artisanal Metallurgy',
    readTime: '6 min read',
    excerpt: 'Explore how traditional Jaipur lost-wax brass sculpting fuses with modern multi-stage electro-deposition. Discover why molecular 24K gold bonding outlasts conventional gold foil leafing without tarnishing or peeling.',
    link: '/materials',
    ctaText: 'Explore Materials \u2192'
  },
  {
    title: 'Vastu Shastra Deity Orientation: Harmonizing Your Home Mandir',
    category: 'Vastu & Spirituality',
    readTime: '8 min read',
    excerpt: 'Detailed shastra guidelines on sanctifying Lord Ganesha in the northeast corner (Ishanya), positioning Goddess Lakshmi for prosperity, and setting up Radha Krishna idols for domestic harmony.',
    link: '/consultation',
    ctaText: 'Book a Consultation \u2192'
  },
  {
    title: 'Sacred Gifting Etiquette: Selecting Auspicious Idols for Milestones',
    category: 'Gifting Traditions',
    readTime: '5 min read',
    excerpt: 'A comprehensive curation guide for Griha Pravesh housewarmings, wedding keepsakes, and executive corporate honors. Learn the spiritual blessings behind each sacred posture and material medium.',
    link: '/occasions',
    ctaText: 'Explore Occasions \u2192'
  }
];

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
            Artisan Blogs &amp; Temple Vastu Guides
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', fontSize: '0.95rem' }}>
            Read authoritative guides on Jaipur sculpting lineages, electroplating metallurgy, and authentic placement guidelines for home mandirs and office sanctuaries.
          </p>
        </div>

        {blogs && blogs.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '2rem', marginBottom: '4rem' }}>
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
                    className="btn-outline-gold"
                    style={{ fontSize: '0.8rem', padding: '8px 18px', display: 'inline-block' }}
                  >
                    Read Article &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {/* Foundational Knowledge Guides Section */}
        <div style={{ background: 'white', border: '1px solid var(--primary-gold-border)', borderRadius: '12px', padding: '36px', boxShadow: 'var(--shadow-sm)', marginTop: blogs && blogs.length > 0 ? '3rem' : 0 }}>
          <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <span style={{ color: 'var(--primary-gold)', letterSpacing: '1.5px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700' }}>
              Foundational Editorial Series
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginTop: '4px', marginBottom: '8px', color: 'var(--text-dark)' }}>
              Essential Mandir Wisdom &amp; Metallurgical Insights
            </h2>
            <div className="gold-line" style={{ margin: '0 0 16px 0' }}></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
            {FOUNDATIONAL_GUIDES.map((guide, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'var(--bg-cream)',
                  borderRadius: '10px',
                  padding: '24px',
                  border: '1px solid var(--primary-gold-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--primary-gold)', letterSpacing: '1px' }}>
                      {guide.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{guide.readTime}</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--text-dark)', marginBottom: '10px', lineHeight: '1.4' }}>
                    {guide.title}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                    {guide.excerpt}
                  </p>
                </div>
                <div>
                  <Link href={guide.link} className="btn-secondary btn-sm" style={{ display: 'inline-block' }}>
                    {guide.ctaText}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2.5rem', textAlign: 'center', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '24px', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn-primary btn-md">Browse Handcrafted Catalog</Link>
            <Link href="/materials" className="btn-secondary btn-md">Explore All Materials</Link>
            <Link href="/consultation" className="btn-secondary btn-md">Book Mandir Consultation</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
