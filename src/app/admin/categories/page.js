import CategoryManager from '@/components/admin/CategoryManager';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  try {
    const supabase = createAdminClient();
    const res = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    const categories = Array.isArray(res?.data) ? res.data : [];
    return <CategoryManager initialCategories={categories} />;
  } catch (err) {
    console.error('[AdminCategoriesPage] Error:', err);
    return <CategoryManager initialCategories={[]} />;
  }
}
