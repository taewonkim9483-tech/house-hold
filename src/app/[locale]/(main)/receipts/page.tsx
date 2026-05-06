import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/ui/AppShell';
import ReceiptListClient from '@/components/features/receipts/ReceiptListClient';

export default async function ReceiptsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const [{ data: categories }, { data: membershipRaw }] = await Promise.all([
    supabase.from('categories').select('id, name_ko, name_ja, icon').eq('is_system', true).order('sort_order'),
    supabase.from('group_members').select('group_id').eq('user_id', user.id),
  ]);

  const groupId = (membershipRaw as { group_id: string }[] | null)?.[0]?.group_id ?? null;

  let members: { user_id: string; display_name: string }[] = [];
  if (groupId) {
    const { data: membersRaw } = await supabase
      .from('group_members')
      .select('user_id, users(display_name)')
      .eq('group_id', groupId);
    members = (membersRaw ?? []).map((m: {
      user_id: string;
      users: { display_name: string } | null;
    }) => ({
      user_id: m.user_id,
      display_name: m.users?.display_name ?? '',
    }));
  }

  return (
    <AppShell locale={locale}>
      <ReceiptListClient
        locale={locale}
        categories={categories ?? []}
        members={members}
      />
    </AppShell>
  );
}
