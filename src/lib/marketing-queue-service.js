import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { getAllMarketingCustomers, filterCustomersBySegment } from './marketing-customer-service';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

/**
 * Generate a deterministic cryptographic HMAC signature for customer unsubscribe link
 */
export function generateUnsubscribeSignature(email) {
  if (!email || typeof email !== 'string') return '';
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || 'anantarts-unsub-secret-key-2026';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase().trim()).digest('hex').substring(0, 32);
}

/**
 * Verify cryptographic HMAC signature for customer unsubscribe request
 */
export function verifyUnsubscribeSignature(email, signature) {
  if (!email || !signature || typeof email !== 'string' || typeof signature !== 'string') return false;
  try {
    const expected = generateUnsubscribeSignature(email);
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch (e) {
    return false;
  }
}

/**
 * Replace personalized variable tokens in content
 */
export function interpolateVariables(content, recipient, customData = {}) {
  if (!content || typeof content !== 'string') return '';
  const fullName = recipient?.recipient_name || recipient?.name || 'Devotee';
  const firstName = fullName.split(' ')[0] || fullName;
  const email = recipient?.recipient_email || recipient?.email || '';
  const phone = recipient?.recipient_phone || recipient?.phone || '';
  const websiteLink = customData.website_link || SITE_URL;
  const productLink = customData.product_link || `${SITE_URL}/shop`;
  const discountCode = customData.discount_code || 'DIVINE10';
  const siteName = 'Anant Arts';

  return content
    .replace(/\{\{\s*name\s*\}\}/gi, fullName)
    .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*customer_name\s*\}\}/gi, fullName)
    .replace(/\{\{\s*email\s*\}\}/gi, email)
    .replace(/\{\{\s*phone\s*\}\}/gi, phone)
    .replace(/\{\{\s*product_link\s*\}\}/gi, productLink)
    .replace(/\{\{\s*website_link\s*\}\}/gi, websiteLink)
    .replace(/\{\{\s*discount_code\s*\}\}/gi, discountCode)
    .replace(/\{\{\s*site_name\s*\}\}/gi, siteName);
}

/**
 * Rewrites <a href="..."> links in email HTML to go through click tracking redirect
 */
export function injectClickTracking(html, campaignId, trackingToken) {
  if (!html || !campaignId || !trackingToken) return html;

  return html.replace(/<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi, (match, before, href, after) => {
    // Do not track mailto, tel, unsubscribe, or internal anchors
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#') || href.includes('/unsubscribe')) {
      return match;
    }
    const trackingUrl = `${SITE_URL}/api/marketing/track/click?c=${campaignId}&r=${trackingToken}&url=${encodeURIComponent(href)}`;
    return `<a ${before}href="${trackingUrl}"${after}>`;
  });
}

/**
 * Luxury Anant Arts Email Brand Shell Wrapper
 */
export function wrapInLuxuryEmailShell(bodyHtml, campaignSubject, trackingToken, recipientEmail, campaignId) {
  const sig = generateUnsubscribeSignature(recipientEmail || '');
  const unsubUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(recipientEmail || '')}&token=${trackingToken || ''}&sig=${sig}`;
  const trackingPixel = campaignId && trackingToken
    ? `<img src="${SITE_URL}/api/marketing/track/open?c=${campaignId}&r=${trackingToken}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;outline:none;" />`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${campaignSubject || 'Anant Arts'}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; border-radius: 0 !important; }
      .email-content { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF9F6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="background-color: #FAF9F6; padding: 24px 12px;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="email-container" style="max-width: 620px; width: 100%; background-color: #FFFFFF; border: 1px solid #EAE3D2; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
      
      <!-- Luxury Gold-Accented Dark Brand Header -->
      <tr>
        <td style="background: linear-gradient(180deg, #0A0A0A 0%, #171513 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #D4AF37;">
          <div style="font-size: 28px; margin-bottom: 4px; filter: drop-shadow(0 0 6px rgba(212,175,55,0.4));">🪷</div>
          <h1 style="margin: 0; color: #D4AF37; font-size: 24px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-family: 'Playfair Display', Georgia, serif;">
            Anant Arts
          </h1>
          <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.75); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">
            Bringing Divine Art to Every Home
          </p>
        </td>
      </tr>

      <!-- Email Main Content Body -->
      <tr>
        <td class="email-content" style="padding: 36px 32px; color: #3B2F2F; line-height: 1.7; font-size: 14.5px;">
          ${bodyHtml}
        </td>
      </tr>

      <!-- Luxury Brand Footer -->
      <tr>
        <td style="background-color: #FDFBF7; padding: 28px 24px; text-align: center; border-top: 1px solid #EAE3D2; font-size: 12px; color: #6E5A5A;">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #3B2F2F;">
            Anant Arts &bull; Masterpiece Electroplated Spiritual Idols
          </p>
          <p style="margin: 0 0 16px 0; line-height: 1.5;">
            Handcrafted with 24K Gold, Pure Silver &amp; Temple Bronze.<br>
            Bhoirwadi, Dombivli East, Maharashtra &bull; <a href="${SITE_URL}" style="color: #AA7C11; text-decoration: none; font-weight: 600;">Visit Website</a>
          </p>
          
          <div style="padding-top: 16px; border-top: 1px dashed #E0D7C5; font-size: 11px; color: #8C827A;">
            You are receiving this auspicious communication as a valued patron or subscriber of Anant Arts.<br>
            <a href="${unsubUrl}" style="color: #AA7C11; text-decoration: underline; margin-top: 6px; display: inline-block;">Manage Communication Preferences / Unsubscribe</a>
          </div>
          ${trackingPixel}
        </td>
      </tr>

    </table>
  </div>
</body>
</html>`;
}

