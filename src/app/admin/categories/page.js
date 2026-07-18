import CategoryManager from '@/components/admin/CategoryManager';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic'; // Prevent caching of config views

export default async function AdminCategoriesPage() {
  const supabase = createAdminClient();

  // Fetch all categories sorted by hierarchy index
  const { data: categories = [] } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  return (
    <CategoryManager initialCategories={categories} />
  );
}
