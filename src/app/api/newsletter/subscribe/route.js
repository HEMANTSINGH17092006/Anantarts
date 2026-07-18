import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email address is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Upsert or insert subscriber email
    const { data: sub, error } = await supabase
      .from('newsletter_subscribers')
      .upsert({ email }, { onConflict: 'email' })
      .select('*')
      .single();

    if (error) {
      // If already subscribed, return success anyway to keep flow smooth
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'Already subscribed.' });
      }
      console.error('Newsletter Subscription Error:', error);
      return NextResponse.json({ message: 'Failed to subscribe.' }, { status: 500 });
    }

    // Add alert notification for Admin
    await supabase.from('notifications').insert({
      message: `✉️ New Newsletter Subscriber: ${email} joined the inner circle.`,
      is_read: 0,
      type: 'info',
      link: '/admin'
    });

    return NextResponse.json({ success: true, subscriber: sub });
  } catch (err) {
    console.error('Newsletter Route Error:', err);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}
