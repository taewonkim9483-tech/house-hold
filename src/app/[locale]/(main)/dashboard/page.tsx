import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/ui/AppShell';
import DashboardClient from '@/components/features/dashboard/DashboardClient';

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
    .select('display_name, avatar_url')
    .eq('id', user!.id)
    .maybeSingle() as { data: { display_name: string; avatar_url: string | null } | null };

  const displayName = profile?.display_name ?? user?.email ?? '';
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <AppShell locale={locale}>
      <DashboardClient
        locale={locale}
        displayName={displayName}
        initial={initial}
        avatarUrl={avatarUrl}
      />
    </AppShell>
  );
}
