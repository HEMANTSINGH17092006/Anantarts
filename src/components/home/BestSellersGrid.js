import ProductCard from '../common/ProductCard';

export default function BestSellersGrid({ products = [] }) {
  if (!products || products.length === 0) return null;

  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--section-padding-y) 2rem 0 2rem' }}>
      <div className="section-heading" style={{ marginTop: 0, marginBottom: '2.5rem' }}>
        <h2>Best Sellers</h2>
        <div className="gold-line"></div>
        <p>Our most treasured handcrafted creations adored in luxury homes and corporate spaces worldwide.</p>
      </div>

      <div className="products-grid" style={{ padding: 0 }}>
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
