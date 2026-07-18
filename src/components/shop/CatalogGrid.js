'use client';
import { useSearchParams } from 'next/navigation';
import { useWishlist } from '../context/AppContext';
import ProductCard from '../common/ProductCard';

export default function CatalogGrid({ initialProducts = [] }) {
  const searchParams = useSearchParams();
  const { wishlist } = useWishlist();
  const isWishlistView = searchParams.get('wishlist') === 'true';

  const displayedProducts = isWishlistView ? wishlist : initialProducts;

  if (displayedProducts.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '80px 20px',
        background: 'white',
        border: '1px solid var(--primary-gold-border)',
        borderRadius: '8px',
        width: '100%'
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>🪷</div>
        {isWishlistView ? (
          <>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '8px' }}>Your Wishlist is Empty</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tap the heart icon on any idol to add it to your wishlist.</p>
          </>
        ) : (
          <>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '8px' }}>No Idols Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try clearing some filters or searching for another deity.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '0 8px'
      }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Showing <strong>{displayedProducts.length}</strong> {displayedProducts.length === 1 ? 'idol' : 'idols'}
          {isWishlistView && ' in your wishlist'}
        </p>
      </div>

      <div className="products-grid" style={{
        padding: 0,
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1.5rem'
      }}>
        {displayedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
