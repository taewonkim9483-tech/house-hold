import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${user.id}/avatar.${ext}`;
  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ avatar_url: publicUrl });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 기존 아바타 파일 목록 조회 후 삭제
  const { data: files } = await supabase.storage
    .from('avatars')
    .list(user.id);

  if (files && files.length > 0) {
    const paths = files.map(f => `${user.id}/${f.name}`);
    await supabase.storage.from('avatars').remove(paths);
  }

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: null })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
