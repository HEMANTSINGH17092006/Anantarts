import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const nextPublicRazorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    domain: process.env.NEXT_PUBLIC_SITE_URL || 'Not Set',
    keys: {
      backendKeyLoaded: !!razorpayKeyId,
      backendKeyPrefix: razorpayKeyId ? razorpayKeyId.substring(0, 8) + '...' : 'Missing',
      secretLoaded: !!razorpayKeySecret,
      secretPrefix: razorpayKeySecret ? razorpayKeySecret.substring(0, 4) + '...' : 'Missing',
      frontendKeyLoaded: !!nextPublicRazorpayKeyId,
      frontendKeyPrefix: nextPublicRazorpayKeyId ? nextPublicRazorpayKeyId.substring(0, 8) + '...' : 'Missing'
    },
    keyMismatchCheck: {
      isBackendAndFrontendKeySame: razorpayKeyId === nextPublicRazorpayKeyId,
      isLiveMode: (razorpayKeyId || '').startsWith('rzp_live_')
    }
  });
}
