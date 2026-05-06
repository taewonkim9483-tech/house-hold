import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ScopeProvider from '@/components/features/scope/ScopeProvider';

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return <ScopeProvider>{children}</ScopeProvider>;
}
