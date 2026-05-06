import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name)')
    .eq('user_id', user.id);

  const groups = (memberships ?? []).map((m: {
    group_id: string;
    groups: { id: string; name: string } | null;
  }) => ({
    id: m.group_id,
    name: m.groups?.name ?? '',
  }));

  return NextResponse.json({ groups });
}
