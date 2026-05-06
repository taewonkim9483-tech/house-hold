'use client';

interface MemberEntry { user_id: string; display_name: string; amount: number }
interface Props { members: MemberEntry[]; total: number }

export default function MemberBreakdown({ members, total }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {members.map((m) => {
        const ratio = total > 0 ? Math.round((m.amount / total) * 1000) / 10 : 0;
        return (
          <div key={m.user_id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg,rgba(139,92,246,0.6),rgba(99,102,241,0.6))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: 'white', fontWeight: 700,
                }}>
                  {(m.display_name || '?').charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 14, color: 'rgba(40,40,55,0.88)', fontWeight: 500 }}>
                  {m.display_name}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(40,40,55,0.88)' }}>
                  ¥{m.amount.toLocaleString()}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(80,80,110,0.5)', marginLeft: 6 }}>
                  {ratio}%
                </span>
              </div>
            </div>
            <div style={{ height: 6, background: 'rgba(99,102,241,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${ratio}%`,
                  background: 'linear-gradient(90deg, rgba(99,102,241,0.65), rgba(139,92,246,0.65))',
                  borderRadius: 4,
                  animation: 'fillIn 0.6s ease-out',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
