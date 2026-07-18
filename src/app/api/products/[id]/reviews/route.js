import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    // Await params as required in Next.js 15+
    const resolvedParams = await params;
    const { id: productId } = resolvedParams;

    const { name, email, rating, comment } = await request.json();

    if (!name || !email || !rating || !comment) {
      return NextResponse.json({ message: 'All review fields are required.' }, { status: 400 });
    }

    const ratingVal = parseInt(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return NextResponse.json({ message: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Insert review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        product_id: parseInt(productId),
        reviewer_name: name,
        reviewer_email: email,
        rating: ratingVal,
        comment,
        is_approved: 1 // auto-approve for now
      })
      .select('*')
      .single();

    if (error || !review) {
      console.error('Review Insert Error:', error);
      return NextResponse.json({ message: 'Failed to save review in database.' }, { status: 500 });
    }

    // Add alert notification for Admin
    await supabase.from('notifications').insert({
      message: `✍️ New Review: ${name} rated a product ${ratingVal} Stars: "${comment.slice(0, 50)}..."`,
      is_read: 0,
      type: 'info',
      link: '/admin'
    });

    return NextResponse.json({ success: true, review });
  } catch (err) {
    console.error('Review Route Error:', err);
    return NextResponse.json({ message: 'Internal server error while processing review.' }, { status: 500 });
  }
}
