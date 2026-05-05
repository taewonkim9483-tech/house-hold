'use client';

import { useRouter } from 'next/navigation';

interface RecentReceipt {
  id: string;
  store_name: string;
  purchased_at: string;
  total_amount: number;
  uploaded_by_name: string;
}

function formatDateTime(iso: string, locale: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  const time = d.toLocaleTimeString(locale === 'ja' ? 'ja-JP' : 'ko-KR', { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return (locale === 'ja' ? `今日 ${time}` : `오늘 ${time}`);
  if (diffDays === 1) return (locale === 'ja' ? `昨日 ${time}` : `어제 ${time}`);
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

const STORE_ICONS: Record<string, string> = {
  'イオン': '🛒', 'aeon': '🛒',
  'ライフ': '🏬', 'life': '🏬',
  '業務スーパー': '🏪', 'gyomu': '🏪',
  'ドラッグ': '🧴', 'drug': '🧴', 'マツキヨ': '🧴',
  'コンビニ': '🏪', 'ファミマ': '🏪', 'ローソン': '🏪', 'セブン': '🏪',
};

function getStoreIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(STORE_ICONS)) {
    if (name.includes(key) || lower.includes(key.toLowerCase())) return icon;
  }
  return '🛍️';
}

export default function RecentReceiptList({
  receipts, locale,
}: {
  receipts: RecentReceipt[];
  locale: string;
}) {
  const router = useRouter();
  const title  = locale === 'ja' ? '最近の支出' : '최근 지출';
  const seeAll = locale === 'ja' ? 'すべて見る' : '전체 보기';
  const emptyMsg = locale === 'ja' ? '支出履歴がありません' : '지출 내역이 없습니다';

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', marginBottom:10 }}>
        <div style={{ color:'rgba(40,40,55,0.88)', fontSize:16, fontWeight:700 }}>{title}</div>
        <button
          onClick={() => router.push(`/${locale}/receipts`)}
          style={{ color:'rgba(99,102,241,0.8)', fontSize:13, fontWeight:500, background:'none', border:'none', cursor:'pointer' }}
        >
          {seeAll}
        </button>
      </div>
      <div
        style={{
          margin:'0 16px 14px', overflow:'hidden',
          background:'rgba(255,255,255,0.52)',
          backdropFilter:'blur(40px) saturate(180%)',
          WebkitBackdropFilter:'blur(40px) saturate(180%)',
          border:'1px solid rgba(255,255,255,0.85)',
          borderRadius:22,
          boxShadow:'0 8px 32px rgba(139,92,246,0.08), 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
          animation:'up .6s cubic-bezier(.34,1.4,.64,1) .2s both',
        }}
      >
        {receipts.length === 0 ? (
          <div style={{ padding:'20px 16px', color:'rgba(80,80,110,0.58)', fontSize:13, textAlign:'center' }}>{emptyMsg}</div>
        ) : (
          receipts.map((r, i) => (
            <div
              key={r.id}
              onClick={() => router.push(`/${locale}/receipts/${r.id}`)}
              style={{
                display:'flex', alignItems:'center', gap:13, padding:'13px 16px',
                cursor:'pointer', position:'relative',
                borderBottom: i < receipts.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : undefined,
              }}
            >
              <div
                style={{
                  width:40, height:40, borderRadius:13, flexShrink:0,
                  background:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.9)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
                  boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                {getStoreIcon(r.store_name)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:'rgba(40,40,55,0.88)', fontSize:14, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {r.store_name}
                </div>
                <div style={{ color:'rgba(80,80,110,0.58)', fontSize:11, marginTop:2 }}>
                  {formatDateTime(r.purchased_at, locale)}
                </div>
              </div>
              <div>
                <div style={{ color:'rgba(40,40,55,0.88)', fontSize:15, fontWeight:700, fontVariantNumeric:'tabular-nums', textAlign:'right' }}>
                  ¥{r.total_amount.toLocaleString()}
                </div>
                <div style={{ color:'rgba(80,80,110,0.58)', fontSize:11, marginTop:2, textAlign:'right' }}>
                  {r.uploaded_by_name}
                </div>
              </div>
              <div style={{ color:'rgba(120,120,150,0.38)', fontSize:16, flexShrink:0 }}>›</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
