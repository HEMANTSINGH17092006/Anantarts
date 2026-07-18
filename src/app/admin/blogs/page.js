import BlogManager from '@/components/admin/BlogManager';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminBlogsPage() {
  const supabase = createAdminClient();

  // Query all blogs, including drafts, sorted by creation date
  const { data: blogs = [] } = await supabase
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <BlogManager initialBlogs={blogs} />
  );
}
