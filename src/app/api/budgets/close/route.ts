import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getISOWeekLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { week_id, to_carry_over, to_savings_pool } = await request.json() as {
    week_id: string;
    to_carry_over: number;
    to_savings_pool: number;
  };

  const { data: member } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Not a group member' }, { status: 403 });

  const { data: week } = await supabase
    .from('budget_weeks')
    .select('id, budget_id, week_end, base_amount, spent_amount, status')
    .eq('id', week_id)
    .single();

  if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 });
  if (week.status === 'closed') return NextResponse.json({ error: 'Already closed' }, { status: 400 });

  const { data: budget } = await supabase
    .from('budgets')
    .select('id, weekly_amount, group_id')
    .eq('id', week.budget_id)
    .single();

  if (!budget || budget.group_id !== member.group_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const remaining = week.base_amount - week.spent_amount;
  const isOver = remaining < 0;

  if (!isOver && to_carry_over + to_savings_pool !== remaining) {
    return NextResponse.json(
      { error: `합계가 잔액(¥${remaining})과 맞지 않습니다` },
      { status: 400 }
    );
  }

  await supabase.from('budget_closings').insert({
    budget_week_id: week.id,
    remaining,
    to_carry_over: isOver ? 0 : to_carry_over,
    to_savings_pool: isOver ? 0 : to_savings_pool,
    closed_by: user.id,
  });

  await supabase.from('budget_weeks').update({ status: 'closed' }).eq('id', week.id);

  const weekEndDate = new Date(week.week_end);
  const nextStart = new Date(weekEndDate);
  nextStart.setDate(weekEndDate.getDate() + 1);
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextStart.getDate() + 6);

  let nextBase = isOver
    ? budget.weekly_amount + remaining  // weekly_amount - 초과액
    : budget.weekly_amount + to_carry_over;
  if (nextBase < 0) nextBase = 0;

  await supabase.from('budget_weeks').upsert({
    budget_id: week.budget_id,
    week_start: nextStart.toISOString().split('T')[0],
    week_end: nextEnd.toISOString().split('T')[0],
    base_amount: nextBase,
  }, { onConflict: 'budget_id,week_start' });

  if (!isOver && to_savings_pool > 0) {
    const { data: pool } = await supabase
      .from('savings_pool')
      .select('id, total_amount')
      .eq('group_id', member.group_id)
      .maybeSingle();

    let poolId: string;
    if (pool) {
      await supabase
        .from('savings_pool')
        .update({ total_amount: pool.total_amount + to_savings_pool, updated_at: new Date().toISOString() })
        .eq('id', pool.id);
      poolId = pool.id;
    } else {
      const { data: newPool } = await supabase
        .from('savings_pool')
        .insert({ group_id: member.group_id, total_amount: to_savings_pool })
        .select('id')
        .single();
      poolId = newPool!.id;
    }

    await supabase.from('savings_pool_logs').insert({
      pool_id: poolId,
      amount: to_savings_pool,
      reason: 'weekly_closing',
      week_label: getISOWeekLabel(week.week_end),
    });
  }

  return NextResponse.json({ next_week_budget: nextBase });
}
