import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

async function getReceiptDetail(id: string) {
  const cookieStore = await cookies();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/receipts/${id}`, {
    headers: { cookie: cookieStore.toString() },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

function formatDatetime(iso: string, locale: string): string {
  const d = new Date(iso);
  if (locale === 'ja') {
    return d.toLocaleDateString('ja-JP', { year:'numeric', month:'long', day:'numeric', weekday:'short' })
      + ' ' + d.toLocaleTimeString('ja-JP', { hour:'2-digit', minute:'2-digit' });
  }
  return d.toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'short' })
    + ' ' + d.toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' });
}

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const data = await getReceiptDetail(id);
  if (!data) notFound();

  const { receipt, items } = data;
  const isJa = locale === 'ja';

  return (
    <>
      <div
        style={{
          position:'fixed', inset:0, zIndex:0,
          background:'radial-gradient(ellipse 65% 55% at 15% 20%, rgba(186,230,253,0.5) 0%, transparent 65%), radial-gradient(ellipse 55% 65% at 88% 12%, rgba(196,181,253,0.45) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 75% 82%, rgba(167,243,208,0.38) 0%, transparent 60%), radial-gradient(ellipse 60% 48% at 12% 85%, rgba(251,207,232,0.38) 0%, transparent 65%), linear-gradient(145deg,#f0f9ff 0%,#f5f3ff 40%,#f0fdf4 70%,#fdf2f8 100%)',
        }}
      />
      <div style={{ position:'relative', zIndex:1, maxWidth:420, margin:'0 auto', paddingBottom:40 }}>
        {/* 네비 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'52px 20px 14px' }}>
          <Link
            href={`/${locale}/receipts`}
            style={{ color:'rgba(99,102,241,0.85)', fontSize:16, fontWeight:500, textDecoration:'none', display:'flex', alignItems:'center', gap:3 }}
          >
            ‹ {isJa ? '履歴' : '내역'}
          </Link>
          <div style={{ color:'rgba(40,40,55,0.88)', fontSize:17, fontWeight:700 }}>
            {isJa ? 'レシート詳細' : '영수증 상세'}
          </div>
          <div style={{ width:60 }} />
        </div>

        {/* 매장 정보 카드 */}
        <div
          style={{
            margin:'0 16px 14px', padding:'22px 24px',
            background:'rgba(255,255,255,0.58)',
            backdropFilter:'blur(40px) saturate(200%)',
            WebkitBackdropFilter:'blur(40px) saturate(200%)',
            border:'1px solid rgba(255,255,255,0.9)',
            borderRadius:24,
            boxShadow:'0 16px 48px rgba(139,92,246,0.1), 0 4px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
          }}
        >
          <div style={{ fontSize:24, fontWeight:700, color:'rgba(40,40,55,0.88)', marginBottom:6 }}>
            {receipt.store_name}
          </div>
          <div style={{ color:'rgba(80,80,110,0.58)', fontSize:13, marginBottom:16 }}>
            {formatDatetime(receipt.purchased_at, locale)}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            <div>
              <div style={{ color:'rgba(80,80,110,0.58)', fontSize:11, marginBottom:3 }}>
                {isJa ? '登録者' : '등록자'}
              </div>
              <div style={{ color:'rgba(40,40,55,0.88)', fontSize:14, fontWeight:500 }}>
                {receipt.uploaded_by_name}
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ color:'rgba(80,80,110,0.58)', fontSize:11, marginBottom:3 }}>
                {isJa ? '合計' : '합계'}
              </div>
              <div style={{ fontSize:28, fontWeight:700, color:'rgba(40,40,55,0.88)', letterSpacing:-1, fontVariantNumeric:'tabular-nums' }}>
                ¥{receipt.total_amount.toLocaleString()}
              </div>
              {receipt.tax_amount != null && (
                <div style={{ color:'rgba(80,80,110,0.58)', fontSize:11 }}>
                  {isJa ? `税 ¥${receipt.tax_amount.toLocaleString()}` : `세금 ¥${receipt.tax_amount.toLocaleString()}`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 상품 리스트 */}
        <div style={{ padding:'0 20px', marginBottom:10 }}>
          <div style={{ color:'rgba(40,40,55,0.88)', fontSize:16, fontWeight:700 }}>
            {isJa ? '商品一覧' : '상품 목록'} ({items.length}{isJa ? '点' : '개'})
          </div>
        </div>
        <div
          style={{
            margin:'0 16px', overflow:'hidden',
            background:'rgba(255,255,255,0.52)',
            backdropFilter:'blur(40px) saturate(180%)',
            WebkitBackdropFilter:'blur(40px) saturate(180%)',
            border:'1px solid rgba(255,255,255,0.85)',
            borderRadius:22,
            boxShadow:'0 8px 32px rgba(139,92,246,0.08), 0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          {(items as Array<{
            id: string;
            name: string;
            quantity: number;
            unit_price: number;
            subtotal: number;
            unit_type: string;
            price_per_100: number | null;
            categories: { name_ko: string; name_ja: string; icon: string } | null;
          }>).map((item, i) => (
            <div
              key={item.id}
              style={{
                padding:'13px 16px',
                borderBottom: i < items.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : undefined,
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1, minWidth:0, marginRight:12 }}>
                  <div style={{ color:'rgba(40,40,55,0.88)', fontSize:14, fontWeight:500 }}>{item.name}</div>
                  <div style={{ color:'rgba(80,80,110,0.58)', fontSize:11, marginTop:3, display:'flex', gap:6, flexWrap:'wrap' }}>
                    {item.categories && (
                      <span>{item.categories.icon} {isJa ? item.categories.name_ja : item.categories.name_ko}</span>
                    )}
                    {item.quantity !== 1 && <span>×{item.quantity}</span>}
                    {item.price_per_100 != null && (
                      <span>¥{item.price_per_100.toLocaleString()}/100{item.unit_type === 'per_100ml' ? 'ml' : 'g'}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ color:'rgba(40,40,55,0.88)', fontSize:14, fontWeight:600, fontVariantNumeric:'tabular-nums' }}>
                    ¥{item.subtotal.toLocaleString()}
                  </div>
                  {item.quantity !== 1 && (
                    <div style={{ color:'rgba(80,80,110,0.58)', fontSize:11, marginTop:2 }}>
                      ¥{item.unit_price.toLocaleString()}/개
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 영수증 이미지 */}
        {receipt.image_url && (
          <div style={{ margin:'14px 16px 0' }}>
            <div style={{ color:'rgba(80,80,110,0.58)', fontSize:12, marginBottom:8 }}>
              {isJa ? '領収書画像' : '영수증 이미지'}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receipt.image_url}
              alt="영수증"
              style={{ width:'100%', borderRadius:16, border:'1px solid rgba(255,255,255,0.85)', boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}
            />
          </div>
        )}
      </div>
    </>
  );
}
