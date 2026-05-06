import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string; userId: string }> }
) {
  const { groupId, userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: myMembership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single();

  if (myMembership?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden: owner only' }, { status: 403 });
  }

  const { role } = await request.json();
  if (role !== 'owner' && role !== 'member') {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // owner를 member로 강등 시 다른 owner 존재 여부 확인
  if (role === 'member') {
    const { data: owners } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('role', 'owner');

    const otherOwners = (owners ?? []).filter(o => o.user_id !== userId);
    if (otherOwners.length === 0) {
      return NextResponse.json(
        { error: 'Cannot demote the last owner' },
        { status: 400 }
      );
    }
  }

  const { error } = await supabase
    .from('group_members')
    .update({ role, role_updated_at: new Date().toISOString() })
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ user_id: userId, role });
}
