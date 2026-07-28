import { 
  getSettings, 
  getProducts, 
  getTestimonials
} from '@/lib/db-helpers';

// Import the 13 Homepage Showcase Components in exact sequence
import HeroBanner from '@/components/home/HeroBanner';
import ShopByCategory from '@/components/home/ShopByCategory';
import NewArrivalsSlider from '@/components/home/NewArrivalsSlider';
import BestSellersGrid from '@/components/home/BestSellersGrid';
import TrendingCarousel from '@/components/home/TrendingCarousel';
import WoodenShowcase from '@/components/home/WoodenShowcase';
import SpiritualShowcase from '@/components/home/SpiritualShowcase';
import CorporateShowcase from '@/components/home/CorporateShowcase';
import HomeDecorShowcase from '@/components/home/HomeDecorShowcase';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import CustomerReviews from '@/components/home/CustomerReviews';
import InstagramGallery from '@/components/home/InstagramGallery';
import LuxuryNewsletter from '@/components/home/LuxuryNewsletter';
import NewsletterExitModals from '@/components/home/NewsletterExitModals';
import BulkEnquiryForm from '@/components/home/BulkEnquiryForm';

export const revalidate = 3600; // Cache home page for up to 1 hour

export default async function Home() {
  const testimonials = await getTestimonials();

  // Fetch product showcases
  const bestsellerProducts = await getProducts({ tag: 'Best Seller', limit: 8 });
  const newArrivalProducts = await getProducts({ tag: 'New Arrival', limit: 10 });
  const featuredProducts = await getProducts({ limit: 10 });

  return (
    <>
      {/* 1. PREMIUM HERO BANNER */}
      <HeroBanner />

      {/* 2. SHOP BY CATEGORY */}
      <ShopByCategory />

      {/* 3. NEW ARRIVALS SLIDER */}
      <NewArrivalsSlider products={newArrivalProducts.length > 0 ? newArrivalProducts : featuredProducts} />

      {/* 4. BEST SELLERS GRID */}
      <BestSellersGrid products={bestsellerProducts.length > 0 ? bestsellerProducts : featuredProducts} />

      {/* 5. TRENDING PRODUCTS CAROUSEL */}
      <TrendingCarousel products={featuredProducts} />

      {/* 6. WOODEN HANDICRAFTS SHOWCASE */}
      <WoodenShowcase />

      {/* 7. SPIRITUAL COLLECTION SHOWCASE */}
      <SpiritualShowcase />

      {/* 8. CORPORATE GIFTING SHOWCASE */}
      <CorporateShowcase />

      {/* 9. HOME DECOR SHOWCASE */}
      <HomeDecorShowcase />

      {/* 10. WHY CHOOSE ANANT ARTS */}
      <WhyChooseUs />

      {/* 11. CUSTOMER REVIEWS */}
      <CustomerReviews testimonials={testimonials} />

      {/* 12. INSTAGRAM GALLERY */}
      <InstagramGallery />

      {/* 13. LUXURY NEWSLETTER */}
      <LuxuryNewsletter />

      {/* Bulk Enquiry Form Section */}
      <div id="bulk-enquiry-section" style={{ padding: '4rem 0', background: 'var(--bg-cream)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
          <BulkEnquiryForm />
        </div>
      </div>

      {/* Pop-up Modals */}
      <NewsletterExitModals />
    </>
  );
}
