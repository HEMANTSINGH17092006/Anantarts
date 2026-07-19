import SettingsManager from '@/components/admin/SettingsManager';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export const dynamic = 'force-dynamic';

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'anant_arts_divine_key_999');

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

  // Parse admin session from cookie
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  let currentUser = null;
  if (token) {
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET_KEY);
      currentUser = payload;
    } catch (e) {}
  }

  // Fetch admins list (Only allowed if user is super_admin)
  let admins = [];
  if (currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'admin')) {
    const { data } = await supabase
      .from('admins')
      .select('id, email, role, is_active, created_at')
      .order('created_at', { ascending: false });
    admins = data || [];
  }

  return (
    <SettingsManager 
      settings={settings} 
      logs={logs} 
      currentUser={currentUser} 
      admins={admins} 
    />
  );
}
