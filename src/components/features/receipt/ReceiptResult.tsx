'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalyzedReceipt, AnalyzedItem } from '@/types/domain';
import ItemEditSheet from './ItemEditSheet';

const CATEGORY_ICON: Record<string, string> = {
  '신선식품': '🥬', '가공식품': '🥫', '음료': '🥤', '주류': '🍺',
  '생활용품': '🧴', '청소용품': '🧹', '의약품/건강': '💊',
  '반려동물용품': '🐾', '육아용품': '👶', '기타': '📦',
};

interface Props {
  analyzed: AnalyzedReceipt;
  imageBase64: string | null;
  imageMimeType: string | null;
  locale: string;
}

export default function ReceiptResult({ analyzed, imageBase64, imageMimeType, locale }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<AnalyzedItem[]>(analyzed.items);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = items.reduce((s, i) => s + i.subtotal, 0);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt: { ...analyzed, totalAmount, items },
          items,
          imageBase64,
          imageMimeType,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? '저장 실패');
      }
      router.push(`/${locale}/dashboard`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    const newItem: AnalyzedItem = {
      name: '',
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
      category: '기타',
      tags: [],
      unitType: 'per_count',
      weightG: null,
      volumeMl: null,
      pricePer100: null,
    };
    setItems((prev) => [...prev, newItem]);
    setEditIndex(items.length);
  };

  const purchasedDate = new Date(analyzed.purchasedAt);
  const dateStr = `${purchasedDate.getFullYear()}년 ${purchasedDate.getMonth() + 1}월 ${purchasedDate.getDate()}일`;

  return (
    <>
      <div
        className="result-summary glass"
        style={{ margin: '0 16px 14px', padding: 20, background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: 22, boxShadow: '0 8px 32px rgba(139,92,246,0.08),0 2px 8px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,1)' }}
      >
        <div style={{ color: 'rgba(40,40,55,0.88)', fontSize: 20, fontWeight: 700 }}>{analyzed.storeName}</div>
        <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 13, marginTop: 4 }}>{dateStr}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, paddingTop: 14, borderTop: '0.5px solid rgba(0,0,0,0.07)' }}>
          <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 13 }}>합계</div>
          <div>
            <div style={{ color: 'rgba(40,40,55,0.88)', fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>¥{totalAmount.toLocaleString()}</div>
            {analyzed.taxAmount && (
              <div style={{ color: 'rgba(120,120,150,0.38)', fontSize: 11, marginTop: 2, textAlign: 'right' }}>소비세 포함 ¥{analyzed.taxAmount.toLocaleString()}</div>
            )}
          </div>
        </div>
      </div>

      <div
        className="items-wrap glass"
        style={{ margin: '0 16px 14px', overflow: 'hidden', background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: 22, boxShadow: '0 8px 32px rgba(139,92,246,0.08),0 2px 8px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,1)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px' }}>
          <div style={{ color: 'rgba(40,40,55,0.88)', fontSize: 15, fontWeight: 700 }}>상품 목록</div>
          <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 12 }}>{items.length}개 항목 · 탭하여 편집</div>
        </div>

        {items.map((item, idx) => (
          <div
            key={idx}
            onClick={() => setEditIndex(idx)}
            style={{ padding: '13px 16px', cursor: 'pointer', borderTop: '0.5px solid rgba(0,0,0,0.06)', transition: 'background .15s' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ color: 'rgba(40,40,55,0.88)', fontSize: 14, fontWeight: 500, flex: 1, minWidth: 0 }}>{item.name || '(이름 없음)'}</div>
              <div style={{ color: 'rgba(40,40,55,0.88)', fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>¥{item.subtotal.toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6, flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 9px', borderRadius: 20, fontSize: 11, background: 'rgba(139,92,246,0.08)', color: 'rgba(99,102,241,0.9)', border: '0.5px solid rgba(139,92,246,0.2)' }}>
                {CATEGORY_ICON[item.category] ?? '📦'} {item.category}
              </div>
              <div style={{ color: 'rgba(120,120,150,0.38)', fontSize: 11 }}>×{item.quantity} · ¥{item.unitPrice}</div>
              {item.pricePer100 && (
                <div style={{ marginLeft: 'auto', padding: '2px 9px', borderRadius: 20, fontSize: 11, background: 'rgba(52,211,153,0.1)', color: 'rgba(5,150,105,0.9)', border: '0.5px solid rgba(52,211,153,0.3)', fontVariantNumeric: 'tabular-nums' }}>
                  100g ¥{item.pricePer100}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        onClick={handleAddItem}
        style={{ margin: '0 16px 12px', padding: 13, border: '1.5px dashed rgba(139,92,246,0.22)', borderRadius: 22, color: 'rgba(99,102,241,0.8)', fontSize: 14, fontWeight: 500, textAlign: 'center', cursor: 'pointer', transition: 'all .15s' }}
      >
        ＋ 상품 추가
      </div>

      {error && (
        <div style={{ margin: '0 16px 12px', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 13, color: 'rgba(220,38,38,0.9)', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div
        onClick={handleSave}
        style={{ margin: '0 16px', padding: 15, textAlign: 'center', background: saving ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg,rgba(139,92,246,0.82),rgba(99,102,241,0.82))', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 22, color: '#fff', fontSize: 16, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 8px 28px rgba(139,92,246,0.28), inset 0 1px 0 rgba(255,255,255,0.2)', transition: 'transform .2s' }}
      >
        {saving ? '저장 중...' : '가계부에 저장하기'}
      </div>

      {editIndex !== null && (
        <ItemEditSheet
          item={items[editIndex]}
          onSave={(updated) => {
            setItems((prev) => prev.map((it, i) => (i === editIndex ? updated : it)));
            setEditIndex(null);
          }}
          onDelete={() => {
            setItems((prev) => prev.filter((_, i) => i !== editIndex));
            setEditIndex(null);
          }}
          onClose={() => setEditIndex(null)}
        />
      )}
    </>
  );
}
