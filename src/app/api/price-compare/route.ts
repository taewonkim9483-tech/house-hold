import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { identifyProduct } from '@/lib/gemini/identifyProduct';
import { PriceCompareResult, PriceHistoryRecord, SimilarItem } from '@/types/domain';

interface ReceiptRow { store_name: string; purchased_at: string; group_id: string }
interface SameProductRow {
  id: string;
  unit_price: number;
  price_per_100: number | null;
  receipts: ReceiptRow | ReceiptRow[] | null;
}
interface TagRow { name: string }
interface ItemRow {
  id: string; name: string; unit_price: number; price_per_100: number | null;
  weight_g: number | null; volume_ml: number | null;
  receipts: ReceiptRow | ReceiptRow[] | null;
}
interface ItemTagRow {
  item_id: string; tag_id: string;
  tags: TagRow | TagRow[] | null;
  receipt_items: ItemRow | ItemRow[] | null;
}

function firstReceipt(r: ReceiptRow | ReceiptRow[] | null): ReceiptRow | null {
  if (!r) return null;
  return Array.isArray(r) ? r[0] : r;
}
function firstItem(r: ItemRow | ItemRow[] | null): ItemRow | null {
  if (!r) return null;
  return Array.isArray(r) ? r[0] : r;
}
function firstTag(r: TagRow | TagRow[] | null): TagRow | null {
  if (!r) return null;
  return Array.isArray(r) ? r[0] : r;
}

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

  // 그룹 확인
  const { data: memberRow } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!memberRow) return NextResponse.json({ error: 'No group' }, { status: 403 });
  const groupId = memberRow.group_id as string;

  // Gemini로 상품 식별
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const identified = await identifyProduct(base64, file.type);

  // 1단계: 동일 상품 검색
  const { data: sameRaw } = await supabase
    .from('receipt_items')
    .select(`
      id,
      unit_price,
      price_per_100,
      receipts!inner(store_name, purchased_at, group_id)
    `)
    .ilike('name', `%${identified.name}%`)
    .eq('receipts.group_id', groupId)
    .order('receipts(purchased_at)', { ascending: false }) as { data: SameProductRow[] | null };

  const sameRecords: PriceHistoryRecord[] = (sameRaw ?? []).map((row) => {
    const receipt = firstReceipt(row.receipts);
    return {
      store_name: receipt?.store_name ?? '',
      purchased_at: receipt?.purchased_at ?? '',
      unit_price: row.unit_price,
      price_per_100: row.price_per_100,
      is_lowest: false,
    };
  });

  // 최저가 플래그
  if (sameRecords.length > 0) {
    const minVal = Math.min(
      ...sameRecords.map((r) => r.price_per_100 ?? r.unit_price)
    );
    for (const r of sameRecords) {
      r.is_lowest = (r.price_per_100 ?? r.unit_price) === minVal;
    }
  }

  // 2단계: 태그 기반 유사 상품 검색
  const sameItemIds = (sameRaw ?? []).map((r) => r.id);
  let similarItems: SimilarItem[] = [];

  if (identified.tags.length > 0) {
    const { data: matchedTags } = await supabase
      .from('tags')
      .select('id, name')
      .in('name', identified.tags);

    const tagIds = (matchedTags ?? []).map((t) => (t as { id: string }).id);

    if (tagIds.length > 0) {
      let itemTagsQuery = supabase
        .from('item_tags')
        .select(`
          item_id,
          tag_id,
          tags!inner(name),
          receipt_items!inner(
            id, name, unit_price, price_per_100, weight_g, volume_ml,
            receipts!inner(store_name, purchased_at, group_id)
          )
        `)
        .in('tag_id', tagIds)
        .eq('receipt_items.receipts.group_id', groupId);

      if (sameItemIds.length > 0) {
        itemTagsQuery = itemTagsQuery.not('item_id', 'in', `(${sameItemIds.join(',')})`);
      }

      const { data: taggedRaw } = await itemTagsQuery as { data: ItemTagRow[] | null };

      const itemMap = new Map<string, {
        name: string; unit_price: number; price_per_100: number | null;
        weight_g: number | null; volume_ml: number | null;
        store_name: string; purchased_at: string; tags: string[];
      }>();

      for (const row of (taggedRaw ?? [])) {
        const item = firstItem(row.receipt_items);
        if (!item) continue;
        const receipt = firstReceipt(item.receipts);
        const tag = firstTag(row.tags);

        if (itemMap.has(row.item_id)) {
          const existing = itemMap.get(row.item_id)!;
          if (tag?.name && !existing.tags.includes(tag.name)) {
            existing.tags.push(tag.name);
          }
        } else {
          itemMap.set(row.item_id, {
            name: item.name,
            unit_price: item.unit_price,
            price_per_100: item.price_per_100,
            weight_g: item.weight_g,
            volume_ml: item.volume_ml,
            store_name: receipt?.store_name ?? '',
            purchased_at: receipt?.purchased_at ?? '',
            tags: tag?.name ? [tag.name] : [],
          });
        }
      }

      similarItems = Array.from(itemMap.values()).map((item) => ({
        name: item.name,
        brand: '',
        weight_g: item.weight_g,
        volume_ml: item.volume_ml,
        latest_price: {
          store_name: item.store_name,
          purchased_at: item.purchased_at,
          unit_price: item.unit_price,
          price_per_100: item.price_per_100,
          is_lowest: false,
        },
        matched_tags: item.tags,
      }));
    }
  }

  const result: PriceCompareResult = {
    identified,
    same_product: sameRecords,
    similar_products: similarItems,
  };

  return NextResponse.json(result);
}
