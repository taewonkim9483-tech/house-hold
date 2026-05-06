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
    .limit(1)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: 'Not a group member' }, { status: 403 });

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_ko, name_ja, icon, is_system, sort_order, group_id')
    .or(`is_system.eq.true,group_id.eq.${member.group_id}`)
    .order('sort_order', { ascending: true });

  return NextResponse.json({ categories: categories ?? [] });
}

export async function POST(request: Request) {
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

  const body = await request.json() as { name_ko: string; name_ja: string; icon: string };
  if (!body.name_ko || !body.name_ja || !body.icon) {
    return NextResponse.json({ error: 'name_ko, name_ja, icon are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      group_id: member.group_id,
      name_ko: body.name_ko,
      name_ja: body.name_ja,
      icon: body.icon,
      is_system: false,
      sort_order: 100,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
