import { cookies } from 'next/headers';
import AppShell from '@/components/ui/AppShell';
import UnitsClient from '@/components/features/settings/UnitsClient';

async function getUnitsData(cookieHeader: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const [unitsRes, categoriesRes] = await Promise.all([
    fetch(`${baseUrl}/api/settings/units`, { headers: { cookie: cookieHeader }, cache: 'no-store' }),
    fetch(`${baseUrl}/api/settings/categories`, { headers: { cookie: cookieHeader }, cache: 'no-store' }),
  ]);
  const units = unitsRes.ok ? await unitsRes.json() : { system_units: [], custom_units: [] };
  const cats = categoriesRes.ok ? await categoriesRes.json() : { categories: [] };
  return { ...units, categories: cats.categories };
}

export default async function UnitsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const data = await getUnitsData(cookieStore.toString());

  return (
    <AppShell locale={locale}>
      <UnitsClient
        locale={locale}
        systemUnits={data.system_units}
        customUnits={data.custom_units}
        categories={data.categories}
      />
    </AppShell>
  );
}
