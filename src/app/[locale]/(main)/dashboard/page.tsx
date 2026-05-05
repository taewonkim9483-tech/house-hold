import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/features/auth/LogoutButton';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user!.id)
    .maybeSingle() as { data: { display_name: string } | null };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold text-[rgba(40,40,55,0.88)]">
        {locale === 'ja' ? 'ダッシュボード' : '대시보드'}
      </h1>
      <p className="text-[rgba(80,80,110,0.58)]">
        {locale === 'ja' ? 'ようこそ' : '안녕하세요'}, {profile?.display_name ?? user?.email} 님
      </p>
      <LogoutButton
        locale={locale}
        label={locale === 'ja' ? 'ログアウト' : '로그아웃'}
      />
    </main>
  );
}
