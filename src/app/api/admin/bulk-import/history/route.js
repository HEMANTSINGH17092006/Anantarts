import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkAuthRole } from '@/app/actions';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function GET() {
  try {
    await checkAuthRole(['super_admin', 'admin']);
    const supabase = createAdminClient();

    const { data: sessions, error } = await supabase
      .from('import_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, sessions: sessions || [] });
  } catch (err) {
    console.error('[BulkImport History GET Error]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const adminUser = await checkAuthRole(['super_admin', 'admin']);
    const supabase = createAdminClient();

    const body = await request.json();
    const { action, sessionId } = body;

    if (action === 'rollback') {
      if (!sessionId) {
        return NextResponse.json({ success: false, message: 'Missing sessionId parameter.' }, { status: 400 });
      }

      // Fetch mapping records for this session
      const { data: mappings, error: mapErr } = await supabase
        .from('import_products')
        .select('*')
        .eq('import_session_id', sessionId);

      if (mapErr) throw mapErr;

      let rolledBackCount = 0;

      for (const mapItem of mappings || []) {
        if (mapItem.action_type === 'created') {
          // Delete product created during this import
          await supabase.from('products').delete().eq('id', mapItem.product_id);
          rolledBackCount++;
        } else if (mapItem.action_type === 'updated' || mapItem.action_type === 'replaced') {
          // Restore previous product state from snapshot file if available
          if (mapItem.snapshot_file_path) {
            try {
              let prev = null;
              if (mapItem.snapshot_file_path.startsWith('http')) {
                const res = await fetch(mapItem.snapshot_file_path);
                prev = await res.json();
              } else {
                const { data: snapData } = await supabase.storage
                  .from('uploads')
                  .download(mapItem.snapshot_file_path);
                if (snapData) {
                  const text = await snapData.text();
                  prev = JSON.parse(text);
                }
              }

              if (prev) {
                await supabase
                  .from('products')
                  .update({
                    name: prev.name,
                    price: prev.price,
                    discount_price: prev.discount_price,
                    stock_quantity: prev.stock_quantity,
                    description: prev.description,
                    tags: prev.tags,
                    category_id: prev.category_id
                  })
                  .eq('id', mapItem.product_id);

                rolledBackCount++;
              }
            } catch (pErr) {
              console.error('[Rollback Snapshot Restoration Warning]', pErr);
            }
          }
        }
      }

      // Update session status
      await supabase
        .from('import_sessions')
        .update({
          status: 'rolled_back',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      revalidateTag('products');
      revalidateTag('categories');
      revalidatePath('/admin/products');

      return NextResponse.json({
        success: true,
        message: `Rollback completed. ${rolledBackCount} product action(s) reverted.`,
        rolledBackCount
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action parameter.' }, { status: 400 });

  } catch (err) {
    console.error('[BulkImport History POST Error]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
