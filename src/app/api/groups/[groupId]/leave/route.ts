import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: myMembership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single();

  if (!myMembership) return NextResponse.json({ error: 'Not a member' }, { status: 400 });

  // owner가 본인뿐이면 탈퇴 불가
  if (myMembership.role === 'owner') {
    const { data: owners } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('role', 'owner');

    const otherOwners = (owners ?? []).filter(o => o.user_id !== user.id);
    if (otherOwners.length === 0) {
      return NextResponse.json(
        { error: 'Must assign another owner before leaving' },
        { status: 400 }
      );
    }
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
