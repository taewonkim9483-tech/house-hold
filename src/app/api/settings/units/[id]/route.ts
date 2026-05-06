import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  type UnitType = 'per_100g' | 'per_100ml' | 'per_count' | 'per_g' | 'per_ml';
  const body = await request.json() as { item_name?: string; category_id?: string; unit_type?: string };
  const validTypes: string[] = ['per_100g', 'per_100ml', 'per_count', 'per_g', 'per_ml'];
  if (body.unit_type && !validTypes.includes(body.unit_type)) {
    return NextResponse.json({ error: 'Invalid unit_type' }, { status: 400 });
  }

  const { error } = await supabase
    .from('custom_units')
    .update({
      item_name: body.item_name ?? null,
      category_id: body.category_id ?? null,
      ...(body.unit_type ? { unit_type: body.unit_type as UnitType } : {}),
    })
    .eq('id', id)
    .eq('group_id', member.group_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

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

  const { error } = await supabase
    .from('custom_units')
    .delete()
    .eq('id', id)
    .eq('group_id', member.group_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
