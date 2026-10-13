import Link from 'next/link';

export const metadata = {
  title: {
    absolute: 'Page Not Found (404) | Anant Arts',
  },
  description: 'The divine page or handcrafted idol you are searching for could not be found.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, var(--bg-cream, #FFFDF8) 0%, #F8F4EC 100%)',
      padding: '4rem 1.5rem',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        padding: '3rem 2rem',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(212, 163, 70, 0.25)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          fontSize: '3.5rem',
          lineHeight: 1,
          marginBottom: '1rem',
          filter: 'drop-shadow(0 4px 12px rgba(212, 163, 70, 0.3))'
        }}>
          🪷
        </div>
        <p style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: 'var(--color-gold, #D4A346)',
          marginBottom: '0.5rem'
        }}>
          Error 404 — Not Found
        </p>
        <h1 style={{
          fontFamily: 'var(--font-heading, "Cinzel", serif)',
          fontSize: '2.25rem',
          fontWeight: 700,
          color: '#1A1816',
          marginBottom: '1rem'
        }}>
          Divine Path Not Found
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#66615B',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}>
          The divine idol, sacred article, or page you are looking for may have been moved, renamed, or is currently unavailable in our sanctum.
        </p>
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link
            href="/"
            className="btn-gold"
            style={{
              display: 'inline-block',
              padding: '0.85rem 1.75rem',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            Return to Sanctum
          </Link>
          <Link
            href="/shop"
            style={{
              display: 'inline-block',
              padding: '0.85rem 1.75rem',
              borderRadius: '8px',
              fontWeight: 600,
              color: '#1A1816',
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.12)',
              textDecoration: 'none'
            }}
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
