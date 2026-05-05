'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ReceiptRow {
  id: string;
  store_name: string;
  purchased_at: string;
  total_amount: number;
  uploaded_by: string;
  uploaded_by_name: string;
  item_count: number;
}

interface Category {
  id: string;
  name_ko: string;
  name_ja: string;
  icon: string;
}

interface Member {
  user_id: string;
  display_name: string;
}

interface Props {
  locale: string;
  categories: Category[];
  members: Member[];
}

type Period = 'week' | 'month' | 'custom';

function getWeekRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(now);
  start.setDate(diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
  };
}

function getMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

function formatDateTime(iso: string, locale: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  const time = d.toLocaleTimeString(locale === 'ja' ? 'ja-JP' : 'ko-KR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return (locale === 'ja' ? `今日 ${time}` : `오늘 ${time}`);
  if (diffDays === 1) return (locale === 'ja' ? `昨日 ${time}` : `어제 ${time}`);
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

const STORE_ICONS: [string, string][] = [
  ['イオン','🛒'],['ライフ','🏬'],['業務スーパー','🏪'],
  ['ドラッグ','🧴'],['マツキヨ','🧴'],['コスモス','🧴'],
  ['ファミマ','🏪'],['ローソン','🏪'],['セブン','🏪'],
];
function getStoreIcon(name: string): string {
  for (const [k, icon] of STORE_ICONS) if (name.includes(k)) return icon;
  return '🛍️';
}

export default function ReceiptListClient({ locale, categories, members }: Props) {
  const router = useRouter();
  const isJa = locale === 'ja';

  const [period, setPeriod] = useState<Period>('week');
  const [categoryId, setCategoryId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [page, setPage] = useState(1);

  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const LIMIT = 20;

  useEffect(() => {
    let cancelled = false;
    async function fetch_() {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (categoryId) params.set('category_id', categoryId);
      if (memberId) params.set('user_id', memberId);
      if (period === 'week') {
        const { from, to } = getWeekRange();
        params.set('date_from', from);
        params.set('date_to', to);
      } else if (period === 'month') {
        const { from, to } = getMonthRange();
        params.set('date_from', from);
        params.set('date_to', to);
      } else {
        if (customFrom) params.set('date_from', customFrom);
        if (customTo)   params.set('date_to', customTo);
      }
      const res = await fetch(`/api/receipts?${params}`);
      if (!cancelled && res.ok) {
        const data = await res.json();
        setReceipts(data.receipts ?? []);
        setTotal(data.total ?? 0);
      }
      if (!cancelled) setLoading(false);
    }
    fetch_();
    return () => { cancelled = true; };
  }, [page, period, categoryId, memberId, customFrom, customTo]);

  function changeFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  const totalPages = Math.ceil(total / LIMIT);
  const periodBtns: { key: Period; ko: string; ja: string }[] = [
    { key: 'week',   ko: '이번 주', ja: '今週' },
    { key: 'month',  ko: '이번 달', ja: '今月' },
    { key: 'custom', ko: '직접 선택', ja: '期間指定' },
  ];

  const chip = (active: boolean) => ({
    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
    background: active ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.5)',
    color: active ? 'rgba(99,102,241,0.9)' : 'rgba(80,80,110,0.7)',
    boxShadow: active ? '0 0 0 1.5px rgba(139,92,246,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
  } as React.CSSProperties);

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'52px 20px 14px' }}>
        <div style={{ color:'rgba(40,40,55,0.88)', fontSize:20, fontWeight:700 }}>
          {isJa ? '支出履歴' : '지출 내역'}
        </div>
        <button
          onClick={() => router.push(`/${locale}/receipt`)}
          style={{
            background:'linear-gradient(135deg,rgba(139,92,246,0.85),rgba(99,102,241,0.85))',
            color:'white', border:'none', borderRadius:14, padding:'8px 14px',
            fontSize:13, fontWeight:600, cursor:'pointer',
          }}
        >
          {isJa ? '+ 登録' : '+ 등록'}
        </button>
      </div>

      {/* 필터 영역 */}
      <div
        style={{
          margin:'0 16px 12px', padding:'14px 16px',
          background:'rgba(255,255,255,0.52)',
          backdropFilter:'blur(40px) saturate(180%)',
          WebkitBackdropFilter:'blur(40px) saturate(180%)',
          border:'1px solid rgba(255,255,255,0.85)',
          borderRadius:18,
          boxShadow:'0 4px 16px rgba(139,92,246,0.06)',
        }}
      >
        {/* 기간 */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
          {periodBtns.map((b) => (
            <button key={b.key} style={chip(period === b.key)} onClick={() => changeFilter(() => setPeriod(b.key))}>
              {isJa ? b.ja : b.ko}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              style={{ flex:1, padding:'6px 10px', borderRadius:10, border:'1px solid rgba(139,92,246,0.2)', fontSize:12, outline:'none' }} />
            <span style={{ color:'rgba(80,80,110,0.58)', fontSize:12 }}>~</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              style={{ flex:1, padding:'6px 10px', borderRadius:10, border:'1px solid rgba(139,92,246,0.2)', fontSize:12, outline:'none' }} />
          </div>
        )}

        {/* 카테고리 */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom: members.length > 1 ? 10 : 0 }}>
          <button style={chip(categoryId === '')} onClick={() => changeFilter(() => setCategoryId(''))}>
            {isJa ? 'すべて' : '전체'}
          </button>
          {categories.map((c) => (
            <button key={c.id} style={chip(categoryId === c.id)} onClick={() => changeFilter(() => setCategoryId(c.id))}>
              {c.icon} {isJa ? c.name_ja : c.name_ko}
            </button>
          ))}
        </div>

        {/* 멤버 (그룹 2명 이상일 때) */}
        {members.length > 1 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <button style={chip(memberId === '')} onClick={() => changeFilter(() => setMemberId(''))}>
              {isJa ? '全員' : '전체'}
            </button>
            {members.map((m) => (
              <button key={m.user_id} style={chip(memberId === m.user_id)} onClick={() => changeFilter(() => setMemberId(m.user_id))}>
                {m.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 결과 수 */}
      <div style={{ padding:'0 20px', marginBottom:8, color:'rgba(80,80,110,0.58)', fontSize:12 }}>
        {loading ? '...' : `${total.toLocaleString()}${isJa ? '件' : '건'}`}
      </div>

      {/* 리스트 */}
      <div
        style={{
          margin:'0 16px 14px', overflow:'hidden',
          background:'rgba(255,255,255,0.52)',
          backdropFilter:'blur(40px) saturate(180%)',
          WebkitBackdropFilter:'blur(40px) saturate(180%)',
          border:'1px solid rgba(255,255,255,0.85)',
          borderRadius:22,
          boxShadow:'0 8px 32px rgba(139,92,246,0.08), 0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'rgba(80,80,110,0.58)', fontSize:13 }}>
            {isJa ? '読み込み中...' : '불러오는 중...'}
          </div>
        ) : receipts.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'rgba(80,80,110,0.58)', fontSize:13 }}>
            {isJa ? '支出履歴がありません' : '지출 내역이 없습니다'}
          </div>
        ) : (
          receipts.map((r, i) => (
            <div
              key={r.id}
              onClick={() => router.push(`/${locale}/receipts/${r.id}`)}
              style={{
                display:'flex', alignItems:'center', gap:13, padding:'13px 16px',
                cursor:'pointer',
                borderBottom: i < receipts.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : undefined,
              }}
            >
              <div style={{ width:40, height:40, borderRadius:13, flexShrink:0, background:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                {getStoreIcon(r.store_name)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:'rgba(40,40,55,0.88)', fontSize:14, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {r.store_name}
                </div>
                <div style={{ color:'rgba(80,80,110,0.58)', fontSize:11, marginTop:2 }}>
                  {formatDateTime(r.purchased_at, locale)} · {r.item_count}{isJa ? '点' : '개 상품'}
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

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginBottom:16 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding:'8px 16px', borderRadius:12, border:'none', fontSize:13, fontWeight:500, cursor:page === 1 ? 'not-allowed' : 'pointer', opacity:page === 1 ? 0.4 : 1, background:'rgba(255,255,255,0.6)', color:'rgba(40,40,55,0.88)' }}
          >
            {isJa ? '前へ' : '이전'}
          </button>
          <span style={{ color:'rgba(80,80,110,0.58)', fontSize:13 }}>{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding:'8px 16px', borderRadius:12, border:'none', fontSize:13, fontWeight:500, cursor:page === totalPages ? 'not-allowed' : 'pointer', opacity:page === totalPages ? 0.4 : 1, background:'rgba(255,255,255,0.6)', color:'rgba(40,40,55,0.88)' }}
          >
            {isJa ? '次へ' : '다음'}
          </button>
        </div>
      )}
    </div>
  );
}
