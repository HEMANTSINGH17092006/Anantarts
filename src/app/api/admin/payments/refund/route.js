import { NextResponse } from 'next/server';
import { checkAuthRole } from '@/app/actions';
import { refundPayment } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req) {
  try {
    const session = await checkAuthRole(['super_admin', 'admin']);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized. Only Super Admin and Admin can process refunds.' }, { status: 401 });
    }

    const { order_id, payment_id, amount, reason } = await req.json();

    if (!payment_id) {
      return NextResponse.json({ message: 'Missing payment ID.' }, { status: 400 });
    }

    console.log(`[Admin Refund Request] Admin ${session.email} refunding payment ${payment_id} (Amount: ₹${amount || 'Full'})...`);

    const result = await refundPayment(payment_id, amount, {
      reason: reason || 'Customer refund',
      processed_by: session.email
    });

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        message: result.message || 'Refund processing failed.' 
      }, { status: 400 });
    }

    // Update database order record
    const supabase = createAdminClient();
    await supabase
      .from('orders')
      .update({
        payment_status: 'Refunded',
        refund_status: 'full',
        refund_id: result.refund?.id || 'refund_processed',
        order_status: 'Cancelled',
        notes: `Refund processed by ${session.email}. Refund ID: ${result.refund?.id || 'N/A'}. Reason: ${reason || 'Customer refund'}`
      })
      .eq('id', order_id);

    return NextResponse.json({
      success: true,
      message: `Refund of ₹${amount || 'full amount'} processed successfully! Refund ID: ${result.refund?.id || 'Success'}`
    });
  } catch (err) {
    console.error('API /api/admin/payments/refund error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
