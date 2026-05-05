import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d);
  start.setDate(diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

interface ItemRow {
  subtotal: number;
  category_id: string | null;
  categories: { id: string; name_ko: string; name_ja: string; icon: string } | null;
}

export async function GET() {
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
  const { start, end } = getWeekRange(new Date());

  // 주간 예산: budgets → budget_weeks 조인
  const { data: budgetRow } = await supabase
    .from('budgets')
    .select('id, weekly_amount')
    .eq('group_id', groupId)
    .maybeSingle();

  let budget = 0;
  let spent = 0;

  if (budgetRow) {
    const { data: weekRow } = await supabase
      .from('budget_weeks')
      .select('base_amount, spent_amount')
      .eq('budget_id', budgetRow.id)
      .gte('week_start', start)
      .lte('week_end', end)
      .maybeSingle();

    budget = weekRow?.base_amount ?? budgetRow.weekly_amount;
    spent = weekRow?.spent_amount ?? 0;
  }

  // 이번 주 영수증 집계 (카테고리별)
  const { data: weekReceipts } = await supabase
    .from('receipts')
    .select('id, total_amount')
    .eq('group_id', groupId)
    .gte('purchased_at', start)
    .lte('purchased_at', end + 'T23:59:59');

  const receiptIds = (weekReceipts ?? []).map((r) => (r as { id: string }).id);

  let categoryBreakdown: Array<{
    category_id: string;
    name_ko: string;
    name_ja: string;
    icon: string;
    amount: number;
    ratio: number;
  }> = [];

  if (receiptIds.length > 0) {
    const { data: itemsRaw } = await supabase
      .from('receipt_items')
      .select('subtotal, category_id, categories(id, name_ko, name_ja, icon)')
      .in('receipt_id', receiptIds);

    const items = (itemsRaw ?? []) as unknown as ItemRow[];
    const catMap = new Map<string, { name_ko: string; name_ja: string; icon: string; amount: number }>();
    const totalSpent = (weekReceipts ?? []).reduce(
      (sum, r) => sum + (r as { total_amount: number }).total_amount, 0
    );

    for (const item of items) {
      const cat = item.categories;
      const catId = item.category_id ?? 'other';
      const catInfo = cat ?? { id: 'other', name_ko: '기타', name_ja: 'その他', icon: '📦' };
      const existing = catMap.get(catId);
      catMap.set(catId, {
        name_ko: catInfo.name_ko,
        name_ja: catInfo.name_ja,
        icon: catInfo.icon,
        amount: (existing?.amount ?? 0) + (item.subtotal ?? 0),
      });
    }

    categoryBreakdown = Array.from(catMap.entries())
      .map(([cat_id, v]) => ({
        category_id: cat_id,
        ...v,
        ratio: totalSpent > 0 ? Math.round((v.amount / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  // 최근 영수증 5건
  const { data: recentRaw } = await supabase
    .from('receipts')
    .select('id, store_name, purchased_at, total_amount, uploaded_by')
    .eq('group_id', groupId)
    .order('purchased_at', { ascending: false })
    .limit(5);

  const uploaderIds = [...new Set((recentRaw ?? []).map((r) => (r as { uploaded_by: string }).uploaded_by))];
  const { data: uploaderProfiles } = uploaderIds.length > 0
    ? await supabase.from('users').select('id, display_name').in('id', uploaderIds)
    : { data: [] };

  const nameMap = Object.fromEntries(
    (uploaderProfiles ?? []).map((u) => {
      const row = u as { id: string; display_name: string };
      return [row.id, row.display_name];
    })
  );

  const recentReceipts = (recentRaw ?? []).map((r) => {
    const row = r as { id: string; store_name: string; purchased_at: string; total_amount: number; uploaded_by: string };
    return {
      id: row.id,
      store_name: row.store_name,
      purchased_at: row.purchased_at,
      total_amount: row.total_amount,
      uploaded_by_name: nameMap[row.uploaded_by] ?? '',
    };
  });

  return NextResponse.json({
    week: { budget, spent, remaining: budget - spent, start, end },
    category_breakdown: categoryBreakdown,
    recent_receipts: recentReceipts,
  });
}
