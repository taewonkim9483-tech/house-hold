import { cookies } from 'next/headers';
import AppShell from '@/components/ui/AppShell';
import BudgetClient from '@/components/features/budget/BudgetClient';

async function getBudgetData() {
  const cookieStore = await cookies();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const headers = { cookie: cookieStore.toString() };

  const [budgetRes, currentRes] = await Promise.all([
    fetch(`${baseUrl}/api/budgets`, { headers, cache: 'no-store' }),
    fetch(`${baseUrl}/api/budgets/current`, { headers, cache: 'no-store' }),
  ]);

  const budgetData = budgetRes.ok ? await budgetRes.json() : null;
  const current = currentRes.ok ? await currentRes.json() : null;

  return { budgetData, current };
}

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { budgetData, current } = await getBudgetData();

  return (
    <AppShell locale={locale}>
      <BudgetClient
        weeklyAmount={budgetData?.budget?.weekly_amount ?? null}
        weeks={budgetData?.weeks ?? []}
        current={current}
        locale={locale}
      />
    </AppShell>
  );
}
