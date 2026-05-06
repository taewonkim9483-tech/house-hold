import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { lang } = await request.json() as { lang: string };
  if (!['ko', 'ja'].includes(lang)) {
    return NextResponse.json({ error: 'Invalid lang' }, { status: 400 });
  }

  const { error } = await supabase
    .from('users')
    .update({ lang })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
