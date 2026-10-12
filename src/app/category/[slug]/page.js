import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategories, getCategoryBySlug, getProducts } from '@/lib/db-helpers';
import { constructMetadata } from '@/lib/seo';
import ProductCard from '@/components/common/ProductCard';

export const revalidate = 3600;

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');
const PAGE_SIZE = 24;

// Dynamic SEO metadata per category
export async function generateMetadata({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedSearchParams?.page, 10) || 1);
  const category = await getCategoryBySlug(resolvedParams.slug);

  if (!category) {
    return constructMetadata({
      title: 'Category Not Found | Anant Arts',
      description: 'The requested category could not be found.',
      noIndex: true,
    });
  }

  let title = category.seo_title || `${category.name} — Handcrafted Idols & Luxury Décor | Anant Arts`;
  if (page > 1) {
    title = `${category.name} — Page ${page} | Anant Arts`;
  }

  const description = category.seo_description ||
    category.description ||
    `Shop authentic ${category.name} handcrafted by master artisans at Anant Arts. Discover premium 24K gold and silver electroplated items with insured pan-India delivery.`;

  const canonicalUrl = page > 1 
    ? `${BASE_URL}/category/${category.slug}?page=${page}`
    : `${BASE_URL}/category/${category.slug}`;

  const imageUrl = category.banner_path || category.image_path || '/og-image.jpg';

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      absolute: title,
    },
    description,
    keywords: [
      category.name.toLowerCase(),
      `${category.name.toLowerCase()} online`,
      `handcrafted ${category.name.toLowerCase()}`,
      `buy ${category.name.toLowerCase()} india`,
      'anant arts',
      'indian handicrafts',
      '24k gold idols'
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Anant Arts',
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`,
          width: 1200,
          height: 630,
          alt: `${category.name} — Anant Arts`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { slug } = resolvedParams;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams?.page, 10) || 1);

  const [category, categories, products] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
    getProducts({ category: slug })
  ]);

  if (!category) {
    notFound();
  }

  const totalProducts = Array.isArray(products) ? products.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalProducts);
  const rawPageProducts = products.slice(startIndex, endIndex);

  // Performance Optimization: Strip unused heavy fields (like HTML descriptions)
  // to drastically reduce the serialized Server Component flight payload.
  const paginatedProducts = rawPageProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    discount_price: p.discount_price,
    stock_quantity: p.stock_quantity,
    material: p.material,
    tags: p.tags,
    is_bestseller: p.is_bestseller,
    is_new_arrival: p.is_new_arrival,
    category_id: p.category_id,
    category_name: p.category_name || p.categories?.name || category.name || '',
    category_slug: p.category_slug || p.categories?.slug || category.slug || '',
    image_path: p.image_path || (p.images?.[0]?.image_path) || (p.product_images?.[0]?.image_path) || '/images/placeholder.jpg',
    images: p.images || p.product_images || [],
    product_images: p.product_images || p.images || []
  }));

  const canonicalUrl = validPage > 1 
    ? `${BASE_URL}/category/${category.slug}?page=${validPage}`
    : `${BASE_URL}/category/${category.slug}`;

  // Structured Data: CollectionPage & BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Collections', item: `${BASE_URL}/collections` },
      { '@type': 'ListItem', position: 3, name: category.name, item: `${BASE_URL}/category/${category.slug}` },
    ],
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.seo_description || category.description || `Browse handcrafted ${category.name} at Anant Arts.`,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: paginatedProducts.map((p, idx) => ({
        '@type': 'ListItem',
        position: startIndex + idx + 1,
        url: `${BASE_URL}/product/${p.slug}`,
        name: p.name,
      })),
    },
  };

  const otherCategories = categories.filter((c) => c.slug !== category.slug && !c.is_hidden);

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '80vh', padding: '3.5rem 0' }}>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href="/collections" style={{ color: 'inherit', textDecoration: 'none' }}>Collections</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{category.name}</span>
        </nav>

        {/* Category Header Hero */}
        <header className="section-heading" style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <span style={{
            color: 'var(--primary-gold)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontSize: '0.8rem',
            fontWeight: '700'
          }}>
            Artisanal Curation
          </span>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2rem, 4vw, 2.6rem)',
            color: 'var(--text-dark)',
            marginTop: '8px',
            marginBottom: '12px'
          }}>
            {category.name}
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{
            color: 'var(--text-muted)',
            maxWidth: '750px',
            margin: '0 auto',
            fontSize: '0.98rem',
            lineHeight: '1.7'
          }}>
            {category.description ||
              `Discover our exclusive handcrafted ${category.name.toLowerCase()} collection. Master-crafted in Jaipur with pure 24K gold electroplating, seasoned hardwood, and protective baked lacquer coatings.`}
          </p>
        </header>

        {/* Product Count & Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '2rem',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--primary-gold-border)'
        }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Showing <strong>{totalProducts > 0 ? startIndex + 1 : 0}–{endIndex}</strong> of <strong>{totalProducts}</strong> handcrafted {totalProducts === 1 ? 'item' : 'items'}
            {totalPages > 1 && (
              <span style={{ marginLeft: '8px', color: 'var(--primary-gold)', fontWeight: 600 }}>
                (Page {validPage} of {totalPages})
              </span>
            )}
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href={`/shop?category=${category.slug}`} className="btn-secondary btn-sm" style={{ fontSize: '0.78rem' }}>
              <i className="fas fa-sliders-h" style={{ marginRight: '6px' }}></i> Filter Products
            </Link>
          </div>
        </div>

        {/* Products Grid */}
        {paginatedProducts.length > 0 ? (
          <>
            <div
              className="products-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(270px, 100%), 1fr))',
                gap: '2rem',
                marginBottom: '3rem'
              }}
            >
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Crawlable Semantic Pagination Links */}
            {totalPages > 1 && (
              <nav
                aria-label={`Pagination for ${category.name}`}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4.5rem',
                  flexWrap: 'wrap'
                }}
              >
                {/* Previous Page Link */}
                {validPage > 1 ? (
                  <Link
                    href={validPage === 2 ? `/category/${category.slug}` : `/category/${category.slug}?page=${validPage - 1}`}
                    rel="prev"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '44px',
                      height: '44px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--primary-gold-border, #D4A346)',
                      background: 'white',
                      color: 'var(--text-dark, #1A1816)',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '44px',
                      height: '44px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.08)',
                      background: 'rgba(0,0,0,0.03)',
                      color: '#A09890',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: 'not-allowed'
                    }}
                  >
                    ← Previous
                  </span>
                )}

                {/* Page Number Links */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const isCurrent = pageNum === validPage;
                  const pageHref = pageNum === 1 ? `/category/${category.slug}` : `/category/${category.slug}?page=${pageNum}`;

                  return (
                    <Link
                      key={pageNum}
                      href={pageHref}
                      aria-current={isCurrent ? 'page' : undefined}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '44px',
                        height: '44px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: isCurrent ? '2px solid var(--primary-gold, #D4A346)' : '1px solid var(--primary-gold-border, #D4A346)',
                        background: isCurrent ? 'var(--primary-gold, #D4A346)' : 'white',
                        color: isCurrent ? '#FFFFFF' : 'var(--text-dark, #1A1816)',
                        textDecoration: 'none',
                        fontWeight: '700',
                        fontSize: '0.92rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {pageNum}
                    </Link>
                  );
                })}

                {/* Next Page Link */}
                {validPage < totalPages ? (
                  <Link
                    href={`/category/${category.slug}?page=${validPage + 1}`}
                    rel="next"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '44px',
                      height: '44px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--primary-gold-border, #D4A346)',
                      background: 'white',
                      color: 'var(--text-dark, #1A1816)',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Next →
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '44px',
                      height: '44px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.08)',
                      background: 'rgba(0,0,0,0.03)',
                      color: '#A09890',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: 'not-allowed'
                    }}
                  >
                    Next →
                  </span>
                )}
              </nav>
            )}
          </>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid var(--primary-gold-border)',
            padding: '4rem 2rem',
            textAlign: 'center',
            marginBottom: '4rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🪷</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: '8px' }}>
              Artisanal Pieces Coming Soon
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 24px auto' }}>
              Our master sculptors are currently crafting new additions for this collection. Explore all available items in our complete catalog.
            </p>
            <Link href="/shop" className="btn-primary btn-md">Browse Complete Catalog</Link>
          </div>
        )}

        {/* Category Buying & Care Guide */}
        <section style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid var(--primary-gold-border)',
          padding: '36px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '4rem'
        }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--text-dark)', marginBottom: '12px' }}>
            About Our {category.name}
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-dark)', lineHeight: '1.8', marginBottom: '20px' }}>
            At Anant Arts, every piece in our {category.name} collection is created in accordance with sacred Shilpa Shastra canons and traditional metalworking techniques. Whether placed in your home mandir, living room centerpiece, or presented as an auspicious corporate gift, these sculptures are engineered for lifelong beauty.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '24px' }}>
            <div style={{ background: 'var(--bg-cream)', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--primary-gold-hover)', marginBottom: '6px' }}>
                ✨ 24K Gold Electroplating
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Molecular bonding of pure 24K gold micro-layers with high-temperature lacquer bake protection against humidity and tarnishing.
              </p>
            </div>
            <div style={{ background: 'var(--bg-cream)', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--primary-gold-hover)', marginBottom: '6px' }}>
                🛡️ Transit Guarantee
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Shipped in reinforced wooden crates with multi-layer high-density foam chambers and 100% transit insurance.
              </p>
            </div>
            <div style={{ background: 'var(--bg-cream)', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--primary-gold-hover)', marginBottom: '6px' }}>
                🪔 Vastu Alignment
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Crafted with auspicious postures, proportions, and iconographies suitable for home mandirs and executive spaces.
              </p>
            </div>
          </div>
        </section>

        {/* Explore Other Collections / Internal Links */}
        {otherCategories.length > 0 && (
          <section>
            <div className="section-heading" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Explore Other Collections</h2>
              <div className="gold-line" style={{ margin: '6px 0 0 0' }}></div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '3rem'
            }}>
              {otherCategories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  style={{
                    background: 'white',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    border: '1px solid var(--primary-gold-border)',
                    textDecoration: 'none',
                    color: 'var(--text-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                  className="featured-collection-card"
                >
                  <span>{cat.name}</span>
                  <span style={{ color: 'var(--primary-gold)' }}>&rarr;</span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