/**
 * Sends a single WhatsApp message via Meta Cloud API
 */
async function sendWhatsAppDirect(phone, messageText) {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    const errorMsg = 'WhatsApp provider not configured. Please define WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment variables.';
    console.warn(`[WhatsApp Provider Error]: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  let formattedPhone = phone.replace(/\D/g, '');
  if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;

  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: { body: messageText }
    })
  });

  const data = await res.json();
  if (res.ok) {
    return { success: true, data };
  } else {
    throw new Error(data?.error?.message || 'Meta WhatsApp API Error');
  }
}

/**
 * 1. Prepare and enqueue all target recipients for a campaign
 */
export async function prepareAndEnqueueCampaign(campaignId, adminEmail = 'system') {
  const supabase = createAdminClient();

  const { data: campaign, error: campErr } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campErr || !campaign) {
    throw new Error('Campaign not found');
  }

  // Parse segment config
  let segmentConfig = {};
  try {
    segmentConfig = typeof campaign.segment_config === 'string'
      ? JSON.parse(campaign.segment_config)
      : (campaign.segment_config || {});
  } catch (e) {
    segmentConfig = {};
  }

  segmentConfig.channel = campaign.type; // 'email' | 'whatsapp'
  segmentConfig.only_opted_in = true; // Strict consent enforcement

  // Query and filter all matching customers
  const allCustomers = await getAllMarketingCustomers();
  const matchedRecipients = filterCustomersBySegment(allCustomers, segmentConfig);

  if (matchedRecipients.length === 0) {
    throw new Error('No eligible recipients match the selected segment and consent criteria.');
  }

  // Clear any existing pending recipients for this campaign to prevent duplicates
  await supabase.from('campaign_recipients').delete().eq('campaign_id', campaignId);

  // Prepare batch insert of recipients
  const recipientRows = matchedRecipients.map(c => ({
    campaign_id: campaignId,
    customer_id: c.user_id || null,
    recipient_email: c.email || null,
    recipient_phone: c.phone || null,
    recipient_name: c.name || 'Devotee',
    status: 'pending',
    tracking_token: crypto.randomUUID(),
    metadata: JSON.stringify({
      city: c.city,
      total_spent: c.total_spent,
      total_orders: c.total_orders,
      preferred_category: c.preferred_category
    })
  }));

  // Insert in chunks of 500
  const CHUNK_SIZE = 500;
  for (let i = 0; i < recipientRows.length; i += CHUNK_SIZE) {
    const chunk = recipientRows.slice(i, i + CHUNK_SIZE);
    const { error: insErr } = await supabase.from('campaign_recipients').insert(chunk);
    if (insErr) {
      throw new Error(`Failed to enqueue recipients: ${insErr.message}`);
    }
  }

  // Update campaign status
  await supabase.from('marketing_campaigns').update({
    status: 'processing',
    total_recipients: recipientRows.length,
    sent_count: 0,
    delivered_count: 0,
    opened_count: 0,
    clicked_count: 0,
    failed_count: 0,
    started_at: new Date().toISOString(),
    completed_at: null
  }).eq('id', campaignId);

  // Log campaign start
  await supabase.from('campaign_logs').insert({
    campaign_id: campaignId,
    level: 'info',
    message: `Campaign enqueued by ${adminEmail} with ${recipientRows.length} recipients. Queue processing started.`
  });

  return { success: true, total_recipients: recipientRows.length };
}

/**
 * 2. Process next batch of campaign recipients with atomic row claiming and exact tallying
 */
export async function processCampaignBatch(campaignId, batchSize = 15) {
  const supabase = createAdminClient();

  // Fetch campaign status
  const { data: campaign, error: campErr } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campErr || !campaign) {
    return { success: false, error: 'Campaign not found' };
  }

  // If campaign was cancelled by admin, halt immediately
  if (campaign.status === 'cancelled') {
    return { success: true, status: 'cancelled', message: 'Campaign was cancelled by admin.' };
  }

  // Fetch candidate pending recipient IDs
  const { data: candidateBatch, error: batchErr } = await supabase
    .from('campaign_recipients')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .limit(batchSize);

  if (batchErr) {
    return { success: false, error: batchErr.message };
  }

  // If no more pending recipients, complete the campaign and calculate exact stats
  if (!candidateBatch || candidateBatch.length === 0) {
    // Tally exact final status from table
    const { data: stats } = await supabase
      .from('campaign_recipients')
      .select('status')
      .eq('campaign_id', campaignId);

    const counts = { sent: 0, failed: 0, skipped: 0, pending: 0, processing: 0 };
    (stats || []).forEach(r => {
      if (r.status === 'sent' || r.status === 'delivered') counts.sent++;
      else if (r.status === 'failed') counts.failed++;
      else if (r.status === 'skipped') counts.skipped++;
      else if (r.status === 'pending') counts.pending++;
      else if (r.status === 'processing') counts.processing++;
    });

    // If some were left in 'processing' due to a past terminated request, reset them to failed
    if (counts.processing > 0) {
      await supabase
        .from('campaign_recipients')
        .update({ status: 'failed', error_message: 'Request execution interrupted during batch processing.' })
        .eq('campaign_id', campaignId)
        .eq('status', 'processing');
      counts.failed += counts.processing;
    }

    const finalStatus = counts.failed > 0
      ? (counts.sent > 0 ? 'partially_failed' : 'failed')
      : 'completed';

    await supabase.from('marketing_campaigns').update({
      status: finalStatus,
      sent_count: counts.sent,
      delivered_count: counts.sent,
      failed_count: counts.failed,
      completed_at: new Date().toISOString()
    }).eq('id', campaignId);

    await supabase.from('campaign_logs').insert({
      campaign_id: campaignId,
      level: counts.failed > 0 ? 'warn' : 'info',
      message: `Campaign execution finished. Final status: ${finalStatus}. Sent: ${counts.sent}, Failed: ${counts.failed}, Skipped: ${counts.skipped}.`
    });

    return { success: true, done: true, status: finalStatus, sent: counts.sent, failed: counts.failed };
  }

  // ATOMIC CLAIM: Update selected candidate IDs from 'pending' to 'processing'
  const candidateIds = candidateBatch.map(b => b.id);
  const { data: claimedRecipients, error: claimErr } = await supabase
    .from('campaign_recipients')
    .update({ status: 'processing' })
    .in('id', candidateIds)
    .eq('status', 'pending')
    .select('*');

  if (claimErr) {
    return { success: false, error: claimErr.message };
  }

  if (!claimedRecipients || claimedRecipients.length === 0) {
    // Another concurrent worker claimed them, return status check
    return { success: true, processed: 0, message: 'Batch claimed by concurrent process.' };
  }

  // Process each claimed recipient
  let sentInThisBatch = 0;
  let failedInThisBatch = 0;

  for (const recipient of claimedRecipients) {
    try {
      if (campaign.type === 'email') {
        // Personalized HTML with dynamic replacement and tracking
        const interpolatedHtml = interpolateVariables(campaign.content_html, recipient);
        const trackedHtml = injectClickTracking(interpolatedHtml, campaignId, recipient.tracking_token);
        const fullBrandedHtml = wrapInLuxuryEmailShell(
          trackedHtml,
          campaign.subject,
          recipient.tracking_token,
          recipient.recipient_email,
          campaignId
        );
        const interpolatedSubject = interpolateVariables(campaign.subject, recipient);
        const interpolatedText = interpolateVariables(campaign.content_text, recipient);

        const emailRes = await sendEmail({
          to: recipient.recipient_email,
          subject: interpolatedSubject,
          html: fullBrandedHtml,
          text: interpolatedText
        });

        if (emailRes.success) {
          await supabase.from('campaign_recipients').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            error_message: null
          }).eq('id', recipient.id);

          await supabase.from('campaign_events').insert({
            campaign_id: campaignId,
            recipient_id: recipient.id,
            event_type: 'sent',
            metadata: JSON.stringify({ messageId: emailRes.messageId })
          });

          sentInThisBatch++;
        } else {
          throw new Error(emailRes.error || 'SMTP Provider Error');
        }

      } else if (campaign.type === 'whatsapp') {
        const interpolatedText = interpolateVariables(campaign.content_text, recipient);

        const waRes = await sendWhatsAppDirect(recipient.recipient_phone, interpolatedText);

        if (waRes.success) {
          await supabase.from('campaign_recipients').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            error_message: null
          }).eq('id', recipient.id);

          await supabase.from('campaign_events').insert({
            campaign_id: campaignId,
            recipient_id: recipient.id,
            event_type: 'sent',
            metadata: JSON.stringify({ data: waRes.data })
          });

          sentInThisBatch++;
        } else {
          throw new Error(waRes.error || 'WhatsApp Provider Error');
        }
      }

      // Small throttling delay between recipients
      await new Promise(r => setTimeout(r, 100));

    } catch (err) {
      failedInThisBatch++;
      await supabase.from('campaign_recipients').update({
        status: 'failed',
        error_message: err.message || 'Transmission failed',
        retry_count: (recipient.retry_count || 0) + 1
      }).eq('id', recipient.id);

      await supabase.from('campaign_logs').insert({
        campaign_id: campaignId,
        level: 'error',
        message: `Delivery failed to ${recipient.recipient_email || recipient.recipient_phone}: ${err.message}`
      });
    }
  }

  // Recalculate exact total counts from database to eliminate counter drift
  const { data: allCampaignRecipients } = await supabase
    .from('campaign_recipients')
    .select('status')
    .eq('campaign_id', campaignId);

  let totalSent = 0;
  let totalFailed = 0;
  let totalPending = 0;

  (allCampaignRecipients || []).forEach(r => {
    if (r.status === 'sent' || r.status === 'delivered') totalSent++;
    else if (r.status === 'failed') totalFailed++;
    else if (r.status === 'pending' || r.status === 'processing') totalPending++;
  });

  await supabase.from('marketing_campaigns').update({
    sent_count: totalSent,
    delivered_count: totalSent,
    failed_count: totalFailed
  }).eq('id', campaignId);

  return {
    success: true,
    done: totalPending === 0,
    processed: claimedRecipients.length,
    sent_in_batch: sentInThisBatch,
    failed_in_batch: failedInThisBatch,
    total_sent: totalSent,
    total_failed: totalFailed,
    remaining: totalPending
  };
}

/**
 * 3. Send Single Test Email
 */
export async function sendTestEmailCampaign(campaign, testEmail) {
  if (!testEmail || !testEmail.includes('@')) {
    throw new Error('Please provide a valid test email address.');
  }

  const dummyRecipient = {
    recipient_name: 'Test Administrator',
    recipient_email: testEmail,
    recipient_phone: '917275819354'
  };

  const interpolatedHtml = interpolateVariables(campaign.content_html, dummyRecipient);
  const fullHtml = wrapInLuxuryEmailShell(
    interpolatedHtml,
    `[TEST] ${campaign.subject || 'Anant Arts Campaign'}`,
    'test-token-preview',
    testEmail,
    null
  );

  return await sendEmail({
    to: testEmail,
    subject: `[TEST] ${campaign.subject || 'Anant Arts Marketing Preview'}`,
    html: fullHtml,
    text: interpolateVariables(campaign.content_text, dummyRecipient)
  });
}

/**
 * 4. Send Single Test WhatsApp
 */
export async function sendTestWhatsAppCampaign(campaign, testPhone) {
  if (!testPhone || testPhone.length < 10) {
    throw new Error('Please provide a valid test WhatsApp phone number.');
  }

  const dummyRecipient = {
    recipient_name: 'Test Administrator',
    recipient_phone: testPhone
  };

  const messageText = interpolateVariables(campaign.content_text, dummyRecipient);
  return await sendWhatsAppDirect(testPhone, `[TEST MODE]\n\n${messageText}`);
}

