import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ItemRow {
  subtotal: number;
  category_id: string | null;
  receipt_id: string;
  categories: { id: string; name_ko: string; name_ja: string; icon: string } | null;
}

interface ReceiptRow {
  id: string;
  total_amount: number;
  purchased_at: string;
  uploaded_by: string;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') ?? '0');
  const month = parseInt(searchParams.get('month') ?? '0');

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid year/month' }, { status: 400 });
  }

  const { data: member } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: 'Not a group member' }, { status: 403 });

  const groupId: string = member.group_id;

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  // 해당 월 영수증
  const { data: receiptsRaw } = await supabase
    .from('receipts')
    .select('id, total_amount, purchased_at, uploaded_by')
    .eq('group_id', groupId)
    .gte('purchased_at', monthStart)
    .lt('purchased_at', monthEnd)
    .order('purchased_at', { ascending: true });

  const receipts = (receiptsRaw ?? []) as ReceiptRow[];
  const receiptIds = receipts.map((r) => r.id);
  const totalAmount = receipts.reduce((sum, r) => sum + r.total_amount, 0);
  const receiptCount = receipts.length;

  // 일별 집계
  const dailyMap = new Map<string, number>();
  for (const r of receipts) {
    const date = r.purchased_at.split('T')[0];
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + r.total_amount);
  }
  const dailyBreakdown = Array.from(dailyMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 카테고리별 집계
  let categoryBreakdown: Array<{
    category_id: string;
    name_ko: string;
    name_ja: string;
    icon: string;
    amount: number;
    ratio: number;
    item_count: number;
  }> = [];

  if (receiptIds.length > 0) {
    const { data: itemsRaw } = await supabase
      .from('receipt_items')
      .select('subtotal, category_id, receipt_id, categories(id, name_ko, name_ja, icon)')
      .in('receipt_id', receiptIds);

    const items = (itemsRaw ?? []) as unknown as ItemRow[];
    const catMap = new Map<string, { name_ko: string; name_ja: string; icon: string; amount: number; item_count: number }>();

    for (const item of items) {
      const catId = item.category_id ?? 'other';
      const cat = item.categories ?? { id: 'other', name_ko: '기타', name_ja: 'その他', icon: '📦' };
      const existing = catMap.get(catId);
      catMap.set(catId, {
        name_ko: cat.name_ko,
        name_ja: cat.name_ja,
        icon: cat.icon,
        amount: (existing?.amount ?? 0) + (item.subtotal ?? 0),
        item_count: (existing?.item_count ?? 0) + 1,
      });
    }

    categoryBreakdown = Array.from(catMap.entries())
      .map(([cat_id, v]) => ({
        category_id: cat_id,
        ...v,
        ratio: totalAmount > 0 ? Math.round((v.amount / totalAmount) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // 멤버별 집계 (그룹 모드)
  const memberMap = new Map<string, number>();
  for (const r of receipts) {
    memberMap.set(r.uploaded_by, (memberMap.get(r.uploaded_by) ?? 0) + r.total_amount);
  }
  const uploaderIds = [...memberMap.keys()];
  const { data: profiles } = uploaderIds.length > 0
    ? await supabase.from('users').select('id, display_name').in('id', uploaderIds)
    : { data: [] };

  const nameMap = Object.fromEntries(
    (profiles ?? []).map((u) => {
      const row = u as { id: string; display_name: string };
      return [row.id, row.display_name];
    })
  );

  const memberBreakdown = Array.from(memberMap.entries())
    .map(([userId, amount]) => ({
      user_id: userId,
      display_name: nameMap[userId] ?? userId,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 전월 합계
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const { data: prevReceipts } = await supabase
    .from('receipts')
    .select('total_amount')
    .eq('group_id', groupId)
    .gte('purchased_at', prevStart)
    .lt('purchased_at', monthStart);

  const prevMonthTotal = (prevReceipts ?? []).reduce(
    (sum, r) => sum + (r as { total_amount: number }).total_amount, 0
  );

  return NextResponse.json({
    year,
    month,
    total_amount: totalAmount,
    receipt_count: receiptCount,
    daily_breakdown: dailyBreakdown,
    category_breakdown: categoryBreakdown,
    member_breakdown: memberBreakdown,
    prev_month_total: prevMonthTotal,
  });
}
