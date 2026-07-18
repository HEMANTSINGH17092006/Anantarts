import ContentManager from '@/components/admin/ContentManager';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  const supabase = createAdminClient();

  // Fetch website settings
  const { data: settingsData = [] } = await supabase.from('website_settings').select('*');
  const settings = {};
  settingsData.forEach(r => { settings[r.key] = r.value; });

  // Fetch all banners
  const { data: banners = [] } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true });

  return (
    <ContentManager settings={settings} banners={banners} />
  );
}
