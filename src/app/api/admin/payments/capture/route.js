import { NextResponse } from 'next/server';
import { checkAuthRole } from '@/app/actions';
import { capturePayment } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req) {
  try {
    const session = await checkAuthRole(['super_admin', 'admin', 'manager']);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized access.' }, { status: 401 });
    }

    const { order_id, payment_id, amount } = await req.json();

    if (!payment_id || !amount) {
      return NextResponse.json({ message: 'Missing payment ID or amount.' }, { status: 400 });
    }

    console.log(`[Admin Manual Capture Request] Admin ${session.email} capturing payment ${payment_id} for order ID ${order_id}...`);

    const result = await capturePayment(payment_id, amount);

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        message: result.error?.description || result.error || 'Failed to capture payment with Razorpay.' 
      }, { status: 400 });
    }

    // Update database record
    const supabase = createAdminClient();
    await supabase
      .from('orders')
      .update({
        payment_status: 'Captured',
        captured_at: new Date().toISOString(),
        notes: `Manually captured by admin ${session.email} on ${new Date().toLocaleString('en-IN')}`
      })
      .eq('id', order_id);

    return NextResponse.json({
      success: true,
      message: `Payment ${payment_id} successfully captured!`
    });
  } catch (err) {
    console.error('API /api/admin/payments/capture error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
