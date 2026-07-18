import './globals.css';
import AppLayout from '@/components/layout/AppLayout';
import { getSettings } from '@/lib/db-helpers';
import { Playfair_Display, Poppins } from 'next/font/google';
import Script from 'next/script';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
});

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

export async function generateMetadata() {
  const settings = await getSettings();
  const siteName = settings.site_name || 'Anant Arts';
  const tagline = settings.site_tagline || 'Bringing Divine Art to Every Home';
  const seoTitle = settings.seo_title || `${siteName} — Premium Electroplated Hindu God Idols | 24K Gold & Silver`;
  const seoDescription = settings.seo_description || `${siteName} offers luxury electroplated idols of Hindu gods and goddesses. Handcrafted with 24K Gold, Sterling Silver, and Copper plating. ${tagline}.`;
  const gscVerification = process.env.NEXT_PUBLIC_GSC_VERIFICATION;

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: seoTitle,
      template: `%s | ${siteName}`,
    },
    description: seoDescription,
    keywords: [
      'electroplated idols', 'hindu god idols', 'gold plated ganesh', 'silver krishna statue',
      'luxury pooja items', 'premium god statues', 'anant arts', '24k gold idol',
      'divine sculptures', 'brass idols india', 'buy god idols online',
    ],
    authors: [{ name: siteName, url: BASE_URL }],
    creator: siteName,
    publisher: siteName,

    // Canonical URL
    alternates: {
      canonical: BASE_URL,
    },

    // Open Graph tags
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: BASE_URL,
      siteName: siteName,
      type: 'website',
      locale: 'en_IN',
      images: [
        {
          url: `${BASE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `${siteName} — Premium Electroplated Hindu God Idols`,
        },
      ],
    },

    // Twitter / X Card tags
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [`${BASE_URL}/og-image.jpg`],
    },

    // PWA / App manifest
    manifest: '/manifest.json',

    // Google Search Console verification
    ...(gscVerification && {
      verification: {
        google: gscVerification,
      },
    }),

    // Robots directives
    robots: {
      index: true,
      follow: true,
      nocache: false,
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

// Organization + Website JSON-LD Schema
function OrganizationSchema({ settings }) {
  const siteName = settings?.site_name || 'Anant Arts';
  const contactPhone = settings?.contact_phone || '+91 72758 19354';
  const contactEmail = settings?.contact_email || 'anantarts39@gmail.com';
  const contactAddress = settings?.contact_address || 'Bhoirwadi, Dombivli East, Maharashtra, India';

  let socialLinks = {};
  try {
    if (settings?.social_links) {
      socialLinks = typeof settings.social_links === 'string'
        ? JSON.parse(settings.social_links)
        : settings.social_links;
    }
  } catch (e) {}

  const sameAs = [
    socialLinks.instagram,
    socialLinks.facebook,
    socialLinks.youtube,
  ].filter(Boolean);

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: siteName,
        url: BASE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/og-image.jpg`,
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: contactPhone,
          email: contactEmail,
          contactType: 'customer service',
          areaServed: 'IN',
          availableLanguage: ['English', 'Hindi'],
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: contactAddress,
          addressCountry: 'IN',
        },
        sameAs,
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: siteName,
        publisher: { '@id': `${BASE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${BASE_URL}/shop?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Google Analytics Script Component
function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!gaId || gaId === 'G-XXXXXXXXXX') return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          `,
        }}
      />
    </>
  );
}

// Microsoft Clarity Script Component
function MicrosoftClarity() {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  if (!clarityId || clarityId === 'your_clarity_project_id') return null;

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityId}");
        `,
      }}
    />
  );
}

export default async function RootLayout({ children }) {
  const settings = await getSettings();

  return (
    <html lang="en">
      <head>
        {/* Font Awesome Icons CDN */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        {/* PWA Theme Color */}
        <meta name="theme-color" content="#D4AF37" />
        {/* Organization + Website Schema */}
        <OrganizationSchema settings={settings} />
      </head>
      <body className={`${playfair.variable} ${poppins.variable}`}>
        <AppLayout settings={settings}>
          {children}
        </AppLayout>
        {/* Analytics Scripts (loaded after interactive) */}
        <GoogleAnalytics />
        <MicrosoftClarity />
      </body>
    </html>
  );
}
