import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeReceiptImage } from '@/lib/gemini/analyzeReceipt';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('image') as File | null;
  if (!file) return NextResponse.json({ error: 'image is required' }, { status: 400 });

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  const result = await analyzeReceiptImage(base64, file.type);
  return NextResponse.json(result);
}
