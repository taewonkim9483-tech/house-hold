import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/ui/AppShell';
import { GroupListClient } from '@/components/features/group/GroupListClient';

export default async function GroupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from('group_members')
    .select('role, groups(id, name)')
    .eq('user_id', user.id);

  const groups = (memberships ?? [])
    .map((m: { role: string; groups: { id: string; name: string } | null }) => ({
      id: m.groups?.id ?? '',
      name: m.groups?.name ?? '',
      role: m.role as 'owner' | 'member',
    }))
    .filter(g => g.id);

  return (
    <AppShell locale={locale}>
      <GroupListClient groups={groups} locale={locale} />
    </AppShell>
  );
}
