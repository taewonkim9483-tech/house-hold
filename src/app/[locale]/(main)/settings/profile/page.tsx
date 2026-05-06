import AppShell from '@/components/ui/AppShell';
import ProfileSettings from '@/components/features/profile/ProfileSettings';

export default async function ProfileSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AppShell locale={locale}>
      <ProfileSettings locale={locale} />
    </AppShell>
  );
}
