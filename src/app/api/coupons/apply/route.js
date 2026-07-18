import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { code, subtotal } = await req.json();
    if (!code) {
      return NextResponse.json({ message: 'Coupon code is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Query coupon code details
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('is_active', 1)
      .single();

    if (error || !coupon) {
      return NextResponse.json({ message: 'Invalid or inactive coupon code.' }, { status: 404 });
    }

    // 1. Check minimum purchase amount
    if (subtotal < (coupon.min_order_amount || 0)) {
      return NextResponse.json({ 
        message: `This coupon requires a minimum purchase amount of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(coupon.min_order_amount)}.` 
      }, { status: 400 });
    }

    // 2. Check validity dates
    const now = new Date();
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return NextResponse.json({ message: 'This coupon promo has not started yet.' }, { status: 400 });
    }
    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return NextResponse.json({ message: 'This coupon promo has expired.' }, { status: 400 });
    }

    // 3. Check usage limit
    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      return NextResponse.json({ message: 'This coupon code limit has been reached.' }, { status: 400 });
    }

    return NextResponse.json({ coupon });
  } catch (err) {
    console.error('Coupon Apply Error:', err);
    return NextResponse.json({ message: 'Internal server error while applying coupon.' }, { status: 500 });
  }
}
