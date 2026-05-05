import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AnalyzedReceipt, AnalyzedItem } from '@/types/domain';

function calcPricePer100(item: AnalyzedItem): number | null {
  if (item.weightG) return Math.round((item.unitPrice / item.weightG) * 100);
  if (item.volumeMl) return Math.round((item.unitPrice / item.volumeMl) * 100);
  return null;
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
