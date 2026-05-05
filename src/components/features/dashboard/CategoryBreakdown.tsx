interface CategoryItem {
  category_id: string;
  name_ko: string;
  name_ja: string;
  icon: string;
  amount: number;
  ratio: number;
}

const CAT_COLORS = [
  'linear-gradient(90deg,rgba(52,211,153,0.7),rgba(16,185,129,0.5))',
  'linear-gradient(90deg,rgba(99,102,241,0.7),rgba(139,92,246,0.5))',
  'linear-gradient(90deg,rgba(251,191,36,0.7),rgba(245,158,11,0.5))',
  'linear-gradient(90deg,rgba(249,168,212,0.8),rgba(236,72,153,0.5))',
  'linear-gradient(90deg,rgba(125,211,252,0.8),rgba(56,189,248,0.5))',
];

export default function CategoryBreakdown({ items, locale }: { items: CategoryItem[]; locale: string }) {
  const title = locale === 'ja' ? 'カテゴリ別支出' : '카테고리별 지출';
  const emptyMsg = locale === 'ja' ? '今週の支出はありません' : '이번 주 지출 내역이 없습니다';

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', marginBottom:10 }}>
        <div style={{ color:'rgba(40,40,55,0.88)', fontSize:16, fontWeight:700 }}>{title}</div>
      </div>
      <div
        style={{
          margin:'0 16px 14px', padding:20,
          background:'rgba(255,255,255,0.52)',
          backdropFilter:'blur(40px) saturate(180%)',
          WebkitBackdropFilter:'blur(40px) saturate(180%)',
          border:'1px solid rgba(255,255,255,0.85)',
          borderRadius:22,
          boxShadow:'0 8px 32px rgba(139,92,246,0.08), 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
          animation:'up .6s cubic-bezier(.34,1.4,.64,1) .16s both',
        }}
      >
        {items.length === 0 ? (
          <div style={{ color:'rgba(80,80,110,0.58)', fontSize:13, textAlign:'center', padding:'12px 0' }}>{emptyMsg}</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {items.map((cat, i) => (
              <div key={cat.category_id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ fontSize:20, width:28, textAlign:'center', flexShrink:0 }}>{cat.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <span style={{ color:'rgba(40,40,55,0.88)', fontSize:13, fontWeight:500 }}>
                      {locale === 'ja' ? cat.name_ja : cat.name_ko}
                    </span>
                    <span style={{ color:'rgba(40,40,55,0.88)', fontSize:13, fontWeight:600, fontVariantNumeric:'tabular-nums' }}>
                      ¥{cat.amount.toLocaleString()}
                    </span>
                    <span style={{ color:'rgba(80,80,110,0.58)', fontSize:11, paddingLeft:8, flexShrink:0 }}>{cat.ratio}%</span>
                  </div>
                  <div style={{ height:5, borderRadius:3, background:'rgba(0,0,0,0.07)', overflow:'hidden' }}>
                    <div
                      style={{
                        height:'100%', borderRadius:3,
                        width: `${cat.ratio}%`,
                        background: CAT_COLORS[i % CAT_COLORS.length],
                        animation: 'fillIn .8s cubic-bezier(.34,1.2,.64,1) .4s both',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
