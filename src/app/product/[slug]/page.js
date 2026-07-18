import Link from 'next/link';
import { getProductBySlug, getRelatedProducts } from '@/lib/db-helpers';
import { createClient } from '@/lib/supabase/server';
import ProductGallery from '@/components/product/ProductGallery';
import ProductReviews from '@/components/product/ProductReviews';
import ProductCard from '@/components/common/ProductCard';
import { formatPrice } from '@/lib/utils';
import AddToCartButton from '@/components/product/AddToCartButton';
import RecentlyViewed, { RecentlyViewedLogger } from '@/components/common/RecentlyViewed';
import FrequentlyBoughtTogether from '@/components/product/FrequentlyBoughtTogether';

export const revalidate = 60; // Dynamic pages revalidated hourly or by tag

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

// Dynamic SEO Metadata per product page
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);
  if (!product) {
    return {
      title: 'Product Not Found | Anant Arts',
      description: 'The requested idol could not be found.',
    };
  }

  const activePrice = product.discount_price && product.discount_price > 0
    ? product.discount_price
    : product.price;

  const title = product.seo_title || `${product.name} | Anant Arts`;
  const description = product.seo_description ||
    (product.description ? product.description.slice(0, 160) : `Buy ${product.name} — premium 24K gold electroplated divine idol.`);

  const primaryImage = product.images?.[0]?.image_path || `${BASE_URL}/og-image.jpg`;
  const canonicalUrl = `${BASE_URL}/product/${product.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'product',
      images: [{ url: primaryImage.startsWith('http') ? primaryImage : `${BASE_URL}${primaryImage}`, width: 800, height: 800, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [primaryImage.startsWith('http') ? primaryImage : `${BASE_URL}${primaryImage}`],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  // Await params as required in Next.js 15+
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const product = await getProductBySlug(slug);

  if (!product) {
    return (
      <div style={{ background: 'var(--bg-cream)', padding: '5rem 0', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🪷</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '8px' }}>Idol Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>We could not find the divine representation you are looking for.</p>
          <Link href="/shop" className="btn-gold">Browse Catalog</Link>
        </div>
      </div>
    );
  }

  // Fetch reviews from Supabase directly
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', product.id)
    .eq('is_approved', 1)
    .order('created_at', { ascending: false });

  // Fetch related products
  const relatedProducts = await getRelatedProducts(product.id, product.category_id);

  // Parse tags
  let tags = [];
  try {
    if (product.tags) {
      tags = typeof product.tags === 'string' ? JSON.parse(product.tags) : product.tags;
    }
  } catch (e) {
    if (typeof product.tags === 'string') {
      tags = product.tags.split(',').map(t => t.trim());
    }
  }

  const canonicalUrl = `${BASE_URL}/product/${product.slug}`;
  const primaryImage = product.images?.[0]?.image_path || '';
  const avgRating = reviews?.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // Product JSON-LD Schema
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    sku: product.sku,
    brand: { '@type': 'Brand', name: 'Anant Arts' },
    image: primaryImage.startsWith('http') ? primaryImage : `${BASE_URL}${primaryImage}`,
    url: canonicalUrl,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: activePrice,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Anant Arts', url: BASE_URL },
    },
    ...(avgRating && reviews?.length > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(product.material && { material: product.material }),
  };

  // BreadcrumbList JSON-LD Schema
  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Shop', item: `${BASE_URL}/shop` },
  ];
  if (product.categories) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: product.categories.name,
      item: `${BASE_URL}/shop?category=${product.categories.slug}`,
    });
    breadcrumbItems.push({ '@type': 'ListItem', position: 4, name: product.name, item: canonicalUrl });
  } else {
    breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: product.name, item: canonicalUrl });
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <RecentlyViewedLogger product={product} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Breadcrumb */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          <Link href="/">Home</Link> &nbsp;/&nbsp;&nbsp;
          <Link href="/shop">Shop</Link> &nbsp;/&nbsp;&nbsp;
          {product.categories && (
            <>
              <Link href={`/shop?category=${product.categories.slug}`}>{product.categories.name}</Link> &nbsp;/&nbsp;&nbsp;
            </>
          )}
          <span style={{ color: 'var(--text-dark)' }}>{product.name}</span>
        </div>

        {/* Core Detail Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'flex-start', marginBottom: '4rem' }}>
          
          {/* Left Column: Image Gallery */}
          <div>
            <ProductGallery images={product.images || []} />
          </div>

          {/* Right Column: Info details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              {product.categories && (
                <span className="category-label">{product.categories.name}</span>
              )}
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', margin: '6px 0 12px 0', lineHeight: '1.3' }}>
                {product.name}
              </h1>
              
              {/* Reviews brief summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '2px', color: 'var(--primary-gold)' }}>
                  {Array.from({ length: 5 }).map((_, i) => {
                    const avg = reviews?.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 5;
                    return <i key={i} className={i < Math.round(avg) ? "fas fa-star" : "far fa-star"}></i>;
                  })}
                </div>
                <span style={{ color: 'var(--text-muted)' }}>({reviews?.length || 0} customer reviews)</span>
              </div>
            </div>

            {/* Price section */}
            <div className="product-price" style={{ borderBottom: '1px solid var(--primary-gold-border)', paddingBottom: '1.25rem' }}>
              <span className="current" style={{ fontSize: '1.75rem' }}>{formatPrice(activePrice)}</span>
              {product.discount_price > 0 && (
                <span className="original" style={{ fontSize: '1.25rem' }}>{formatPrice(product.price)}</span>
              )}
              {product.discount_price > 0 && (
                <span className="discount" style={{ fontSize: '0.9rem', padding: '2px 8px', backgroundColor: 'var(--primary-gold-light)', borderRadius: '4px' }}>
                  Save {Math.round(((product.price - product.discount_price) / product.price) * 100)}%
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px' }}>Description</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                {product.description}
              </p>
            </div>

            {/* Variants Selector */}
            {(() => {
              let variants = [];
              try {
                if (product.variants) {
                  variants = typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants;
                }
              } catch (e) {
                console.error('Error parsing product variants:', e);
              }
              if (variants.length === 0) return null;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '600', margin: 0, color: 'var(--text-dark)' }}>Select Options</h4>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {variants.map((v, i) => (
                      <div key={i} style={{ flex: '1 1 120px' }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>{v.name}</label>
                        <select style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.82rem', background: 'white', cursor: 'pointer' }}>
                          {v.options.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Customization Engraving Box */}
            {product.customization_option && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-dark)', display: 'block' }}>Customization Message (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Engrave name or custom message here"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                  <i className="fas fa-info-circle" style={{ color: 'var(--primary-gold)', marginRight: '4px' }}></i>
                  {product.customization_option}
                </p>
              </div>
            )}

            {/* Bulk wholesale pricing */}
            {product.bulk_pricing && (
              <div style={{ background: '#fff9f0', border: '1px dashed var(--primary-gold)', borderRadius: '8px', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.4rem' }}>💼</span>
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary-gold-hover)', margin: '0 0 3px' }}>Wholesale B2B / Bulk Discount</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-dark)', margin: 0, lineHeight: '1.4' }}>{product.bulk_pricing}</p>
                </div>
              </div>
            )}

            {/* Specifications Card */}
            <div style={{ background: 'white', border: '1px solid var(--primary-gold-border)', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '12px' }}>Specifications</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.8rem' }}>
                <div><strong>Material:</strong> {product.material || 'Premium Brass & 24K Gold'}</div>
                {product.finish_type && <div><strong>Finish Type:</strong> {product.finish_type}</div>}
                <div><strong>SKU Code:</strong> {product.sku}</div>
                <div><strong>Dimensions:</strong> {product.dimensions || 'N/A'}</div>
                <div><strong>Weight:</strong> {product.weight ? `${product.weight} kg` : 'N/A'}</div>
                <div>
                  <strong>Stock:</strong>&nbsp; 
                  <span style={{ color: product.stock_quantity > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                    {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity} available)` : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Buy Buttons */}
            <AddToCartButton product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              discount_price: product.discount_price,
              image_path: product.images?.[0]?.image_path || '/images/placeholder.jpg',
              sku: product.sku,
              stock_quantity: product.stock_quantity
            }} />

            {/* Trust assurances */}
            <div style={{ borderTop: '1px solid var(--primary-gold-border)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-around', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <div><i className="fas fa-shield-alt" style={{ color: 'var(--primary-gold)', marginRight: '4px' }}></i> Safe Insured Delivery</div>
              <div><i className="fas fa-undo" style={{ color: 'var(--primary-gold)', marginRight: '4px' }}></i> Video Unbox Guarantee</div>
              <div><i className="fas fa-truck" style={{ color: 'var(--primary-gold)', marginRight: '4px' }}></i> Shipped in 24-48 Hours</div>
            </div>
          </div>
        </div>

        <FrequentlyBoughtTogether currentProduct={product} bundleProduct={relatedProducts[0]} />

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: '5rem' }}>
            <div className="section-heading" style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.6rem' }}>Related Products</h2>
              <div className="gold-line" style={{ margin: '8px 0 0 0' }}></div>
            </div>
            <div className="products-grid" style={{ padding: 0, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Patron Reviews Component */}
        <ProductReviews productId={product.id} initialReviews={reviews || []} />

        {/* Recently Viewed Carousel */}
        <RecentlyViewed currentProductId={product.id} />

      </div>
    </div>
  );
}
