import ProductManager from '@/components/admin/ProductManager';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  try {
    const supabase = createAdminClient();

    const [categoriesRes, productsRes] = await Promise.all([
      supabase.from('categories').select('id, name').order('sort_order', { ascending: true }),
      supabase.from('products').select(`*, categories(name, slug), product_images(image_path, is_primary)`).order('created_at', { ascending: false })
    ]);

    const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : [];
    const productsData = Array.isArray(productsRes?.data) ? productsRes.data : [];

    const products = productsData.map(product => {
      if (!product) return {};
      const primaryImg = product.product_images?.find(img => img.is_primary === 1) || product.product_images?.[0];
      return {
        ...product,
        category_name: product.categories?.name || '',
        category_slug: product.categories?.slug || '',
        image_path: primaryImg?.image_path || '/images/placeholder.jpg'
      };
    });

    return <ProductManager initialProducts={products} categories={categories} />;
  } catch (err) {
    console.error('[AdminProductsPage] Error:', err);
    return <ProductManager initialProducts={[]} categories={[]} />;
  }
}
