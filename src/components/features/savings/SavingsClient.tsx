'use client';

interface SavingsLog {
  amount: number;
  reason: string;
  week_label: string | null;
  created_at: string;
}

interface SavingsClientProps {
  totalAmount: number;
  logs: SavingsLog[];
  locale: string;
}

const tp = 'rgba(40,40,55,0.88)';
const ts = 'rgba(80,80,110,0.58)';
const card = 'rgba(255,255,255,0.52)';
const cb = 'rgba(255,255,255,0.85)';
const blur = 'blur(40px) saturate(180%)';

function glass(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: card,
    backdropFilter: blur,
    WebkitBackdropFilter: blur,
    border: `1px solid ${cb}`,
    borderRadius: 22,
    boxShadow: '0 8px 32px rgba(134,239,172,0.1),0 2px 8px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,1)',
    ...extra,
  };
}

function formatYen(n: number): string {
  return `¥${Math.abs(n).toLocaleString()}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function reasonLabel(reason: string, locale: string): string {
  if (reason === 'weekly_closing') return locale === 'ja' ? '週次締め' : '주간 마감';
  return reason;
}

export default function SavingsClient({ totalAmount, logs, locale }: SavingsClientProps) {
  return (
    <div>
      {/* Hero 카드 */}
      <div style={{ margin: '52px 16px 16px', padding: 28, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.58)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 28, boxShadow: '0 16px 48px rgba(134,239,172,0.14),0 4px 12px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,1)', animation: 'up .6s cubic-bezier(.34,1.4,.64,1) both' }}>
        <div style={{ position: 'absolute', top: -50, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(134,239,172,0.22) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ color: 'rgba(5,100,60,0.65)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
          {locale === 'ja' ? '積立プール' : '적금 풀'}
        </div>
        <div style={{ fontSize: 13, color: ts, marginBottom: 4 }}>
          {locale === 'ja' ? '累計積立額' : '누적 금액'}
        </div>
        <div style={{ fontSize: 52, fontWeight: 700, color: tp, letterSpacing: -2, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: 24, fontWeight: 500, opacity: 0.6, marginRight: 2 }}>¥</span>
          {totalAmount.toLocaleString()}
        </div>
        <div style={{ marginTop: 10, color: ts, fontSize: 12 }}>
          {locale === 'ja' ? `${logs.length}件の積立履歴` : `총 ${logs.length}건 적립`}
        </div>
      </div>

      {/* 적립 이력 */}
      <div style={{ margin: '0 16px 14px', animation: 'up .6s cubic-bezier(.34,1.4,.64,1) .1s both' }}>
        <div style={{ color: tp, fontSize: 15, fontWeight: 700, paddingLeft: 4, marginBottom: 10 }}>
          {locale === 'ja' ? '積立履歴' : '적립 이력'}
        </div>
        <div style={glass()}>
          {logs.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: ts, fontSize: 13 }}>
              {locale === 'ja' ? 'まだ積立履歴がありません' : '아직 적립 이력이 없습니다'}
            </div>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: i === 0 ? 'none' : '0.5px solid rgba(0,0,0,0.06)' }}
              >
                <div>
                  <div style={{ color: tp, fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {log.week_label ?? formatDate(log.created_at)}
                  </div>
                  <div style={{ color: ts, fontSize: 11, marginTop: 3 }}>
                    {reasonLabel(log.reason, locale)}
                  </div>
                </div>
                <div style={{ color: 'rgba(5,150,105,0.9)', fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  +{formatYen(log.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
