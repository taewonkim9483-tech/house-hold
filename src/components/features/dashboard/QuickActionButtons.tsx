'use client';

import { useRouter } from 'next/navigation';

export default function QuickActionButtons({ locale }: { locale: string }) {
  const router = useRouter();
  const isJa = locale === 'ja';

  const actions = [
    {
      icon: '📷',
      label: isJa ? 'レシート登録' : '영수증 등록',
      sub: isJa ? 'AI自動分析' : 'AI 자동 분석',
      color: 'rgba(139,92,246,0.15)',
      shadow: '0 0 16px rgba(139,92,246,0.15)',
      href: `/${locale}/receipt`,
    },
    {
      icon: '🔍',
      label: isJa ? '価格比較' : '가격 비교',
      sub: isJa ? '写真で比較' : '사진으로 비교',
      color: 'rgba(52,211,153,0.15)',
      shadow: '0 0 16px rgba(52,211,153,0.15)',
      href: `/${locale}/compare`,
    },
  ];

  return (
    <div
      style={{
        display:'grid', gridTemplateColumns:'1fr 1fr', gap:10,
        margin:'0 16px 14px',
        animation:'up .6s cubic-bezier(.34,1.4,.64,1) .08s both',
      }}
    >
      {actions.map((a) => (
        <button
          key={a.href}
          onClick={() => router.push(a.href)}
          style={{
            padding:16, cursor:'pointer', display:'flex', flexDirection:'column', gap:8,
            background:'rgba(255,255,255,0.52)',
            backdropFilter:'blur(40px) saturate(180%)',
            WebkitBackdropFilter:'blur(40px) saturate(180%)',
            border:'1px solid rgba(255,255,255,0.85)',
            borderRadius:22,
            boxShadow:'0 8px 32px rgba(139,92,246,0.08), 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
            textAlign:'left',
          }}
        >
          <div style={{ width:38, height:38, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, background:a.color, boxShadow:a.shadow }}>
            {a.icon}
          </div>
          <div style={{ color:'rgba(40,40,55,0.88)', fontSize:14, fontWeight:600 }}>{a.label}</div>
          <div style={{ color:'rgba(80,80,110,0.58)', fontSize:11 }}>{a.sub}</div>
        </button>
      ))}
    </div>
  );
}
