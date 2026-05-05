import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import AppShell from '@/components/ui/AppShell';
import WeeklyBudgetCard from '@/components/features/dashboard/WeeklyBudgetCard';
import CategoryBreakdown from '@/components/features/dashboard/CategoryBreakdown';
import RecentReceiptList from '@/components/features/dashboard/RecentReceiptList';
import QuickActionButtons from '@/components/features/dashboard/QuickActionButtons';

async function getDashboardData() {
  const cookieStore = await cookies();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { cookie: cookieStore.toString() },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user!.id)
    .maybeSingle() as { data: { display_name: string } | null };

  const dashboard = await getDashboardData();

  const greeting = locale === 'ja' ? 'こんにちは 👋' : '안녕하세요 👋';
  const displayName = profile?.display_name ?? user?.email ?? '';
  const initial = displayName.charAt(0).toUpperCase();

  const defaultWeek = { budget: 0, spent: 0, remaining: 0, start: '', end: '' };

  return (
    <AppShell locale={locale}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'52px 20px 14px' }}>
        <div>
          <div style={{ color:'rgba(80,80,110,0.58)', fontSize:13 }}>{greeting}</div>
          <div style={{ color:'rgba(40,40,55,0.88)', fontSize:22, fontWeight:700, marginTop:2, letterSpacing:'-0.5px' }}>우리집 가계부</div>
        </div>
        <div
          style={{
            width:42, height:42, borderRadius:'50%',
            background:'linear-gradient(135deg,rgba(139,92,246,0.7),rgba(99,102,241,0.7))',
            border:'2px solid rgba(255,255,255,0.9)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:16, color:'white', fontWeight:700,
            boxShadow:'0 4px 14px rgba(139,92,246,0.25)',
          }}
        >
          {initial}
        </div>
      </div>

      <WeeklyBudgetCard week={dashboard?.week ?? defaultWeek} locale={locale} />
      <QuickActionButtons locale={locale} />
      <CategoryBreakdown items={dashboard?.category_breakdown ?? []} locale={locale} />
      <RecentReceiptList receipts={dashboard?.recent_receipts ?? []} locale={locale} />
    </AppShell>
  );
}
