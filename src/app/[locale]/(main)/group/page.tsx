import { createClient } from '@/lib/supabase/server';
import { GroupSetup } from '@/components/features/group/GroupSetup';
import { GroupHome } from '@/components/features/group/GroupHome';
import { MemberSpending } from '@/components/features/group/MemberSpending';

export default async function GroupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('group_members')
    .select('group_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return <GroupSetup locale={locale} />;
  }

  const groupId = membership.group_id;

  const [{ data: group }, { data: members }] = await Promise.all([
    supabase.from('groups').select('id, name').eq('id', groupId).single(),
    supabase
      .from('group_members')
      .select('id, user_id, role, users(display_name, avatar_url)')
      .eq('group_id', groupId),
  ]);

  const memberList = (members ?? []).map((m: { id: string; user_id: string; role: string; users: { display_name: string; avatar_url: string | null } | null }) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role as 'owner' | 'member',
    display_name: m.users?.display_name ?? m.user_id,
    avatar_url: m.users?.avatar_url ?? null,
  }));

  // G-3: 이번 주 멤버별 지출 집계
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const { data: receipts } = await supabase
    .from('receipts')
    .select('uploaded_by, total_amount')
    .eq('group_id', groupId)
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

  return (
    <div className="flex min-h-screen flex-col items-center p-6 pt-12">
      <div className="w-full max-w-md space-y-6">
        <GroupHome
          groupId={groupId}
          groupName={group?.name ?? ''}
          members={memberList}
          currentUserId={user.id}
          currentUserRole={membership.role as 'owner' | 'member'}
          locale={locale}
        />
        <MemberSpending stats={stats} groupTotal={groupTotal} />
      </div>
    </div>
  );
}
