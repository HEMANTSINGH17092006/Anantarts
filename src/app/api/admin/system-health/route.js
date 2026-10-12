import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkAuthRole } from '@/app/actions';

export const dynamic = 'force-dynamic';

function maskEmail(email) {
  if (!email || typeof email !== 'string') return '[REDACTED]';
  const parts = email.split('@');
  if (parts.length !== 2) return '[REDACTED]';
  const [local, domain] = parts;
  return `${local.charAt(0)}***@${domain}`;
}

function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '[REDACTED]';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 4) return '******';
  return `******${clean.slice(-4)}`;
}

function sanitizeJobPayload(rawPayload) {
  if (!rawPayload) return {};
  let parsed = rawPayload;
  if (typeof rawPayload === 'string') {
    try {
      parsed = JSON.parse(rawPayload);
    } catch {
      return '[REDACTED_PAYLOAD]';
    }
  }

  if (typeof parsed !== 'object' || parsed === null) return parsed;

  const sanitized = { ...parsed };

  // Mask order PII if present in job payload
  if (sanitized.order && typeof sanitized.order === 'object') {
    sanitized.order = {
      ...sanitized.order,
      customer_name: sanitized.order.customer_name ? `${sanitized.order.customer_name.charAt(0)}***` : undefined,
      customer_email: maskEmail(sanitized.order.customer_email),
      customer_phone: maskPhone(sanitized.order.customer_phone),
      shipping_address: '[REDACTED_DELIVERY_ADDRESS]',
      billing_address: '[REDACTED_DELIVERY_ADDRESS]'
    };
  }

  if (sanitized.to) {
    sanitized.to = maskEmail(sanitized.to);
  }
  if (sanitized.phone) {
    sanitized.phone = maskPhone(sanitized.phone);
  }

  return sanitized;
}

export async function GET() {
  try {
    const admin = await checkAuthRole(['admin', 'super_admin']);
    if (!admin) {
      return NextResponse.json({ message: 'Unauthorized. Admin access required.' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ message: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const { data: audits } = await supabase
      .from('payment_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: rawJobs } = await supabase
      .from('background_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: locks } = await supabase
      .from('inventory_locks')
      .select('*')
      .order('created_at', { ascending: false });

    // Sanitize customer PII from job payloads
    const jobs = (rawJobs || []).map((job) => ({
      ...job,
      payload: sanitizeJobPayload(job.payload)
    }));

    return NextResponse.json({ audits, jobs, locks });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
