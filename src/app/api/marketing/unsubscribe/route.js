import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyUnsubscribeSignature } from '@/lib/marketing-queue-service';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      phone,
      token,
      sig,
      email_marketing_opt_in = 0,
      whatsapp_marketing_opt_in = 0,
      unsubscribe_reason = 'Patron requested opt-out via preferences center'
    } = body;

    if (!email && !phone) {
      return NextResponse.json({ success: false, error: 'Email or phone number is required.' }, { status: 400 });
    }

    const cleanEmail = email ? email.toLowerCase().trim() : null;
    const supabase = createAdminClient();

    // SECURITY CHECK: Verify token or HMAC signature to prevent unauthorized modifications
    let isAuthorized = false;

    if (cleanEmail && sig) {
      isAuthorized = verifyUnsubscribeSignature(cleanEmail, sig);
    }

    if (!isAuthorized && cleanEmail && token) {
      const { data: recipientMatch } = await supabase
        .from('campaign_recipients')
        .select('id')
        .eq('recipient_email', cleanEmail)
        .eq('tracking_token', token)
        .limit(1);

      if (recipientMatch && recipientMatch.length > 0) {
        isAuthorized = true;
      }
    }

    // In local development or if testing from storefront with valid email
    if (!isAuthorized && process.env.NODE_ENV === 'development' && cleanEmail) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({
        success: false,
        error: 'Security authorization check failed. Please use the personalized unsubscribe link sent to your registered email.'
      }, { status: 403 });
    }

    // Check if preference record exists for this email
    let existing = null;
    if (cleanEmail) {
      const { data } = await supabase
        .from('communication_preferences')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();
      existing = data;
    }

    const isFullyOptedOut = email_marketing_opt_in === 0 && whatsapp_marketing_opt_in === 0;

    const payload = {
      email: cleanEmail,
      phone: phone || (existing?.phone || null),
      email_marketing_opt_in: Number(email_marketing_opt_in),
      whatsapp_marketing_opt_in: Number(whatsapp_marketing_opt_in),
      unsubscribed_at: isFullyOptedOut ? new Date().toISOString() : null,
      unsubscribe_reason: isFullyOptedOut ? unsubscribe_reason : null,
      source: 'web_unsubscribe_form',
      updated_at: new Date().toISOString()
    };

    if (existing) {
      await supabase
        .from('communication_preferences')
        .update(payload)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('communication_preferences')
        .insert(payload);
    }

    // If token exists, log the event
    if (token) {
      const { data: recipient } = await supabase
        .from('campaign_recipients')
        .select('id, campaign_id')
        .eq('tracking_token', token)
        .maybeSingle();

      if (recipient) {
        await supabase.from('campaign_events').insert({
          campaign_id: recipient.campaign_id,
          recipient_id: recipient.id,
          event_type: 'unsubscribed',
          metadata: JSON.stringify({ email: cleanEmail, reason: unsubscribe_reason }),
          user_agent: request.headers.get('user-agent') || '',
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Your communication preferences have been updated successfully.'
    });
  } catch (err) {
    console.error('[Unsubscribe API Error]:', err);
    return NextResponse.json({ success: false, error: 'Unable to update preferences at this time.' }, { status: 500 });
  }
}

