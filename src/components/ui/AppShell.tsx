'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
  locale: string;
}

const NAV_ITEMS = [
  { icon: '🏠', ko: '홈', ja: 'ホーム', href: '/dashboard' },
  { icon: '📋', ko: '내역', ja: '履歴', href: '/receipts' },
  { icon: '💰', ko: '예산', ja: '予算', href: '/budget' },
  { icon: '📊', ko: '리포트', ja: 'レポート', href: '/report' },
  { icon: '⚙️', ko: '설정', ja: '設定', href: '/settings' },
];

export default function AppShell({ children, locale }: AppShellProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: `
            radial-gradient(ellipse 70% 60% at 10% 15%, rgba(196,181,253,0.5) 0%, transparent 65%),
            radial-gradient(ellipse 55% 65% at 90% 10%, rgba(251,207,232,0.45) 0%, transparent 60%),
            radial-gradient(ellipse 50% 55% at 80% 85%, rgba(167,243,208,0.38) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 15% 88%, rgba(186,230,253,0.4) 0%, transparent 65%),
            radial-gradient(ellipse 35% 35% at 50% 50%, rgba(253,230,138,0.18) 0%, transparent 60%),
            linear-gradient(145deg,#f5f3ff 0%,#fdf2f8 35%,#f0fdf4 65%,#f0f9ff 100%)
          `,
        }}
      />
      {/* Blobs */}
      {[
        { style: { width:320, height:320, top:-80, left:-60, background:'rgba(167,139,250,0.28)', animationDelay:'0s' } },
        { style: { width:260, height:260, top:'8%', right:-50, background:'rgba(249,168,212,0.28)', animationDelay:'-4s' } },
        { style: { width:220, height:220, bottom:'8%', left:'2%', background:'rgba(134,239,172,0.22)', animationDelay:'-8s' } },
        { style: { width:190, height:190, bottom:'12%', right:'4%', background:'rgba(125,211,252,0.25)', animationDelay:'-11s' } },
      ].map((b, i) => (
        <div
          key={i}
          style={{
            position: 'fixed', borderRadius: '50%', filter: 'blur(70px)',
            pointerEvents: 'none', animation: 'float 14s ease-in-out infinite alternate',
            zIndex: 0,
            ...b.style,
          }}
        />
      ))}

      <div
        style={{
          position: 'relative', zIndex: 1,
          maxWidth: 420, margin: '0 auto', paddingBottom: 110,
          minHeight: '100vh',
        }}
      >
        {children}
      </div>

      {/* Bottom Nav */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 420, padding: '0 16px 28px', zIndex: 10,
        }}
      >
        <nav
          style={{
            display: 'flex', justifyContent: 'space-around', padding: '10px 8px',
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.9)',
            borderRadius: 24,
            boxShadow: '0 8px 32px rgba(139,92,246,0.1), 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const href = `/${locale}${item.href}`;
            const active = pathname.startsWith(`/${locale}${item.href}`);
            return (
              <Link
                key={item.href}
                href={href}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 3, padding: '6px 14px', borderRadius: 14, flex: 1,
                  background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <span
                  style={{
                    fontSize: 10, fontWeight: 500,
                    color: active ? 'rgba(99,102,241,0.9)' : 'rgba(80,80,110,0.58)',
                  }}
                >
                  {locale === 'ja' ? item.ja : item.ko}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <style>{`
        @keyframes float {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(18px,-12px) scale(1.04); }
          100% { transform: translate(-8px,16px) scale(0.97); }
        }
        @keyframes up {
          from { opacity:0; transform:translateY(16px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes fillIn {
          from { width:0%; }
        }
      `}</style>
    </>
  );
}
