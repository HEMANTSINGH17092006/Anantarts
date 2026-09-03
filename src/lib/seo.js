/**
 * Centralized SEO & Structured Metadata Engine for Anant Arts
 * Adheres to dynamic fallback hierarchy:
 * Database Admin SEO -> Entity Data -> Sensible Defaults
 */

const PRODUCTION_DOMAIN = 'https://anantarts.in';
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_DOMAIN).replace(/\/$/, '');

export const SITE_NAME = 'Anant Arts';
export const DEFAULT_TAGLINE = 'Handcrafted Luxury Home Décor & Indian Handicrafts';
export const DEFAULT_DESCRIPTION = 'Buy authentic Indian handicrafts online at Anant Arts. Explore handcrafted home decor, traditional wooden handicrafts, luxury 24K gold electroplated idols, and custom gifts with pan-India delivery.';
export const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;

export const FAQ_DATA = [
  {
    q: 'What is electroplating and how is it different from normal plating?',
    a: 'Electroplating uses electric currents to fuse a micro-layered sheet of pure metallic gold (24K) or sterling silver onto brass/copper casts. This creates a highly durable, uniform coating that mimics pure solid gold, whereas normal plating uses paint or chemicals that flake off quickly.'
  },
  {
    q: 'Will the gold electroplating fade or turn black over time?',
    a: 'No. All Anant Arts sculptures undergo a specialized protective lacquer bake coating process. This shields the precious metals from humidity, moisture, and oxidation, ensuring it retains its high-gloss temple shine for decades without polishing.'
  },
  {
    q: 'What are the cleaning guidelines for these idols?',
    a: 'Simply wipe the idol gently with a dry, clean microfiber cloth. Never wash with water, soaps, or chemical cleaners, and do not use abrasive scrubbers. This will prevent scratches and preserve the lacquer guard.'
  },
  {
    q: 'How are the idols packaged to prevent damage during transit?',
    a: 'Each idol is wrapped in multiple layers of heavy bubble wrap, placed inside dense foam chambers, and reinforced with a heavy wooden crate for shipment. We carry full transit insurance, guaranteeing a free replacement in case of transit damages.'
  },
  {
    q: 'What is your return and refund policy?',
    a: 'Due to the custom craftsmanship and delicate nature of the electroplating process, we only accept returns in the case of transit damage. We ask all patrons to record a complete, unedited unboxing video upon receipt. In case of damages, send us the video within 24 hours to secure a free replacement.'
  },
  {
    q: 'Do you offer cash on delivery (COD)?',
    a: 'Yes, Cash on Delivery is available across major pincodes in India for orders below ₹50,000. For high-value custom temple sculptures, we require a partial advance deposit.'
  },
  {
    q: 'Can I order custom sizes or deity postures for my temple?',
    a: 'Yes. Our Jaipur master foundry accepts bespoke commission requests for custom dimensions ranging from 6 inches to 5 feet. Contact our studio directly via the Corporate & Custom inquiry portal.'
  }
];

/**
 * Construct full metadata object for Next.js App Router
 */
export function constructMetadata({
  title,
  description,
  canonical,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  noIndex = false,
  keywords = [],
  publishedTime,
  modifiedTime,
  authors = [{ name: SITE_NAME, url: BASE_URL }],
} = {}) {
  const metaTitle = title 
    ? (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`)
    : `${SITE_NAME} — ${DEFAULT_TAGLINE}`;

  const metaDesc = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = canonical 
    ? (canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical.startsWith('/') ? canonical : `/${canonical}`}`)
    : BASE_URL;

  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image.startsWith('/') ? image : `/${image}`}`;

  const defaultKeywords = [
    'electroplated idols',
    'hindu god idols',
    '24k gold ganesh idol',
    'silver krishna murti',
    'luxury pooja items',
    'premium god statues',
    'anant arts',
    'brass idols india',
    'jaipur artisan sculptures',
    'buy hindu idols online',
    'temple decor',
    'corporate gifts divine'
  ];

  const mergedKeywords = Array.from(new Set([...keywords, ...defaultKeywords]));

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      absolute: metaTitle,
    },
    description: metaDesc,
    keywords: mergedKeywords,
    authors,
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDesc,
      images: [imageUrl],
      creator: '@anantarts',
    },
    robots: {
      index: !noIndex,
      follow: true,
      googleBot: {
        index: !noIndex,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Generate BreadcrumbList JSON-LD Schema
 */
export function generateBreadcrumbSchema(items = []) {
  const itemListElement = Array.isArray(items) ? items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url.startsWith('/') ? item.url : `/${item.url}`}`,
  })) : [];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

/**
 * Generate FAQPage JSON-LD Schema
 */
export function generateFaqSchema(faqs = FAQ_DATA) {
  const list = Array.isArray(faqs) ? faqs : FAQ_DATA;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: list.map((faq) => ({
      '@type': 'Question',
      name: faq.q || faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a || faq.answer,
      },
    })),
  };
}
