import { cookies } from 'next/headers';
import AppShell from '@/components/ui/AppShell';
import SavingsClient from '@/components/features/savings/SavingsClient';

async function getSavingsData() {
  const cookieStore = await cookies();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/savings`, {
    headers: { cookie: cookieStore.toString() },
    cache: 'no-store',
  });
  if (!res.ok) return { total_amount: 0, logs: [] };
  return res.json();
}

export default async function SavingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const data = await getSavingsData();

  return (
    <AppShell locale={locale}>
      <SavingsClient
        totalAmount={data.total_amount}
        logs={data.logs}
        locale={locale}
      />
    </AppShell>
  );
}
