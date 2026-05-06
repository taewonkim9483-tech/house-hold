import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Not a group member' }, { status: 403 });

  const { data: category } = await supabase
    .from('categories')
    .select('is_system, group_id')
    .eq('id', id)
    .single();

  if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (category.is_system) return NextResponse.json({ error: 'Cannot delete system category' }, { status: 403 });
  if (category.group_id !== member.group_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
