'use client';

interface CategoryEntry {
  category_id: string;
  name_ko: string;
  name_ja: string;
  icon: string;
  amount: number;
  ratio: number;
  item_count: number;
}

interface Props {
  items: CategoryEntry[];
  locale: string;
}

export default function CategoryAnalysis({ items, locale }: Props) {
  if (items.length === 0) {
    return (
      <div style={{ color: 'rgba(80,80,110,0.5)', fontSize: 14, textAlign: 'center', padding: '8px 0' }}>
        —
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item) => (
        <div key={item.category_id}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 14, color: 'rgba(40,40,55,0.88)', fontWeight: 500 }}>
                {locale === 'ja' ? item.name_ja : item.name_ko}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(40,40,55,0.88)' }}>
                ¥{item.amount.toLocaleString()}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(80,80,110,0.5)', marginLeft: 6 }}>
                {item.ratio}%
              </span>
            </div>
          </div>
          <div style={{ height: 7, background: 'rgba(139,92,246,0.1)', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${item.ratio}%`,
                background: 'linear-gradient(90deg, rgba(139,92,246,0.75), rgba(99,102,241,0.75))',
                borderRadius: 4,
                animation: 'fillIn 0.6s ease-out',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
