'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface MemberStat {
  user_id: string;
  display_name: string;
  total: number;
}

interface Props {
  stats: MemberStat[];
  groupTotal: number;
}

export function MemberSpending({ stats, groupTotal }: Props) {
  const t = useTranslations('group');
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  return (
    <div
      className="w-full rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.52)',
        backdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.85)',
        boxShadow: '0 4px 16px rgba(99,102,241,0.06)',
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[rgba(40,40,55,0.88)]">{t('memberSpending')}</h2>
        <div className="flex gap-1 rounded-full p-1" style={{ background: 'rgba(139,92,246,0.08)' }}>
          {(['weekly', 'monthly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="rounded-full px-3 py-1 text-xs font-medium transition-all"
              style={period === p
                ? { background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))', color: 'white' }
                : { color: 'rgba(80,80,110,0.58)' }
              }
            >
              {t(p)}
            </button>
          ))}
        </div>
      </div>

      {stats.length === 0 ? (
        <p className="text-center text-sm text-[rgba(80,80,110,0.58)]">—</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {stats.map(s => {
            const pct = groupTotal > 0 ? Math.round((s.total / groupTotal) * 100) : 0;
            return (
              <li key={s.user_id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-[rgba(40,40,55,0.88)]">{s.display_name}</span>
                  <span className="text-[rgba(40,40,55,0.88)]">¥{s.total.toLocaleString()} <span className="text-xs text-[rgba(80,80,110,0.58)]">({pct}%)</span></span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(139,92,246,0.12)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, rgba(139,92,246,0.7), rgba(99,102,241,0.7))' }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
