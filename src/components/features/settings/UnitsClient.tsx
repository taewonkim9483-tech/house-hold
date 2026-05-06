'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name_ko: string;
  name_ja: string;
}

interface SystemUnit {
  id: string;
  unit_type: string;
  label_ko: string;
  label_ja: string;
  is_system: boolean;
}

interface CustomUnit {
  id: string;
  item_name: string | null;
  category_id: string | null;
  unit_type: string;
  categories: { name_ko: string; name_ja: string } | null;
}

interface UnitsClientProps {
  locale: string;
  systemUnits: SystemUnit[];
  customUnits: CustomUnit[];
  categories: Category[];
}

const tp = 'rgba(40,40,55,0.88)';
const ts = 'rgba(80,80,110,0.58)';
const card = 'rgba(255,255,255,0.52)';
const cb = 'rgba(255,255,255,0.85)';
const blur = 'blur(40px) saturate(180%)';

const UNIT_OPTIONS = [
  { value: 'per_count', ko: '개당', ja: '個あたり' },
  { value: 'per_g', ko: 'g당', ja: 'gあたり' },
  { value: 'per_100g', ko: '100g당', ja: '100gあたり' },
  { value: 'per_ml', ko: 'ml당', ja: 'mlあたり' },
  { value: 'per_100ml', ko: '100ml당', ja: '100mlあたり' },
];

function unitLabel(unitType: string, locale: string): string {
  const opt = UNIT_OPTIONS.find(o => o.value === unitType);
  if (!opt) return unitType;
  return locale === 'ja' ? opt.ja : opt.ko;
}

