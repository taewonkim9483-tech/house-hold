import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  const { data: pool } = await supabase
    .from('savings_pool')
    .select('id, total_amount')
    .eq('group_id', member.group_id)
    .maybeSingle();

  if (!pool) {
    return NextResponse.json({ total_amount: 0, logs: [] });
  }

  const { data: logs } = await supabase
    .from('savings_pool_logs')
    .select('amount, reason, week_label, created_at')
    .eq('pool_id', pool.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ total_amount: pool.total_amount, logs: logs ?? [] });
}
