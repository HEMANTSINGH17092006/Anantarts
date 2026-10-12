import { NextResponse } from 'next/server';
import { checkAuthRole } from '@/app/actions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await checkAuthRole(['admin', 'super_admin']);
    if (!admin) {
      return NextResponse.json({ message: 'Unauthorized. Admin access required.' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ message: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const nextPublicRazorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    domain: process.env.NEXT_PUBLIC_SITE_URL || 'Not Set',
    keys: {
      backendKeyLoaded: !!razorpayKeyId,
      secretLoaded: !!razorpayKeySecret,
      frontendKeyLoaded: !!nextPublicRazorpayKeyId,
    },
    keyMismatchCheck: {
      isBackendAndFrontendKeySame: razorpayKeyId === nextPublicRazorpayKeyId,
      isLiveMode: (razorpayKeyId || '').startsWith('rzp_live_')
    }
  });
}
