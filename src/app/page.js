import { 
  getSettings, 
  getProducts, 
  getTestimonials
} from '@/lib/db-helpers';

// Import Components in exact requested sequence
import MobileSearchBar from '@/components/home/MobileSearchBar';
import HorizontalCategoryBar from '@/components/home/HorizontalCategoryBar';
import HeroBanner from '@/components/home/HeroBanner';
import TrendingCarousel from '@/components/home/TrendingCarousel';
import ShopByCategory from '@/components/home/ShopByCategory';
import NewArrivalsSlider from '@/components/home/NewArrivalsSlider';
import BestSellersGrid from '@/components/home/BestSellersGrid';
import ShopByMaterial from '@/components/home/ShopByMaterial';
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
      {/* 1. STICKY MOBILE SEARCH BAR */}
      <MobileSearchBar />

      {/* 2. HORIZONTAL SCROLLABLE CATEGORY ICONS BAR */}
      <HorizontalCategoryBar />

      {/* 3. PROMOTIONAL BANNER SLIDER (COMPACT 180-220PX ON MOBILE) */}
      <HeroBanner />

      {/* 4. TRENDING PRODUCTS */}
      <TrendingCarousel products={featuredProducts} />

      {/* 5. FEATURED COLLECTIONS */}
      <ShopByCategory />

      {/* 6. NEW ARRIVALS SLIDER */}
      <NewArrivalsSlider products={newArrivalProducts.length > 0 ? newArrivalProducts : featuredProducts} />

      {/* 7. BEST SELLERS GRID */}
      <BestSellersGrid products={bestsellerProducts.length > 0 ? bestsellerProducts : featuredProducts} />

      {/* 8. SHOP BY MATERIAL */}
      <ShopByMaterial />

      {/* 9. WHY CHOOSE ANANT ARTS */}
      <WhyChooseUs />

      {/* 10. CUSTOMER REVIEWS */}
      <CustomerReviews testimonials={testimonials} />

      {/* 11. INSTAGRAM GALLERY */}
      <InstagramGallery />

      {/* 12. LUXURY NEWSLETTER */}
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
