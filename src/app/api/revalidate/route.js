import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');

  if (!tag) {
    return NextResponse.json({ message: 'Tag parameter is required' }, { status: 400 });
  }

  try {
    revalidateTag(tag);
    return NextResponse.json({ revalidated: true, tag, timestamp: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