export default function UnitsClient({ locale, systemUnits, customUnits: initialCustomUnits, categories }: UnitsClientProps) {
  const router = useRouter();
  const [customUnits, setCustomUnits] = useState(initialCustomUnits);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formItemName, setFormItemName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formUnitType, setFormUnitType] = useState('per_100g');
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditingId(null);
    setFormItemName('');
    setFormCategoryId('');
    setFormUnitType('per_100g');
    setShowForm(true);
  }

  function openEdit(unit: CustomUnit) {
    setEditingId(unit.id);
    setFormItemName(unit.item_name ?? '');
    setFormCategoryId(unit.category_id ?? '');
    setFormUnitType(unit.unit_type);
    setShowForm(true);
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      if (editingId) {
        await fetch(`/api/settings/units/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_name: formItemName || null,
            category_id: formCategoryId || null,
            unit_type: formUnitType,
          }),
        });
      } else {
        await fetch('/api/settings/units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_name: formItemName || null,
            category_id: formCategoryId || null,
            unit_type: formUnitType,
          }),
        });
      }
      setShowForm(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/settings/units/${id}`, { method: 'DELETE' });
    setCustomUnits(prev => prev.filter(u => u.id !== id));
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
          {locale === 'ja' ? '単位設定' : '단위 설정'}
        </div>
      </div>

      <div style={{ margin: '16px 16px 0', animation: 'up .5s cubic-bezier(.34,1.4,.64,1) both' }}>
        {/* 시스템 기본 */}
        <div style={{ color: ts, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
          {locale === 'ja' ? 'システムデフォルト' : '시스템 기본'}
        </div>
        <div style={{
          background: card, backdropFilter: blur, WebkitBackdropFilter: blur,
          border: `1px solid ${cb}`, borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          marginBottom: 20,
        }}>
          {systemUnits.map((u, i) => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 16px', borderTop: i === 0 ? 'none' : '0.5px solid rgba(0,0,0,0.06)',
            }}>
              <span style={{ color: tp, fontSize: 14 }}>
                {locale === 'ja' ? u.label_ja : u.label_ko}
              </span>
              <span style={{ fontSize: 16 }}>🔒</span>
            </div>
          ))}
        </div>

        {/* 커스텀 설정 */}
        <div style={{ color: ts, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
          {locale === 'ja' ? 'カスタム設定' : '커스텀 설정'}
        </div>
        <div style={{
          background: card, backdropFilter: blur, WebkitBackdropFilter: blur,
          border: `1px solid ${cb}`, borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          marginBottom: 14,
        }}>
          {customUnits.length === 0 ? (
            <div style={{ padding: '20px 16px', color: ts, fontSize: 13, textAlign: 'center' }}>
              {locale === 'ja' ? 'カスタム単位がありません' : '커스텀 단위가 없습니다'}
            </div>
          ) : (
            customUnits.map((u, i) => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 16px', borderTop: i === 0 ? 'none' : '0.5px solid rgba(0,0,0,0.06)',
              }}>
                <div>
                  <div style={{ color: tp, fontSize: 14, fontWeight: 500 }}>
                    {u.item_name ?? (u.categories ? (locale === 'ja' ? u.categories.name_ja : u.categories.name_ko) : '—')}
                  </div>
                  <div style={{ color: ts, fontSize: 12, marginTop: 2 }}>
                    {unitLabel(u.unit_type, locale)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openEdit(u)}
                    style={{
                      padding: '5px 12px', borderRadius: 10,
                      background: 'rgba(139,92,246,0.1)', border: 'none',
                      color: 'rgba(99,102,241,0.9)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {locale === 'ja' ? '編集' : '편집'}
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    style={{
                      padding: '5px 12px', borderRadius: 10,
                      background: 'rgba(239,68,68,0.08)', border: 'none',
                      color: 'rgba(220,38,38,0.8)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {locale === 'ja' ? '削除' : '삭제'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 추가 버튼 */}
        {!showForm && (
          <button
            onClick={openAdd}
            style={{
              width: '100%', padding: '14px', borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))',
              border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(139,92,246,0.25)',
            }}
          >
            {locale === 'ja' ? '＋ カスタム単位を追加' : '＋ 커스텀 단위 추가'}
          </button>
        )}

        {/* 추가/편집 폼 */}
        {showForm && (
          <div style={{
            background: card, backdropFilter: blur, WebkitBackdropFilter: blur,
            border: `1px solid ${cb}`, borderRadius: 18,
            boxShadow: '0 8px 32px rgba(139,92,246,0.1)',
            padding: '18px 16px', animation: 'up .3s ease both',
          }}>
            <div style={{ color: tp, fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
              {editingId
                ? (locale === 'ja' ? '単位を編集' : '단위 편집')
                : (locale === 'ja' ? '単位を追加' : '단위 추가')}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ color: ts, fontSize: 12, marginBottom: 5 }}>
                {locale === 'ja' ? '商品名（任意）' : '상품명 (선택)'}
              </div>
              <input
                value={formItemName}
                onChange={e => setFormItemName(e.target.value)}
                placeholder={locale === 'ja' ? '例）オリーブオイル' : '예) 올리브오일'}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)',
                  color: tp, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ color: ts, fontSize: 12, marginBottom: 5 }}>
                {locale === 'ja' ? 'カテゴリ（任意）' : '카테고리 (선택)'}
              </div>
              <select
                value={formCategoryId}
                onChange={e => setFormCategoryId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)',
                  color: tp, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              >
                <option value="">{locale === 'ja' ? '選択なし' : '선택 안 함'}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {locale === 'ja' ? c.name_ja : c.name_ko}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: ts, fontSize: 12, marginBottom: 5 }}>
                {locale === 'ja' ? '単位' : '단위'}
              </div>
              <select
                value={formUnitType}
                onChange={e => setFormUnitType(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)',
                  color: tp, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              >
                {UNIT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {locale === 'ja' ? opt.ja : opt.ko}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: 'rgba(0,0,0,0.06)', border: 'none',
                  color: ts, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {locale === 'ja' ? 'キャンセル' : '취소'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 2, padding: '12px', borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))',
                  border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? (locale === 'ja' ? '保存中...' : '저장 중...')
                  : (locale === 'ja' ? '保存' : '저장')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
