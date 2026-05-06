'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name_ko: string;
  name_ja: string;
  icon: string;
  is_system: boolean;
  group_id: string | null;
}

interface CategoriesClientProps {
  locale: string;
  categories: Category[];
}

const tp = 'rgba(40,40,55,0.88)';
const ts = 'rgba(80,80,110,0.58)';
const card = 'rgba(255,255,255,0.52)';
const cb = 'rgba(255,255,255,0.85)';
const blur = 'blur(40px) saturate(180%)';

const COMMON_ICONS = ['🛒', '🏪', '🍱', '🧃', '🫙', '🥩', '🐟', '🥦', '🍜', '🍞', '🧁', '☕', '🍷', '🫧', '🧼', '🪥', '💊', '🐶', '👶', '📦'];

export default function CategoriesClient({ locale, categories: initialCategories }: CategoriesClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [formNameKo, setFormNameKo] = useState('');
  const [formNameJa, setFormNameJa] = useState('');
  const [formIcon, setFormIcon] = useState('📦');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!formNameKo.trim() || !formNameJa.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name_ko: formNameKo.trim(), name_ja: formNameJa.trim(), icon: formIcon }),
      });
      const data = await res.json() as { id: string };
      setCategories(prev => [...prev, {
        id: data.id,
        name_ko: formNameKo.trim(),
        name_ja: formNameJa.trim(),
        icon: formIcon,
        is_system: false,
        group_id: null,
      }]);
      setShowForm(false);
      setFormNameKo('');
      setFormNameJa('');
      setFormIcon('📦');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/settings/categories/${id}`, { method: 'DELETE' });
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  const systemCategories = categories.filter(c => c.is_system);
  const customCategories = categories.filter(c => !c.is_system);

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
          {locale === 'ja' ? 'カテゴリ管理' : '카테고리 관리'}
        </div>
      </div>

      <div style={{ margin: '16px 16px 0', animation: 'up .5s cubic-bezier(.34,1.4,.64,1) both' }}>
        {/* 시스템 카테고리 */}
        <div style={{ color: ts, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
          {locale === 'ja' ? 'システムカテゴリ' : '시스템 카테고리'}
        </div>
        <div style={{
          background: card, backdropFilter: blur, WebkitBackdropFilter: blur,
          border: `1px solid ${cb}`, borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)', marginBottom: 20,
        }}>
          {systemCategories.map((cat, i) => (
            <div key={cat.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 16px', borderTop: i === 0 ? 'none' : '0.5px solid rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <span style={{ color: tp, fontSize: 14 }}>
                  {locale === 'ja' ? cat.name_ja : cat.name_ko}
                </span>
              </div>
              <span style={{ fontSize: 16 }}>🔒</span>
            </div>
          ))}
        </div>

        {/* 커스텀 카테고리 */}
        <div style={{ color: ts, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
          {locale === 'ja' ? 'カスタムカテゴリ' : '커스텀 카테고리'}
        </div>
        <div style={{
          background: card, backdropFilter: blur, WebkitBackdropFilter: blur,
          border: `1px solid ${cb}`, borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)', marginBottom: 14,
        }}>
          {customCategories.length === 0 ? (
            <div style={{ padding: '20px 16px', color: ts, fontSize: 13, textAlign: 'center' }}>
              {locale === 'ja' ? 'カスタムカテゴリがありません' : '커스텀 카테고리가 없습니다'}
            </div>
          ) : (
            customCategories.map((cat, i) => (
              <div key={cat.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 16px', borderTop: i === 0 ? 'none' : '0.5px solid rgba(0,0,0,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{cat.icon}</span>
                  <div>
                    <div style={{ color: tp, fontSize: 14, fontWeight: 500 }}>
                      {locale === 'ja' ? cat.name_ja : cat.name_ko}
                    </div>
                    <div style={{ color: ts, fontSize: 11, marginTop: 1 }}>
                      {locale === 'ja' ? cat.name_ko : cat.name_ja}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(cat.id)}
                  style={{
                    padding: '5px 12px', borderRadius: 10,
                    background: 'rgba(239,68,68,0.08)', border: 'none',
                    color: 'rgba(220,38,38,0.8)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {locale === 'ja' ? '削除' : '삭제'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* 추가 버튼 */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: '100%', padding: '14px', borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))',
              border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(139,92,246,0.25)',
            }}
          >
            {locale === 'ja' ? '＋ カテゴリを追加' : '＋ 카테고리 추가'}
          </button>
        )}

        {/* 추가 폼 */}
        {showForm && (
          <div style={{
            background: card, backdropFilter: blur, WebkitBackdropFilter: blur,
            border: `1px solid ${cb}`, borderRadius: 18,
            boxShadow: '0 8px 32px rgba(139,92,246,0.1)',
            padding: '18px 16px', animation: 'up .3s ease both',
          }}>
            <div style={{ color: tp, fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
              {locale === 'ja' ? 'カテゴリを追加' : '카테고리 추가'}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ color: ts, fontSize: 12, marginBottom: 5 }}>
                {locale === 'ja' ? '名前（韓国語）' : '이름 (한국어)'}
              </div>
              <input
                value={formNameKo}
                onChange={e => setFormNameKo(e.target.value)}
                placeholder="예) 건강식품"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)',
                  color: tp, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ color: ts, fontSize: 12, marginBottom: 5 }}>
                {locale === 'ja' ? '名前（日本語）' : '이름 (일본어)'}
              </div>
              <input
                value={formNameJa}
                onChange={e => setFormNameJa(e.target.value)}
                placeholder="例）健康食品"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)',
                  color: tp, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: ts, fontSize: 12, marginBottom: 8 }}>
                {locale === 'ja' ? 'アイコン' : '아이콘'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {COMMON_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setFormIcon(icon)}
                    style={{
                      width: 38, height: 38, borderRadius: 10, fontSize: 20,
                      background: formIcon === icon ? 'rgba(139,92,246,0.15)' : 'rgba(0,0,0,0.04)',
                      border: formIcon === icon ? '2px solid rgba(139,92,246,0.5)' : '2px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
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
                onClick={handleAdd}
                disabled={saving || !formNameKo.trim() || !formNameJa.trim()}
                style={{
                  flex: 2, padding: '12px', borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))',
                  border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: (saving || !formNameKo.trim() || !formNameJa.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (saving || !formNameKo.trim() || !formNameJa.trim()) ? 0.6 : 1,
                }}
              >
                {saving
                  ? (locale === 'ja' ? '保存中...' : '저장 중...')
                  : (locale === 'ja' ? '追加' : '추가')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
