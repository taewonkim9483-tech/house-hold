'use client';

import { AnalyzedItem, UnitType } from '@/types/domain';

const CATEGORIES = [
  { key: '신선식품', icon: '🥬' },
  { key: '가공식품', icon: '🥫' },
  { key: '음료', icon: '🥤' },
  { key: '주류', icon: '🍺' },
  { key: '생활용품', icon: '🧴' },
  { key: '청소용품', icon: '🧹' },
  { key: '의약품/건강', icon: '💊' },
  { key: '반려동물용품', icon: '🐾' },
  { key: '육아용품', icon: '👶' },
  { key: '기타', icon: '📦' },
];

function calcPricePer100(item: AnalyzedItem): number | null {
  if (item.weightG) return Math.round((item.unitPrice / item.weightG) * 100);
  if (item.volumeMl) return Math.round((item.unitPrice / item.volumeMl) * 100);
  return null;
}

interface Props {
  item: AnalyzedItem;
  onSave: (updated: AnalyzedItem) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function ItemEditSheet({ item, onSave, onDelete, onClose }: Props) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const category = fd.get('category') as string;
    const quantity = Number(fd.get('quantity'));
    const unitPrice = Number(fd.get('unitPrice'));
    const weightG = fd.get('weightG') ? Number(fd.get('weightG')) : null;
    const volumeMl = fd.get('volumeMl') ? Number(fd.get('volumeMl')) : null;

    let unitType: UnitType = 'per_count';
    if (weightG) unitType = 'per_100g';
    else if (volumeMl) unitType = 'per_100ml';

    const updated: AnalyzedItem = {
      ...item,
      name,
      category,
      quantity,
      unitPrice,
      subtotal: quantity * unitPrice,
      weightG,
      volumeMl,
      unitType,
      pricePer100: calcPricePer100({ ...item, unitPrice, weightG, volumeMl }),
    };
    onSave(updated);
  };

  const pricePer100 = calcPricePer100(item);

  return (
    <div className="edit-sheet show" style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      <div
        className="edit-backdrop"
        style={{ position: 'absolute', inset: 0, background: 'rgba(100,90,130,0.2)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />
      <div
        className="edit-panel"
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 420,
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.95)',
          borderBottom: 'none',
          borderRadius: '28px 28px 0 0',
          padding: '12px 20px 40px',
          boxShadow: '0 -8px 40px rgba(139,92,246,0.12)',
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)', margin: '0 auto 20px' }} />
        <div style={{ color: 'rgba(40,40,55,0.88)', fontSize: 17, fontWeight: 700, marginBottom: 18 }}>상품 편집</div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>상품명</div>
            <input name="name" className="fi" defaultValue={item.name} required style={{ width: '100%' }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>카테고리</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {CATEGORIES.map((cat) => (
                <label
                  key={cat.key}
                  style={{
                    padding: '8px 4px',
                    textAlign: 'center',
                    borderRadius: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <input type="radio" name="category" value={cat.key} defaultChecked={item.category === cat.key} style={{ display: 'none' }} />
                  <span style={{ fontSize: 18 }}>{cat.icon}</span>
                  <span style={{ color: 'rgba(80,80,110,0.58)', fontSize: 9 }}>{cat.key}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 11, fontWeight: 500, marginBottom: 6 }}>수량</div>
              <input name="quantity" type="number" className="fi" defaultValue={item.quantity} min={1} step={1} required style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 11, fontWeight: 500, marginBottom: 6 }}>단가 (¥)</div>
              <input name="unitPrice" type="number" className="fi" defaultValue={item.unitPrice} min={0} required style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            <div>
              <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 11, fontWeight: 500, marginBottom: 6 }}>중량 (g)</div>
              <input name="weightG" type="number" className="fi" defaultValue={item.weightG ?? ''} min={0} style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 11, fontWeight: 500, marginBottom: 6 }}>100g당 단가</div>
              <input className="fi" type="text" value={pricePer100 ? `¥${pricePer100}` : '-'} readOnly style={{ width: '100%', opacity: 0.6 }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onDelete}
              style={{ flex: 1, padding: 13, borderRadius: 13, background: 'rgba(239,68,68,0.1)', color: 'rgba(220,38,38,0.9)', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}
            >
              삭제
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: 13, borderRadius: 13, background: 'rgba(0,0,0,0.05)', color: 'rgba(80,80,110,0.58)', fontSize: 15, fontWeight: 500, border: 'none', cursor: 'pointer' }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{ flex: 2, padding: 13, borderRadius: 13, background: 'linear-gradient(135deg,rgba(139,92,246,0.85),rgba(99,102,241,0.85))', color: '#fff', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(139,92,246,0.3)' }}
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
