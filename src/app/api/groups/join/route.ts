import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: 'token is required' }, { status: 400 });

  const { data: invite, error: inviteError } = await supabase
    .from('group_invites')
    .select('id, group_id, expires_at')
    .eq('token', token)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invite token expired' }, { status: 410 });
  }

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', invite.group_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ group_id: invite.group_id });
  }

  // MVP: 그룹 멤버 최대 2인 제한
  const { count } = await supabase
    .from('group_members')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', invite.group_id);

  if ((count ?? 0) >= 2) {
    return NextResponse.json({ error: 'Group is full (max 2 members)' }, { status: 409 });
  }

  const { error: joinError } = await supabase
    .from('group_members')
    .insert({ group_id: invite.group_id, user_id: user.id, role: 'member' });

  if (joinError) return NextResponse.json({ error: joinError.message }, { status: 500 });

  return NextResponse.json({ group_id: invite.group_id });
}
