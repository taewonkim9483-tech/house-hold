import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { group_id } = await request.json();
  if (!group_id) return NextResponse.json({ error: 'group_id is required' }, { status: 400 });

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', group_id)
    .eq('user_id', user.id)
    .single();

  if (membership?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden: owner only' }, { status: 403 });
  }

  const { data: invite, error } = await supabase
    .from('group_invites')
    .insert({ group_id, created_by: user.id })
    .select('token')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headersList = await headers();
  const origin = headersList.get('origin') ?? '';
  const locale = headersList.get('x-locale') ?? 'ko';

  return NextResponse.json({
    invite_url: `${origin}/${locale}/invite?token=${invite.token}`,
    token: invite.token,
  });
}
