import Link from 'next/link';
import { getBlogs } from '@/lib/db-helpers';

export const revalidate = 3600; // Cache blog listing for up to 1 hour

export default async function BlogListingPage() {
  const blogs = await getBlogs();

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        
        <div className="section-heading" style={{ marginBottom: '3.5rem' }}>
          <h2>Artisan Blogs & Temple Vastu</h2>
          <div className="gold-line"></div>
          <p>Read about Jaipur sculpting lineages, electroplating chemistry, and placement guidelines for Hindu temples.</p>
        </div>

        {blogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
            <span style={{ fontSize: '3rem' }}>✍️</span>
            <h3 style={{ marginTop: '12px' }}>No Blog Articles Yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Check back soon for insights on divine Indian crafts.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {blogs.map((blog) => (
              <div 
                key={blog.id} 
                style={{ 
                  background: 'white', 
                  borderRadius: '8px', 
                  border: '1px solid var(--primary-gold-border)', 
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <img 
                    src={blog.featured_image || '/uploads/blog-placeholder.jpg'} 
                    alt={blog.title} 
                    style={{ width: '100%', height: '220px', objectFit: 'cover' }} 
                  />
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem', color: 'var(--primary-gold)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>
                      <span>
                        {new Date(blog.publish_date || blog.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 style={{ 
                      fontSize: '1.25rem', 
                      fontFamily: 'var(--font-heading)', 
                      margin: '0 0 10px 0', 
                      height: '56px', 
                      overflow: 'hidden' 
                    }}>{blog.title}</h3>
                    <p style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--text-muted)', 
                      lineHeight: '1.6', 
                      height: '75px', 
                      overflow: 'hidden' 
                    }}>{blog.short_desc}</p>
                  </div>
                </div>

                <div style={{ padding: '0 24px 24px 24px' }}>
                  <Link href={`/blog/${blog.slug}`} className="btn-outline-gold" style={{ width: '100%', padding: '8px', fontSize: '0.8rem', justifyContent: 'center' }}>
                    Read Article <i className="fas fa-book-open" style={{ marginLeft: '6px' }}></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
