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

  if (!budget) return NextResponse.json(null);

  const { weekStart, weekEnd } = getWeekRange(new Date());
  const { data: week } = await supabase
    .from('budget_weeks')
    .select('id, week_start, week_end, base_amount, spent_amount, status')
    .eq('budget_id', budget.id)
    .eq('week_start', weekStart)
    .maybeSingle();

  // 실제 영수증 합산으로 spent_amount 계산 (budget_weeks 동기화 오류 방지)
  const { data: receipts } = await supabase
    .from('receipts')
    .select('total_amount')
    .eq('group_id', member.group_id)
    .gte('purchased_at', weekStart)
    .lte('purchased_at', weekEnd + 'T23:59:59');
  const spent_amount = (receipts ?? []).reduce((s, r) => s + r.total_amount, 0);

  const base_amount = week?.base_amount ?? budget.weekly_amount;
  const remaining = base_amount - spent_amount;

  return NextResponse.json({
    week_id: week?.id ?? null,
    week_start: weekStart,
    week_end: weekEnd,
    base_amount,
    spent_amount,
    remaining,
    is_over: remaining < 0,
    status: week?.status ?? 'open',
  });
}
