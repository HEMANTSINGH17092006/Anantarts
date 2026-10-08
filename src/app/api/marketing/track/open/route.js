import { createAdminClient } from '@/lib/supabase/admin';

// 1x1 Transparent GIF Byte Array
const TRANSPARENT_1X1_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('c');
  const token = searchParams.get('r');

  if (campaignId && token) {
    try {
      const supabase = createAdminClient();
      
      // Find recipient
      const { data: recipient } = await supabase
        .from('campaign_recipients')
        .select('id, opened_at')
        .eq('campaign_id', campaignId)
        .eq('tracking_token', token)
        .single();

      if (recipient) {
        const isFirstOpen = !recipient.opened_at;

        // Update recipient open time
        await supabase
          .from('campaign_recipients')
          .update({ opened_at: new Date().toISOString() })
          .eq('id', recipient.id);

        // Record tracking event
        await supabase.from('campaign_events').insert({
          campaign_id: Number(campaignId),
          recipient_id: recipient.id,
          event_type: 'open',
          user_agent: request.headers.get('user-agent') || '',
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
        });

        // Increment campaign opened_count if first time
        if (isFirstOpen) {
          const { data: camp } = await supabase
            .from('marketing_campaigns')
            .select('opened_count')
            .eq('id', campaignId)
            .single();

          if (camp) {
            await supabase
              .from('marketing_campaigns')
              .update({ opened_count: (camp.opened_count || 0) + 1 })
              .eq('id', campaignId);
          }
        }
      }
    } catch (err) {
      console.warn('[Open Tracking Warning]:', err.message);
    }
  }

  // Return transparent 1x1 GIF
  return new Response(TRANSPARENT_1X1_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(TRANSPARENT_1X1_GIF.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
