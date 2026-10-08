import { NextResponse } from 'next/server';
import { checkAuthRole } from '@/app/actions';
import { processCampaignBatch } from '@/lib/marketing-queue-service';

export async function POST(request) {
  try {
    // Role check: manager, admin, super_admin
    await checkAuthRole(['super_admin', 'admin', 'manager']);

    const body = await request.json();
    const { campaignId, batchSize = 15 } = body;

    if (!campaignId) {
      return NextResponse.json({ success: false, error: 'Campaign ID is required' }, { status: 400 });
    }

    const result = await processCampaignBatch(campaignId, batchSize);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[Process Batch Route Error]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
