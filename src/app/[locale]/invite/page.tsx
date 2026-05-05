import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  const t = await getTranslations('group');

  if (!token) {
    return <InviteError message={t('inviteInvalid')} />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/invite?token=${token}`);
  }

  const { data: invite, error } = await supabase
    .from('group_invites')
    .select('id, group_id, expires_at')
    .eq('token', token)
    .single();

  if (error || !invite) {
    return <InviteError message={t('inviteInvalid')} />;
  }

  if (new Date(invite.expires_at) < new Date()) {
    return <InviteError message={t('inviteExpired')} />;
  }

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', invite.group_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existing) {
    const { count } = await supabase
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', invite.group_id);

    if ((count ?? 0) >= 2) {
      return <InviteError message={t('groupFull')} />;
    }

    await supabase
      .from('group_members')
      .insert({ group_id: invite.group_id, user_id: user.id, role: 'member' });
  }

  redirect(`/${locale}/group`);
}

function InviteError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{
          background: 'rgba(255,255,255,0.52)',
          backdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.85)',
        }}
      >
        <p className="text-[rgba(40,40,55,0.88)]">{message}</p>
      </div>
    </div>
  );
}
