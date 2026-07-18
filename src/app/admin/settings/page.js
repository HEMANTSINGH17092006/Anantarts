import SettingsManager from '@/components/admin/SettingsManager';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();

  // Fetch website settings
  const { data: settingsData = [] } = await supabase.from('website_settings').select('*');
  const settings = {};
  settingsData.forEach(r => { settings[r.key] = r.value; });

  // Fetch recent whatsapp logs for visibility
  const { data: logs = [] } = await supabase
    .from('whatsapp_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <SettingsManager settings={settings} logs={logs} />
  );
}
