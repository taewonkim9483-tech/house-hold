import { cookies } from 'next/headers';
import AppShell from '@/components/ui/AppShell';
import CategoriesClient from '@/components/features/settings/CategoriesClient';

async function getCategoriesData(cookieHeader: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/settings/categories`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok) return { categories: [] };
  return res.json();
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const data = await getCategoriesData(cookieStore.toString());

  return (
    <AppShell locale={locale}>
      <CategoriesClient locale={locale} categories={data.categories} />
    </AppShell>
  );
}
