import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ReceiptUpload from '@/components/features/receipt/ReceiptUpload';

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const { data: member } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!member) redirect(`/${locale}/group`);

  return (
    <div className="app" style={{ position: 'relative', zIndex: 1, maxWidth: 420, margin: '0 auto', paddingBottom: 40 }}>
      <div className="bg" style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 65% 55% at 15% 20%, rgba(186,230,253,0.5) 0%, transparent 65%), radial-gradient(ellipse 55% 65% at 88% 12%, rgba(196,181,253,0.45) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 75% 82%, rgba(167,243,208,0.38) 0%, transparent 60%), radial-gradient(ellipse 60% 48% at 12% 85%, rgba(251,207,232,0.38) 0%, transparent 65%), linear-gradient(145deg,#f0f9ff 0%,#f5f3ff 40%,#f0fdf4 70%,#fdf2f8 100%)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 14px' }}>
          <a href={`/${locale}/dashboard`} style={{ color: 'rgba(99,102,241,0.85)', fontSize: 16, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>‹ 홈</a>
          <div style={{ color: 'rgba(40,40,55,0.88)', fontSize: 17, fontWeight: 700 }}>영수증 등록</div>
          <div style={{ width: 60 }} />
        </div>
        <ReceiptUpload locale={locale} />
      </div>
    </div>
  );
}
