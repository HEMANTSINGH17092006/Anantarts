import ProductManager from '@/components/admin/ProductManager';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic'; // Prevent caching of inventory details

export default async function AdminProductsPage() {
  const supabase = createAdminClient();

  // 1. Fetch Categories list for selection dropdown
  const { data: categories = [] } = await supabase
    .from('categories')
    .select('id, name')
    .order('sort_order', { ascending: true });

  // 2. Fetch Products list along with primary cover photo
  const { data: productsData = [] } = await supabase
    .from('products')
    .select(`
      *,
      categories(name, slug),
      product_images(image_path, is_primary)
    `)
    .order('created_at', { ascending: false });

  // Structure photo URLs properly
  const products = productsData.map(product => {
    const primaryImg = product.product_images?.find(img => img.is_primary === 1) || product.product_images?.[0];
    return {
      ...product,
      category_name: product.categories?.name || '',
      category_slug: product.categories?.slug || '',
      image_path: primaryImg?.image_path || '/images/placeholder.jpg'
    };
  });

  return (
    <ProductManager initialProducts={products} categories={categories} />
  );
}
