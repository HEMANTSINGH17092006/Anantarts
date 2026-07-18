import Link from 'next/link';
import { getBlogBySlug } from '@/lib/db-helpers';

export const revalidate = 3600; // Cache individual blogs for 1 hour

export default async function BlogDetailPage({ params }) {
  // Await params as required in Next.js 15+
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return (
      <div style={{ background: 'var(--bg-cream)', padding: '5rem 0', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✍️</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '8px' }}>Article Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>We could not find the blog article you are looking for.</p>
          <Link href="/blog" className="btn-gold">Back to Blogs</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <article style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Breadcrumb */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          <Link href="/">Home</Link> &nbsp;/&nbsp;&nbsp;
          <Link href="/blog">Blogs</Link> &nbsp;/&nbsp;&nbsp;
          <span style={{ color: 'var(--text-dark)' }}>{blog.title}</span>
        </div>

        {/* Blog header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '10px', lineHeight: '1.25' }}>
            {blog.title}
          </h1>
          <div style={{ fontSize: '0.85rem', color: 'var(--primary-gold-hover)', fontWeight: '600' }}>
            Published: {new Date(blog.publish_date || blog.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Featured Image */}
        {blog.featured_image && (
          <div style={{ marginBottom: '2.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--primary-gold-border)' }}>
            <img src={blog.featured_image} alt={blog.title} style={{ width: '100%', height: 'auto', maxHeight: '450px', objectFit: 'cover' }} />
          </div>
        )}

        {/* Content Body */}
        <div 
          style={{ 
            background: 'white', 
            padding: '40px', 
            borderRadius: '8px', 
            border: '1px solid var(--primary-gold-border)',
            boxShadow: 'var(--shadow-sm)',
            fontSize: '1rem',
            lineHeight: '1.8',
            color: 'var(--text-dark)'
          }}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Back Link */}
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <Link href="/blog" className="btn-outline-gold">
            <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> Back to All Articles
          </Link>
        </div>

      </article>
    </div>
  );
}
