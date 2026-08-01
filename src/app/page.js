import { 
  getSettings, 
  getProducts, 
  getCategories,
  getTestimonials
} from '@/lib/db-helpers';

// Import Core Homepage Components
import HeroBanner from '@/components/home/HeroBanner';
import ShopByCategory from '@/components/home/ShopByCategory';
import NewArrivalsSlider from '@/components/home/NewArrivalsSlider';
import BestSellersGrid from '@/components/home/BestSellersGrid';
import TrendingCarousel from '@/components/home/TrendingCarousel';
import CorporateShowcase from '@/components/home/CorporateShowcase';
import SpiritualStorySection from '@/components/home/SpiritualStorySection';
import TabbedCollectionShowcase from '@/components/home/TabbedCollectionShowcase';
import FaqAccordion from '@/components/home/FaqAccordion';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import CustomerReviews from '@/components/home/CustomerReviews';
import InstagramGallery from '@/components/home/InstagramGallery';
import LuxuryNewsletter from '@/components/home/LuxuryNewsletter';
import NewsletterExitModals from '@/components/home/NewsletterExitModals';
import BulkEnquiryBanner from '@/components/home/BulkEnquiryBanner';

export const revalidate = 3600; // Cache home page for up to 1 hour

export default async function Home() {
  // Fetch active categories and testimonials directly from Database
  const [categories, testimonials, rawBestsellers, rawNewArrivals, allFeatured] = await Promise.all([
    getCategories(),
    getTestimonials(),
    getProducts({ tag: 'Best Seller', limit: 8 }),
    getProducts({ tag: 'New Arrival', limit: 12 }),
    getProducts({ limit: 24 })
  ]);

  // 1. Best Sellers Dataset
  const bestsellerList = rawBestsellers.length > 0 ? rawBestsellers : allFeatured.slice(0, 8);
  const bestsellerIds = new Set(bestsellerList.map(p => p.id));

  // 2. New Arrivals Dataset (Deduplicated against Best Sellers)
  const uniqueNewArrivals = rawNewArrivals.filter(p => !bestsellerIds.has(p.id));
  const finalNewArrivals = uniqueNewArrivals.length >= 4 
    ? uniqueNewArrivals 
    : allFeatured.filter(p => !bestsellerIds.has(p.id)).slice(0, 8);
  const newArrivalIds = new Set(finalNewArrivals.map(p => p.id));

  // 3. Trending Dataset (Deduplicated against Best Sellers & New Arrivals)
  const uniqueTrending = allFeatured.filter(p => !bestsellerIds.has(p.id) && !newArrivalIds.has(p.id));
  const finalTrending = uniqueTrending.length >= 4 ? uniqueTrending : allFeatured.slice(8, 16);

  return (
    <>
      {/* 1. GRAND FULL-WIDTH HERO SLIDER */}
      <HeroBanner />

      {/* 2. DYNAMIC ADMIN-SYNCHRONIZED CATEGORIES */}
      <ShopByCategory categories={categories} />

      {/* 3. SPIRITUAL HERITAGE & ARTISAN STORY */}
      <SpiritualStorySection />

      {/* 4. INTERACTIVE TABBED COLLECTION SHOWCASE */}
      <TabbedCollectionShowcase products={allFeatured} />

      {/* 5. NEW ARRIVALS SLIDER */}
      <NewArrivalsSlider products={finalNewArrivals} />

      {/* 6. BEST SELLERS GRID */}
      <BestSellersGrid products={bestsellerList} />

      {/* 7. TRENDING PRODUCTS CAROUSEL */}
      <TrendingCarousel products={finalTrending} />

      {/* 8. CORPORATE GIFTING SHOWCASE */}
      <CorporateShowcase />

      {/* 9. WHY CHOOSE ANANT ARTS */}
      <WhyChooseUs />

      {/* 10. FREQUENTLY ASKED QUESTIONS */}
      <FaqAccordion />

      {/* 11. CUSTOMER REVIEWS */}
      <CustomerReviews testimonials={testimonials} />

      {/* 12. INSTAGRAM GALLERY */}
      <InstagramGallery />

      {/* 13. LUXURY NEWSLETTER */}
      <LuxuryNewsletter />

      {/* Bulk Enquiry Banner Section */}
      <div style={{ padding: '0 1rem' }}>
        <BulkEnquiryBanner />
      </div>

      {/* Pop-up Modals */}
      <NewsletterExitModals />
    </>
  );
}


