import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: receipt, error } = await supabase
    .from('receipts')
    .select('id, group_id, store_name, purchased_at, total_amount, tax_amount, image_url, uploaded_by, created_at')
    .eq('id', id)
    .single();

  if (error || !receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // 멤버 확인
  const { data: member } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .eq('group_id', receipt.group_id)
    .single();

  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: items } = await supabase
    .from('receipt_items')
    .select('id, name, category_id, quantity, unit_price, subtotal, unit_type, weight_g, volume_ml, price_per_100, categories(name_ko, name_ja, icon)')
    .eq('receipt_id', id)
    .order('subtotal', { ascending: false });

  const { data: uploader } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', receipt.uploaded_by)
    .single();

  return NextResponse.json({
    receipt: {
      ...receipt,
      uploaded_by_name: uploader?.display_name ?? '',
    },
    items: items ?? [],
  });
}
