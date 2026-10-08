import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('c');
  const token = searchParams.get('r');
  const targetUrl = searchParams.get('url');

  let safeRedirectUrl = SITE_URL;

  if (targetUrl) {
    try {
      const decoded = decodeURIComponent(targetUrl).trim();
      if (decoded.startsWith('/') && !decoded.startsWith('//')) {
        // Relative path on store domain
        safeRedirectUrl = `${SITE_URL}${decoded}`;
      } else if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
        const parsed = new URL(decoded);
        const allowedHosts = [
          'anantarts.in',
          'www.anantarts.in',
          new URL(SITE_URL).hostname,
          'localhost'
        ];
        if (allowedHosts.includes(parsed.hostname)) {
          safeRedirectUrl = decoded;
        } else {
          console.warn(`[Security Alert] Blocked suspicious redirect to external domain: ${parsed.hostname}`);
          safeRedirectUrl = SITE_URL;
        }
      }
    } catch (e) {
      safeRedirectUrl = SITE_URL;
    }
  }

  if (campaignId && token) {
    try {
      const supabase = createAdminClient();
      
      const { data: recipient } = await supabase
        .from('campaign_recipients')
        .select('id, clicked_at')
        .eq('campaign_id', campaignId)
        .eq('tracking_token', token)
        .single();

      if (recipient) {
        const isFirstClick = !recipient.clicked_at;

        // Update recipient clicked time
        await supabase
          .from('campaign_recipients')
          .update({ clicked_at: new Date().toISOString() })
          .eq('id', recipient.id);

        // Record tracking event
        await supabase.from('campaign_events').insert({
          campaign_id: Number(campaignId),
          recipient_id: recipient.id,
          event_type: 'click',
          metadata: JSON.stringify({ target_url: safeRedirectUrl }),
          user_agent: request.headers.get('user-agent') || '',
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
        });

        // Increment campaign clicked_count if first click
        if (isFirstClick) {
          const { data: camp } = await supabase
            .from('marketing_campaigns')
            .select('clicked_count')
            .eq('id', campaignId)
            .single();

          if (camp) {
            await supabase
              .from('marketing_campaigns')
              .update({ clicked_count: (camp.clicked_count || 0) + 1 })
              .eq('id', campaignId);
          }
        }
      }
    } catch (err) {
      console.warn('[Click Tracking Warning]:', err.message);
    }
  }

  return NextResponse.redirect(safeRedirectUrl, 302);
}
