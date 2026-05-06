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

  if (!week) {
    return NextResponse.json({
      week_id: null,
      week_start: weekStart,
      week_end: weekEnd,
      base_amount: budget.weekly_amount,
      spent_amount: 0,
      remaining: budget.weekly_amount,
      is_over: false,
      status: 'open',
    });
  }

  const remaining = week.base_amount - week.spent_amount;
  return NextResponse.json({
    week_id: week.id,
    week_start: week.week_start,
    week_end: week.week_end,
    base_amount: week.base_amount,
    spent_amount: week.spent_amount,
    remaining,
    is_over: remaining < 0,
    status: week.status,
  });
}
