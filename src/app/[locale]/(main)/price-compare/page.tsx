import AppShell from '@/components/ui/AppShell';
import PriceCompareClient from '@/components/features/price-compare/PriceCompareClient';

export default async function PriceComparePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AppShell locale={locale}>
      <PriceCompareClient locale={locale} />
    </AppShell>
  );
}
