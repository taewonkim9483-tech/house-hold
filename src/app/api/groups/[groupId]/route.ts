import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single();

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [{ data: group }, { data: members }] = await Promise.all([
    supabase.from('groups').select('id, name, created_at').eq('id', groupId).single(),
    supabase
      .from('group_members')
      .select('user_id, role, joined_at, users(display_name, avatar_url)')
      .eq('group_id', groupId),
  ]);

  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const memberList = (members ?? []).map((m: {
    user_id: string;
    role: string;
    joined_at: string;
    users: { display_name: string; avatar_url: string | null } | null;
  }) => ({
    user_id: m.user_id,
    display_name: m.users?.display_name ?? m.user_id,
    avatar_url: m.users?.avatar_url ?? null,
    role: m.role,
    joined_at: m.joined_at,
  }));

  return NextResponse.json({ ...group, members: memberList });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single();

  if (membership?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden: owner only' }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const { error } = await supabase
    .from('groups')
    .update({ name: name.trim() })
    .eq('id', groupId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, name: name.trim() });
}
