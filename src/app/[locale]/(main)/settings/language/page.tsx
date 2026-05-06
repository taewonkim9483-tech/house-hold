import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/ui/AppShell';
import LanguageClient from '@/components/features/settings/LanguageClient';

export default async function LanguagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let currentLang = locale;
  if (user) {
    const { data } = await supabase.from('users').select('lang').eq('id', user.id).single();
    if (data) currentLang = data.lang;
  }

  return (
    <AppShell locale={locale}>
      <LanguageClient locale={locale} currentLang={currentLang} />
    </AppShell>
  );
}
