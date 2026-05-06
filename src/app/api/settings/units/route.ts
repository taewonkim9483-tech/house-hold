import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SYSTEM_UNITS = [
  { id: 'sys_per_100g', unit_type: 'per_100g', label_ko: '100g당', label_ja: '100gあたり', is_system: true },
  { id: 'sys_per_100ml', unit_type: 'per_100ml', label_ko: '100ml당', label_ja: '100mlあたり', is_system: true },
  { id: 'sys_per_count', unit_type: 'per_count', label_ko: '개당', label_ja: '個あたり', is_system: true },
  { id: 'sys_per_g', unit_type: 'per_g', label_ko: 'g당', label_ja: 'gあたり', is_system: true },
  { id: 'sys_per_ml', unit_type: 'per_ml', label_ko: 'ml당', label_ja: 'mlあたり', is_system: true },
];

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

  const { data: customUnits } = await supabase
    .from('custom_units')
    .select('id, item_name, category_id, unit_type, categories(name_ko, name_ja)')
    .eq('group_id', member.group_id)
    .order('created_at', { ascending: true });

  return NextResponse.json({
    system_units: SYSTEM_UNITS,
    custom_units: customUnits ?? [],
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Not a group member' }, { status: 403 });

  const body = await request.json() as { item_name?: string; category_id?: string; unit_type: string };
  const validTypes = ['per_100g', 'per_100ml', 'per_count', 'per_g', 'per_ml'];
  if (!validTypes.includes(body.unit_type)) {
    return NextResponse.json({ error: 'Invalid unit_type' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('custom_units')
    .insert({
      group_id: member.group_id,
      item_name: body.item_name || null,
      category_id: body.category_id || null,
      unit_type: body.unit_type,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
