import { getSettings } from '@/lib/db-helpers';

export const dynamic = 'force-dynamic';

// Public API endpoint for fetching non-sensitive site settings
// Used by client-side components (contact page, footer) to get contact details
export async function GET() {
  try {
    const settings = await getSettings();

    // Return only the settings that are safe for public consumption
    const publicSettings = {
      site_name: settings.site_name,
      site_tagline: settings.site_tagline,
      contact_phone: settings.contact_phone,
      contact_email: settings.contact_email,
      contact_address: settings.contact_address,
      whatsapp_number: settings.whatsapp_number,
      social_links: settings.social_links,
      whatsapp_admin_number: settings.whatsapp_admin_number,
      whatsapp_message_template: settings.whatsapp_message_template,
      whatsapp_notifications_enabled: settings.whatsapp_notifications_enabled,
    };

    return Response.json(publicSettings, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    return Response.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
