import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/ui/AppShell';
import { GroupHome } from '@/components/features/group/GroupHome';
import { MemberSpending } from '@/components/features/group/MemberSpending';

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    redirect(`/${locale}/group`);
  }

  const [{ data: group }, { data: members }] = await Promise.all([
    supabase.from('groups').select('id, name').eq('id', id).single(),
    supabase
      .from('group_members')
      .select('id, user_id, role, users(display_name, avatar_url)')
      .eq('group_id', id),
  ]);

  const memberList = (members ?? []).map((m: {
    id: string;
    user_id: string;
    role: string;
    users: { display_name: string; avatar_url: string | null } | null;
  }) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role as 'owner' | 'member',
    display_name: m.users?.display_name ?? m.user_id,
    avatar_url: m.users?.avatar_url ?? null,
  }));

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const { data: receipts } = await supabase
    .from('receipts')
    .select('uploaded_by, total_amount')
    .eq('group_id', id)
    .gte('purchased_at', weekStart.toISOString());

  const spendingMap = new Map<string, number>();
  for (const r of receipts ?? []) {
    spendingMap.set(r.uploaded_by, (spendingMap.get(r.uploaded_by) ?? 0) + r.total_amount);
  }

  const stats = memberList.map(m => ({
    user_id: m.user_id,
    display_name: m.display_name,
    total: spendingMap.get(m.user_id) ?? 0,
  }));
  const groupTotal = stats.reduce((sum, s) => sum + s.total, 0);

  const backLabel = locale === 'ja' ? 'グループ一覧へ' : '내 그룹으로';

  return (
    <AppShell locale={locale}>
      <div style={{ padding: '52px 20px 0' }}>
        <Link
          href={`/${locale}/group`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'rgba(99,102,241,0.8)', fontSize: 13, fontWeight: 500,
            textDecoration: 'none', marginBottom: 20,
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
            style={{ width: 14, height: 14 }}>
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
          {backLabel}
        </Link>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <GroupHome
            groupId={id}
            groupName={group?.name ?? ''}
            members={memberList}
            currentUserId={user.id}
            currentUserRole={membership.role as 'owner' | 'member'}
            locale={locale}
          />
          <MemberSpending stats={stats} groupTotal={groupTotal} />
        </div>
      </div>
    </AppShell>
  );
}
