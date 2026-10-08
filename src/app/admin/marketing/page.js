import MarketingManager from '@/components/admin/MarketingManager';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAllMarketingCustomers } from '@/lib/marketing-customer-service';

export const dynamic = 'force-dynamic';

export default async function AdminMarketingPage() {
  let campaigns = [];
  let templates = [];
  let customers = [];
  let products = [];
  let categories = [];

  try {
    const supabase = createAdminClient();

    const [
      campData,
      tplData,
      prodsData,
      catsData,
      customerList
    ] = await Promise.all([
      supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .then(r => Array.isArray(r?.data) ? r.data : [])
        .catch(() => []),
      supabase
        .from('marketing_templates')
        .select('*')
        .order('created_at', { ascending: false })
        .then(r => Array.isArray(r?.data) ? r.data : [])
        .catch(() => []),
      supabase
        .from('products')
        .select('id, name, slug, price, discount_price, sku, deity_category, category_id, product_images(image_path, is_primary)')
        .eq('is_published', 1)
        .order('name', { ascending: true })
        .then(r => Array.isArray(r?.data) ? r.data : [])
        .catch(() => []),
      supabase
        .from('categories')
        .select('id, name, slug')
        .order('sort_order', { ascending: true })
        .then(r => Array.isArray(r?.data) ? r.data : [])
        .catch(() => []),
      getAllMarketingCustomers().catch(() => [])
    ]);

    campaigns = Array.isArray(campData) ? campData : [];
    templates = Array.isArray(tplData) ? tplData : [];
    categories = Array.isArray(catsData) ? catsData : [];
    customers = Array.isArray(customerList) ? customerList : [];

    products = (Array.isArray(prodsData) ? prodsData : []).map(p => {
      const primaryImg = p.product_images?.find(img => img.is_primary === 1) || p.product_images?.[0];
      return {
        ...p,
        image_path: primaryImg?.image_path || '/images/placeholder.jpg'
      };
    });

  } catch (err) {
    console.error('[AdminMarketingPage Load Error]:', err);
  }

  // 100% JSON-safe serialization
  const safeCampaigns = JSON.parse(JSON.stringify(campaigns));
  const safeTemplates = JSON.parse(JSON.stringify(templates));
  const safeCustomers = JSON.parse(JSON.stringify(customers));
  const safeProducts = JSON.parse(JSON.stringify(products));
  const safeCategories = JSON.parse(JSON.stringify(categories));

  return (
    <MarketingManager
      initialCampaigns={safeCampaigns}
      initialTemplates={safeTemplates}
      initialCustomers={safeCustomers}
      products={safeProducts}
      categories={safeCategories}
    />
  );
}

