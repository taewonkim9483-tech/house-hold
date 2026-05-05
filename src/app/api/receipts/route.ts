import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AnalyzedReceipt, AnalyzedItem } from '@/types/domain';

function calcPricePer100(item: AnalyzedItem): number | null {
  if (item.weightG) return Math.round((item.unitPrice / item.weightG) * 100);
  if (item.volumeMl) return Math.round((item.unitPrice / item.volumeMl) * 100);
  return null;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Not a group member' }, { status: 403 });

  const groupId: string = member.group_id;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const categoryId = searchParams.get('category_id');
  const userId = searchParams.get('user_id');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  let query = supabase
    .from('receipts')
    .select('id, store_name, purchased_at, total_amount, uploaded_by, created_at', { count: 'exact' })
    .eq('group_id', groupId)
    .order('purchased_at', { ascending: false });

  if (userId) query = query.eq('uploaded_by', userId);
  if (dateFrom) query = query.gte('purchased_at', dateFrom);
  if (dateTo) query = query.lte('purchased_at', dateTo + 'T23:59:59');

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data: receipts, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 카테고리 필터가 있으면 해당 receipt_id만 추출
  let filteredIds: string[] | null = null;
  if (categoryId) {
    const { data: itemRows } = await supabase
      .from('receipt_items')
      .select('receipt_id')
      .eq('category_id', categoryId)
      .in('receipt_id', (receipts ?? []).map((r: { id: string }) => r.id));
    filteredIds = [...new Set((itemRows ?? []).map((r: { receipt_id: string }) => r.receipt_id))];
  }

  const finalReceipts = filteredIds
    ? (receipts ?? []).filter((r: { id: string }) => filteredIds!.includes(r.id))
    : receipts ?? [];

  // 업로더 이름 조회
  const uploaderIds = [...new Set(finalReceipts.map((r: { uploaded_by: string }) => r.uploaded_by))];
  const { data: profiles } = uploaderIds.length > 0
    ? await supabase.from('users').select('id, display_name').in('id', uploaderIds)
    : { data: [] };
  const nameMap = Object.fromEntries(
    (profiles ?? []).map((u: { id: string; display_name: string }) => [u.id, u.display_name])
  );

  // 상품 수 조회
  const receiptIds = finalReceipts.map((r: { id: string }) => r.id);
  const { data: itemCounts } = receiptIds.length > 0
    ? await supabase
        .from('receipt_items')
        .select('receipt_id')
        .in('receipt_id', receiptIds)
    : { data: [] };

  const countMap: Record<string, number> = {};
  for (const row of (itemCounts ?? [])) {
    const r = row as { receipt_id: string };
    countMap[r.receipt_id] = (countMap[r.receipt_id] ?? 0) + 1;
  }

  const result = finalReceipts.map((r: {
    id: string; store_name: string; purchased_at: string;
    total_amount: number; uploaded_by: string; created_at: string;
  }) => ({
    id: r.id,
    store_name: r.store_name,
    purchased_at: r.purchased_at,
    total_amount: r.total_amount,
    uploaded_by: r.uploaded_by,
    uploaded_by_name: nameMap[r.uploaded_by] ?? '',
    item_count: countMap[r.id] ?? 0,
    created_at: r.created_at,
  }));

  return NextResponse.json({ receipts: result, total: count ?? 0 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { receipt, items, imageBase64, imageMimeType } = await request.json() as {
    receipt: AnalyzedReceipt;
    items: AnalyzedItem[];
    imageBase64?: string;
    imageMimeType?: string;
  };

  const { data: member } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return NextResponse.json({ error: 'Not a group member' }, { status: 403 });

  const groupId: string = member.group_id;

  let imageUrl: string | null = null;
  if (imageBase64 && imageMimeType) {
    const ext = imageMimeType.split('/')[1] ?? 'jpg';
    const path = `${groupId}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(imageBase64, 'base64');
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(path, buffer, { contentType: imageMimeType, upsert: false });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }
  }

  const { data: receiptRow, error: receiptError } = await supabase
    .from('receipts')
    .insert({
      group_id: groupId,
      uploaded_by: user.id,
      store_name: receipt.storeName,
      purchased_at: receipt.purchasedAt,
      total_amount: receipt.totalAmount,
      tax_amount: receipt.taxAmount,
      image_url: imageUrl,
    })
    .select('id')
    .single();

  if (receiptError) return NextResponse.json({ error: receiptError.message }, { status: 500 });

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_ko')
    .eq('is_system', true);

  const categoryMap = Object.fromEntries(
    (categories ?? []).map((c: { id: string; name_ko: string }) => [c.name_ko, c.id])
  );

  const itemRows = items.map((item) => ({
    receipt_id: receiptRow.id,
    name: item.name,
    category_id: categoryMap[item.category] ?? null,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    subtotal: item.subtotal,
    unit_type: item.unitType,
    weight_g: item.weightG,
    volume_ml: item.volumeMl,
    price_per_100: item.pricePer100 ?? calcPricePer100(item),
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from('receipt_items')
    .insert(itemRows)
    .select('id');

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  for (let i = 0; i < items.length; i++) {
    const tags = items[i].tags ?? [];
    if (tags.length === 0) continue;
    const itemId = insertedItems[i].id;

    for (const tagName of tags) {
      const { data: tag } = await supabase
        .from('tags')
        .upsert({ name: tagName }, { onConflict: 'name' })
        .select('id')
        .single();

      if (tag) {
        await supabase.from('item_tags').upsert({ item_id: itemId, tag_id: tag.id });
      }
    }
  }

  // 주간 예산 spent_amount 업데이트
  const purchasedDate = new Date(receipt.purchasedAt).toISOString().split('T')[0];
  const { data: budgetWeek } = await supabase
    .from('budget_weeks')
    .select('id, spent_amount')
    .eq('week_start', purchasedDate)
    .lte('week_start', purchasedDate)
    .gte('week_end', purchasedDate)
    .maybeSingle();

  if (budgetWeek) {
    await supabase
      .from('budget_weeks')
      .update({ spent_amount: budgetWeek.spent_amount + receipt.totalAmount })
      .eq('id', budgetWeek.id);
  }

  return NextResponse.json({ receipt_id: receiptRow.id });
}
