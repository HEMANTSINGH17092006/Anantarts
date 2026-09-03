import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkAuthRole } from '@/app/actions';

export async function POST(request) {
  try {
    // Enforce Admin Role Security
    await checkAuthRole(['super_admin', 'admin']);
    const supabase = createAdminClient();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, message: 'No image file found in form payload.' }, { status: 400 });
    }

    // Ensure uploads bucket exists
    await supabase.storage.createBucket('uploads', { public: true }).catch(() => {});

    const originalName = file.name || 'image.jpg';
    const fileExt = originalName.split('.').pop().toLowerCase() || 'jpg';
    const cleanFileName = `products/import-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await supabase.storage
      .from('uploads')
      .upload(cleanFileName, buffer, {
        contentType: file.type || `image/${fileExt}`,
        upsert: true
      });

    if (uploadErr) {
      console.error('[Storage Image Upload Error]', uploadErr);
      return NextResponse.json({ success: false, message: 'Supabase Storage error: ' + uploadErr.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(cleanFileName);

    return NextResponse.json({
      success: true,
      publicUrl: publicUrlData?.publicUrl || ''
    });

  } catch (err) {
    console.error('[Upload API Exception]', err);
    return NextResponse.json({ success: false, message: err.message || 'Upload failed' }, { status: 500 });
  }
}
