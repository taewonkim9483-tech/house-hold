import AppShell from '@/components/ui/AppShell';
import MonthlyReportClient from '@/components/features/report/MonthlyReportClient';

export default async function ReportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AppShell locale={locale}>
      <div style={{ padding: '52px 0 14px 20px' }}>
        <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 13 }}>
          {locale === 'ja' ? '月間レポート' : '월간 리포트'}
        </div>
        <div style={{ color: 'rgba(40,40,55,0.88)', fontSize: 22, fontWeight: 700, marginTop: 2, letterSpacing: '-0.5px' }}>
          {locale === 'ja' ? '支出分析' : '지출 분석'}
        </div>
      </div>
      <MonthlyReportClient locale={locale} />
    </AppShell>
  );
}
