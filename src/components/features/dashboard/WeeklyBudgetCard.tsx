interface WeekData {
  budget: number;
  spent: number;
  remaining: number;
  start: string;
  end: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatYen(n: number): string {
  return `¥${n.toLocaleString()}`;
}

export default function WeeklyBudgetCard({ week, locale }: { week: WeekData; locale: string }) {
  const pct = week.budget > 0 ? Math.round((week.spent / week.budget) * 100) : 0;
  const isOver = pct >= 100;

  const weekLabel = locale === 'ja'
    ? `${formatDate(week.start)} – ${formatDate(week.end)} 週`
    : `이번 주 · ${formatDate(week.start)} – ${formatDate(week.end)}`;

  const labelRemaining = locale === 'ja' ? '今週の残高' : '이번 주 잔액';
  const labelBudget    = locale === 'ja' ? '予算' : '예산';
  const labelSpent     = locale === 'ja' ? '支出' : '지출';
  const labelProgress  = locale === 'ja' ? '支出状況' : '지출 현황';

  return (
    <div
      style={{
        margin: '0 16px 14px', padding: 26,
        position: 'relative', overflow: 'hidden',
        background: 'rgba(255,255,255,0.58)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid rgba(255,255,255,0.9)',
        borderRadius: 28,
        boxShadow: '0 16px 48px rgba(139,92,246,0.12), 0 4px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
        animation: 'up .6s cubic-bezier(.34,1.4,.64,1) both',
      }}
    >
      {/* 글로우 */}
      <div style={{ position:'absolute', top:-60, right:-40, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-40, left:-20, width:140, height:140, borderRadius:'50%', background:'radial-gradient(circle, rgba(249,168,212,0.15) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ color:'rgba(80,80,110,0.58)', fontSize:11, fontWeight:500, letterSpacing:'0.4px', textTransform:'uppercase', marginBottom:5 }}>{weekLabel}</div>
      <div style={{ color:'rgba(80,80,110,0.58)', fontSize:13, marginBottom:3 }}>{labelRemaining}</div>
      <div style={{ fontSize:50, fontWeight:700, color:'rgba(40,40,55,0.88)', letterSpacing:-2, lineHeight:1 }}>
        <span style={{ fontSize:26, fontWeight:500, letterSpacing:0, marginRight:2, opacity:0.7 }}>¥</span>
        {Math.abs(week.remaining).toLocaleString()}
        {week.remaining < 0 && <span style={{ fontSize:20, color:'rgba(239,68,68,0.8)' }}> 초과</span>}
      </div>

      <div style={{ display:'flex', marginTop:18 }}>
        {[
          { label: labelBudget, value: formatYen(week.budget), color: 'rgba(40,40,55,0.88)' },
          { label: labelSpent,  value: formatYen(week.spent),  color: 'rgba(40,40,55,0.88)' },
        ].map((item, i) => (
          <div key={i} style={{ flex:1, borderRight: i === 0 ? '1px solid rgba(0,0,0,0.06)' : undefined, paddingRight: i === 0 ? 16 : 0, marginRight: i === 0 ? 16 : 0 }}>
            <div style={{ color:'rgba(80,80,110,0.58)', fontSize:11, marginBottom:3 }}>{item.label}</div>
            <div style={{ color: item.color, fontSize:16, fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {week.budget > 0 && (
        <div style={{ marginTop:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ color:'rgba(80,80,110,0.58)', fontSize:11 }}>{labelProgress}</span>
            <span style={{ color:'rgba(40,40,55,0.88)', fontWeight:600, fontSize:11 }}>{pct}%</span>
          </div>
          <div style={{ height:6, borderRadius:3, background:'rgba(0,0,0,0.07)', overflow:'hidden' }}>
            <div
              style={{
                height:'100%', borderRadius:3,
                width: `${Math.min(pct, 100)}%`,
                background: isOver
                  ? 'linear-gradient(90deg, rgba(239,68,68,0.8), rgba(220,38,38,0.6))'
                  : 'linear-gradient(90deg, rgba(139,92,246,0.7), rgba(99,102,241,0.6))',
                boxShadow: isOver ? '0 0 12px rgba(239,68,68,0.3)' : '0 0 12px rgba(139,92,246,0.3)',
                animation: 'fillIn .9s cubic-bezier(.34,1.2,.64,1) .3s both',
              }}
            />
          </div>
        </div>
      )}

      <a
        href={`/${locale}/budget`}
        style={{ display:'block', marginTop:16, textAlign:'center', color:'rgba(99,102,241,0.8)', fontSize:12, fontWeight:500, textDecoration:'none' }}
      >
        {locale === 'ja' ? '予算を管理する →' : '예산 관리 →'}
      </a>
    </div>
  );
}
