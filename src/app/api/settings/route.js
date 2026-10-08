import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Public API endpoint for fetching non-sensitive site settings
// Returns fresh real-time settings directly from the database without stale caching
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: dbSettings, error } = await supabase.from('website_settings').select('*');
    if (error) throw error;

    const settings = {};
    (dbSettings || []).forEach(r => { settings[r.key] = r.value; });

    // Return only the settings that are safe for public consumption
    const publicSettings = {
      site_name: settings.site_name || 'Anant Arts',
      site_tagline: settings.site_tagline || '',
      contact_phone: settings.contact_phone || '',
      contact_email: settings.contact_email || '',
      contact_address: settings.contact_address || '',
      whatsapp_number: settings.whatsapp_number || '',
      social_links: settings.social_links || '',
      whatsapp_admin_number: settings.whatsapp_admin_number || '',
      whatsapp_message_template: settings.whatsapp_message_template || '',
      whatsapp_notifications_enabled: settings.whatsapp_notifications_enabled || '',
      upi_qr_enabled: settings.upi_qr_enabled !== '0',
      upi_qr_image_url: settings.upi_qr_image_url || '',
      upi_id: settings.upi_id || '',
      upi_display_name: settings.upi_display_name || 'Anant Arts',
    };

    return Response.json(publicSettings, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    console.error('Failed to fetch settings:', err);
    return Response.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
