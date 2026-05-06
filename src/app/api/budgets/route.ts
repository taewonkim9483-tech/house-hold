import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getWeekRange(date: Date): { weekStart: string; weekEnd: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() + diffToMon);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: 'Not a group member' }, { status: 403 });

  const { data: budget } = await supabase
    .from('budgets')
    .select('id, weekly_amount')
    .eq('group_id', member.group_id)
    .maybeSingle();

  if (!budget) return NextResponse.json({ budget: null, weeks: [] });

  // 현재 주 행이 없으면 자동 생성
  const { weekStart, weekEnd } = getWeekRange(new Date());
  const { data: currentWeekRow } = await supabase
    .from('budget_weeks')
    .select('id')
    .eq('budget_id', budget.id)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (!currentWeekRow) {
    await supabase.from('budget_weeks').insert({
      budget_id: budget.id,
      week_start: weekStart,
      week_end: weekEnd,
      base_amount: budget.weekly_amount,
    });
  }

  const { data: weeksRaw } = await supabase
    .from('budget_weeks')
    .select('id, week_start, week_end, base_amount, spent_amount, status')
    .eq('budget_id', budget.id)
    .order('week_start', { ascending: false })
    .limit(8);

  // open/pending_close 주는 실제 영수증 합산으로 spent_amount 재계산
  const weeks = await Promise.all(
    (weeksRaw ?? []).map(async (w) => {
      const isOpen = w.status === 'open' || w.status === 'pending_close';
      if (!isOpen) return w;
      const { data: receipts } = await supabase
        .from('receipts')
        .select('total_amount')
        .eq('group_id', member.group_id)
        .gte('purchased_at', w.week_start)
        .lte('purchased_at', w.week_end + 'T23:59:59');
      const spent_amount = (receipts ?? []).reduce((s, r) => s + r.total_amount, 0);
      return { ...w, spent_amount };
    })
  );

  return NextResponse.json({ budget, weeks });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { weekly_amount, group_id } = await request.json() as { weekly_amount: number; group_id?: string };
  if (!Number.isInteger(weekly_amount) || weekly_amount <= 0) {
    return NextResponse.json({ error: 'Invalid weekly_amount' }, { status: 400 });
  }

  let query = supabase.from('group_members').select('group_id').eq('user_id', user.id);
  if (group_id) query = query.eq('group_id', group_id);
  const { data: member } = await query.limit(1).maybeSingle();
  if (!member) return NextResponse.json({ error: 'Not a group member' }, { status: 403 });

  const { data: budget, error: upsertError } = await supabase
    .from('budgets')
    .upsert(
      { group_id: member.group_id, weekly_amount, updated_at: new Date().toISOString() },
      { onConflict: 'group_id' }
    )
    .select('id')
    .single();

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  const { weekStart, weekEnd } = getWeekRange(new Date());
  const { data: existing } = await supabase
    .from('budget_weeks')
    .select('id')
    .eq('budget_id', budget.id)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (!existing) {
    await supabase.from('budget_weeks').insert({
      budget_id: budget.id,
      week_start: weekStart,
      week_end: weekEnd,
      base_amount: weekly_amount,
    });
  }

  return NextResponse.json({ success: true });
}
