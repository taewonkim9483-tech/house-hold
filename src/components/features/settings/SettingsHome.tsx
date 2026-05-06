'use client';

import Link from 'next/link';

interface SettingsHomeProps {
  locale: string;
}

const tp = 'rgba(40,40,55,0.88)';
const ts = 'rgba(80,80,110,0.58)';
const card = 'rgba(255,255,255,0.52)';
const cb = 'rgba(255,255,255,0.85)';
const blur = 'blur(40px) saturate(180%)';

const MENU_ITEMS = [
  {
    icon: '🌐',
    ko: '언어 설정',
    ja: '言語設定',
    href: '/settings/language',
    descKo: '한국어 / 일본어',
    descJa: '韓国語 / 日本語',
  },
  {
    icon: '⚖️',
    ko: '단위 설정',
    ja: '単位設定',
    href: '/settings/units',
    descKo: '커스텀 단위 관리',
    descJa: 'カスタム単位の管理',
  },
  {
    icon: '🏷️',
    ko: '카테고리 관리',
    ja: 'カテゴリ管理',
    href: '/settings/categories',
    descKo: '카테고리 추가 / 삭제',
    descJa: 'カテゴリの追加・削除',
  },
  {
    icon: '👥',
    ko: '멤버 관리',
    ja: 'メンバー管理',
    href: '/group',
    descKo: '그룹 멤버 관리',
    descJa: 'グループメンバーの管理',
  },
];

export default function SettingsHome({ locale }: SettingsHomeProps) {
  return (
    <div>
      <div style={{ padding: '52px 16px 8px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: tp, letterSpacing: -0.5 }}>
          {locale === 'ja' ? '設定' : '설정'}
        </div>
      </div>

      <div style={{ margin: '16px 16px 0', animation: 'up .5s cubic-bezier(.34,1.4,.64,1) both' }}>
        <div style={{
          background: card,
          backdropFilter: blur,
          WebkitBackdropFilter: blur,
          border: `1px solid ${cb}`,
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(139,92,246,0.08),0 2px 8px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,1)',
        }}>
          {MENU_ITEMS.map((item, i) => (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                borderTop: i === 0 ? 'none' : '0.5px solid rgba(0,0,0,0.06)',
                textDecoration: 'none',
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(139,92,246,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: tp, fontSize: 15, fontWeight: 600 }}>
                  {locale === 'ja' ? item.ja : item.ko}
                </div>
                <div style={{ color: ts, fontSize: 12, marginTop: 2 }}>
                  {locale === 'ja' ? item.descJa : item.descKo}
                </div>
              </div>
              <div style={{ color: ts, fontSize: 18 }}>›</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
