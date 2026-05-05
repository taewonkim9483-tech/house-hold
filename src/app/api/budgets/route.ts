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
    .single();
  if (!member) return NextResponse.json({ error: 'Not a group member' }, { status: 403 });

  const { data: budget } = await supabase
    .from('budgets')
    .select('id, weekly_amount')
    .eq('group_id', member.group_id)
    .maybeSingle();

  if (!budget) return NextResponse.json({ budget: null, weeks: [] });

  const { data: weeks } = await supabase
    .from('budget_weeks')
    .select('id, week_start, week_end, base_amount, spent_amount, status')
    .eq('budget_id', budget.id)
    .order('week_start', { ascending: false })
    .limit(8);

  return NextResponse.json({ budget, weeks: weeks ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { weekly_amount } = await request.json() as { weekly_amount: number };
  if (!Number.isInteger(weekly_amount) || weekly_amount <= 0) {
    return NextResponse.json({ error: 'Invalid weekly_amount' }, { status: 400 });
  }

  const { data: member } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .single();
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
