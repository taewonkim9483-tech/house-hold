import AppShell from '@/components/ui/AppShell';
import SettingsHome from '@/components/features/settings/SettingsHome';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AppShell locale={locale}>
      <SettingsHome locale={locale} />
    </AppShell>
  );
}
