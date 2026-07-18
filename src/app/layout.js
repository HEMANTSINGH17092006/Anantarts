import './globals.css';
import AppLayout from '@/components/layout/AppLayout';
import { getSettings } from '@/lib/db-helpers';
import { Playfair_Display, Poppins } from 'next/font/google';

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

export async function generateMetadata() {
  const settings = await getSettings();
  const siteName = settings.site_name || 'Anant Arts';
  const tagline = settings.site_tagline || 'Bringing Divine Art to Every Home';

  return {
    title: `${siteName} — Premium Electroplated Hindu God Idols | 24K Gold & Silver`,
    description: `${siteName} offers luxury electroplated idols of Hindu gods and goddesses. Handcrafted with 24K Gold, Sterling Silver, and Copper plating. ${tagline}.`,
    keywords: 'electroplated idols, hindu god idols, gold plated ganesh, silver krishna, luxury pooja items, premium god statues, anant arts',
    openGraph: {
      title: `${siteName} — ${tagline}`,
      description: `Premium electroplated idols of Hindu gods and goddesses. 24K Gold, Silver & Copper plating.`,
      type: 'website',
    },
  };
}

export default async function RootLayout({ children }) {
  const settings = await getSettings();

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={`${playfair.variable} ${poppins.variable}`}>
        <AppLayout settings={settings}>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
