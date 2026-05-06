'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface LanguageClientProps {
  locale: string;
  currentLang: string;
}

const tp = 'rgba(40,40,55,0.88)';
const ts = 'rgba(80,80,110,0.58)';
const card = 'rgba(255,255,255,0.52)';
const cb = 'rgba(255,255,255,0.85)';
const blur = 'blur(40px) saturate(180%)';

const LANGS = [
  { value: 'ko', label: '한국어', subLabel: '韓国語' },
  { value: 'ja', label: '日本語', subLabel: '일본어' },
];

export default function LanguageClient({ locale, currentLang }: LanguageClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [pendingLang, setPendingLang] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingLang) return;
    document.cookie = `NEXT_LOCALE=${pendingLang}; path=/; max-age=31536000`;
    router.push(`/${pendingLang}/settings/language`);
    router.refresh();
  }, [pendingLang, router]);

  async function handleSelect(lang: string) {
    if (lang === currentLang || saving) return;
    setSaving(true);

    await fetch('/api/settings/language', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang }),
    });

    setPendingLang(lang);
  }

  return (
    <div>
      <div style={{ padding: '52px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: ts, padding: 0 }}
        >
          ‹
        </button>
        <div style={{ fontSize: 22, fontWeight: 800, color: tp, letterSpacing: -0.5 }}>
          {locale === 'ja' ? '言語設定' : '언어 설정'}
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
          {LANGS.map((lang, i) => {
            const isActive = lang.value === currentLang;
            return (
              <button
                key={lang.value}
                onClick={() => handleSelect(lang.value)}
                disabled={saving}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 18px',
                  borderTop: i === 0 ? 'none' : '0.5px solid rgba(0,0,0,0.06)',
                  background: isActive ? 'rgba(139,92,246,0.06)' : 'transparent',
                  border: i === 0 ? 'none' : '0.5px solid rgba(0,0,0,0.06)',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ color: tp, fontSize: 16, fontWeight: isActive ? 700 : 500 }}>
                    {lang.label}
                  </div>
                  <div style={{ color: ts, fontSize: 12, marginTop: 2 }}>
                    {lang.subLabel}
                  </div>
                </div>
                {isActive && (
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                  }}>
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ margin: '14px 4px 0', color: ts, fontSize: 12, lineHeight: 1.6 }}>
          {locale === 'ja'
            ? '※ UIテキストのみ切り替わります。商品名・店舗名などの固有名詞は日本語原文のまま表示されます。'
            : '※ UI 텍스트만 전환됩니다. 상품명·매장명 등 고유명사는 일본어 원문으로 표시됩니다.'}
        </div>
      </div>
    </div>
  );
}
