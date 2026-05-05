'use client';

import { useState, useRef } from 'react';
import { PriceCompareResult, PriceHistoryRecord } from '@/types/domain';

const glass = {
  background: 'rgba(255,255,255,0.52)',
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.85)',
  borderRadius: 22,
  boxShadow: '0 8px 32px rgba(52,211,153,0.08),0 2px 8px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,1)',
} as React.CSSProperties;

const tp = 'rgba(40,40,55,0.88)';
const ts = 'rgba(80,80,110,0.58)';
const tt = 'rgba(120,120,150,0.38)';

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`;
}

function specLabel(item: { volume_ml?: number | null; weight_g?: number | null }) {
  if (item.volume_ml) return `${item.volume_ml}ml`;
  if (item.weight_g) return `${item.weight_g}g`;
  return '';
}

function LowestBadge() {
  return (
    <div style={{
      position: 'absolute', top: 10, right: 14,
      padding: '2px 9px', borderRadius: 20, fontSize: 10,
      background: 'rgba(52,211,153,0.15)', color: 'rgba(5,150,105,0.9)',
      border: '0.5px solid rgba(52,211,153,0.3)', fontWeight: 600,
    }}>
      🏷 최저가
    </div>
  );
}

function PriceRow({ record, showDivider }: { record: PriceHistoryRecord; showDivider?: boolean }) {
  const isLow = record.is_lowest;
  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        borderTop: showDivider ? '0.5px solid rgba(0,0,0,0.06)' : undefined,
        background: isLow ? 'rgba(52,211,153,0.05)' : undefined,
        position: 'relative',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: tp, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {record.store_name}
          </div>
          <div style={{ color: ts, fontSize: 11, marginTop: 2 }}>{formatDate(record.purchased_at)}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: tp, fontSize: 15, fontWeight: 700 }}>¥{record.unit_price}</div>
          {record.price_per_100 != null && (
            <div style={{
              fontSize: 11, marginTop: 2, fontWeight: isLow ? 600 : undefined,
              color: isLow ? 'rgba(5,150,105,0.9)' : tt,
            }}>
              100{record.store_name ? (record.store_name.includes('ml') ? 'ml' : 'g') : ''} ¥{record.price_per_100}{isLow ? ' ↓' : ''}
            </div>
          )}
        </div>
        {isLow && <LowestBadge />}
      </div>
    </>
  );
}

export default function PriceCompareClient({ locale }: { locale: string }) {
  const [view, setView] = useState<'upload' | 'loading' | 'result'>('upload');
  const [result, setResult] = useState<PriceCompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simOpen, setSimOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setPreview(URL.createObjectURL(file));
    setView('loading');
    setError(null);

    const fd = new FormData();
    fd.append('image', file);

    try {
      const res = await fetch('/api/price-compare', { method: 'POST', body: fd });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? '분석 실패');
      }
      const data: PriceCompareResult = await res.json();
      setResult(data);
      setView('result');
    } catch (e) {
      setError((e as Error).message);
      setView('upload');
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function reset() {
    setView('upload');
    setResult(null);
    setPreview(null);
    setSimOpen(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  const minPrice = result?.same_product.length
    ? Math.min(...result.same_product.map((r) => r.unit_price))
    : null;
  const avgPrice = result?.same_product.length
    ? Math.round(result.same_product.reduce((s, r) => s + r.unit_price, 0) / result.same_product.length)
    : null;

  return (
    <>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 14px' }}>
        {view !== 'upload' ? (
          <button onClick={reset} style={{ background: 'none', border: 'none', color: 'rgba(5,150,105,0.85)', fontSize: 16, fontWeight: 500, cursor: 'pointer', padding: 0 }}>
            ‹ {locale === 'ja' ? '戻る' : '뒤로'}
          </button>
        ) : <div style={{ width: 50 }} />}
        <div style={{ color: tp, fontSize: 17, fontWeight: 700 }}>
          {locale === 'ja' ? '価格比較' : '가격 비교'}
        </div>
        <div style={{ width: 50 }} />
      </div>

      {/* Upload view */}
      {view === 'upload' && (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              margin: '0 16px 14px', padding: '40px 24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
              cursor: 'pointer',
              border: '1.5px dashed rgba(52,211,153,0.3)', borderRadius: 28,
              background: 'rgba(255,255,255,0.38)',
              backdropFilter: 'blur(20px)',
              animation: 'up .5s cubic-bezier(.34,1.4,.64,1) both',
            }}
          >
            <div style={{
              width: 74, height: 74, borderRadius: 22,
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
              boxShadow: '0 8px 24px rgba(52,211,153,0.15),inset 0 1px 0 rgba(255,255,255,0.8)',
            }}>
              🔍
            </div>
            <div style={{ color: tp, fontSize: 18, fontWeight: 700 }}>
              {locale === 'ja' ? '商品を撮影してください' : '상품을 촬영하세요'}
            </div>
            <div style={{ color: ts, fontSize: 13, textAlign: 'center', lineHeight: 1.55 }}>
              {locale === 'ja'
                ? '過去の購入履歴から\n店舗別価格を比較します'
                : '과거 구매 이력에서\n매장별 가격을 비교해드려요'}
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            style={{ display: 'none' }}
            onChange={handleInputChange}
          />
          {error && (
            <div style={{ margin: '0 16px 14px', padding: '12px 16px', borderRadius: 14, background: 'rgba(239,68,68,0.1)', color: 'rgba(185,28,28,0.9)', fontSize: 13 }}>
              {error}
            </div>
          )}
        </>
      )}

      {/* Loading view */}
      {view === 'loading' && (
        <div style={{ margin: '0 16px 14px', ...glass, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 16, opacity: 0.7 }} />
          )}
          <div style={{ color: tp, fontSize: 16, fontWeight: 600 }}>
            {locale === 'ja' ? 'AI が分析中...' : 'AI가 분석 중이에요...'}
          </div>
          <div style={{ color: ts, fontSize: 13 }}>
            {locale === 'ja' ? 'しばらくお待ちください' : '잠시만 기다려주세요'}
          </div>
        </div>
      )}

      {/* Result view */}
      {view === 'result' && result && (
        <>
          {/* 상품 식별 결과 */}
          <div style={{ margin: '0 16px 12px', ...glass, padding: 20, animation: 'up .5s cubic-bezier(.34,1.4,.64,1) both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(5,150,105,0.8)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(52,211,153,0.8)', boxShadow: '0 0 8px rgba(52,211,153,0.5)', display: 'inline-block' }} />
              {locale === 'ja' ? 'AI商品認識完了' : 'AI 상품 인식 완료'}
            </div>
            <div style={{ color: tp, fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{result.identified.name}</div>
            <div style={{ color: ts, fontSize: 13, marginTop: 4 }}>{specLabel(result.identified)}</div>
            {result.identified.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {result.identified.tags.map((tag) => (
                  <span key={tag} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: 'rgba(255,255,255,0.6)', color: ts, border: '0.5px solid rgba(255,255,255,0.85)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 요약 칩 */}
          {result.same_product.length > 0 && (
            <div style={{ display: 'flex', gap: 10, padding: '0 16px', marginBottom: 12, animation: 'up .4s cubic-bezier(.34,1.4,.64,1) .06s both' }}>
              {[
                { val: String(result.same_product.length), label: locale === 'ja' ? '購入記録' : '구매 기록' },
                { val: `¥${minPrice}`, label: locale === 'ja' ? '最安値' : '최저 단가' },
                { val: `¥${avgPrice}`, label: locale === 'ja' ? '平均単価' : '평균 단가' },
              ].map((chip) => (
                <div key={chip.label} style={{ flex: 1, ...glass, padding: 14, textAlign: 'center' }}>
                  <div style={{ color: tp, fontSize: 19, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{chip.val}</div>
                  <div style={{ color: ts, fontSize: 11, marginTop: 3 }}>{chip.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* 동일 상품 구매 이력 */}
          <div style={{ margin: '0 16px 12px' }}>
            <div style={{ color: tp, fontSize: 15, fontWeight: 700, padding: '0 4px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, animation: 'up .4s cubic-bezier(.34,1.4,.64,1) .1s both' }}>
              {locale === 'ja' ? '同一商品購入履歴' : '동일 상품 구매 이력'}
              {result.same_product.length > 0 && (
                <span style={{ padding: '1px 9px', borderRadius: 20, fontSize: 11, background: 'rgba(255,255,255,0.6)', color: ts, border: '0.5px solid rgba(255,255,255,0.85)' }}>
                  {result.same_product.length}{locale === 'ja' ? '件' : '건'}
                </span>
              )}
            </div>

            {result.same_product.length === 0 ? (
              <div style={{ ...glass, padding: '28px 20px', textAlign: 'center', animation: 'up .5s cubic-bezier(.34,1.4,.64,1) .14s both' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📭</div>
                <div style={{ color: tp, fontSize: 14, fontWeight: 600 }}>
                  {locale === 'ja' ? 'まだ購入履歴がありません' : '아직 구매 이력이 없어요.'}
                </div>
                <div style={{ color: ts, fontSize: 12, marginTop: 6, lineHeight: 1.6 }}>
                  {locale === 'ja'
                    ? 'レシートを登録すると\n次回から比較できます'
                    : '영수증을 등록하면 다음부터 비교할 수 있어요.'}
                </div>
              </div>
            ) : (
              <div style={{ ...glass, overflow: 'hidden', animation: 'up .5s cubic-bezier(.34,1.4,.64,1) .14s both' }}>
                {result.same_product.map((record, i) => (
                  <PriceRow key={i} record={record} showDivider={i > 0} />
                ))}
              </div>
            )}
          </div>

          {/* 유사 상품 */}
          {result.similar_products.length > 0 && (
            <div style={{ margin: '0 16px 12px', animation: 'up .5s cubic-bezier(.34,1.4,.64,1) .2s both' }}>
              <div style={{ ...glass, overflow: 'hidden' }}>
                <div
                  onClick={() => setSimOpen((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
                >
                  <div>
                    <div style={{ color: tp, fontSize: 14, fontWeight: 600 }}>
                      {locale === 'ja' ? '同種類・他ブランド' : '같은 종류 · 타 브랜드'}
                    </div>
                    <div style={{ color: ts, fontSize: 11, marginTop: 2 }}>
                      {result.similar_products.length}{locale === 'ja' ? '個の商品' : '개 상품'}
                    </div>
                  </div>
                  <div style={{ color: ts, fontSize: 17, transform: simOpen ? 'rotate(90deg)' : undefined, transition: 'transform .25s' }}>
                    ›
                  </div>
                </div>

                <div style={{ overflow: 'hidden', maxHeight: simOpen ? 500 : 0, transition: 'max-height .35s cubic-bezier(.4,0,.2,1)' }}>
                  {result.similar_products.map((item, i) => (
                    <div key={i} style={{ padding: '13px 16px', borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ color: tp, fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                      <div style={{ color: ts, fontSize: 11, marginTop: 2 }}>{specLabel(item)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                        <div>
                          <div style={{ color: ts, fontSize: 11 }}>
                            {item.latest_price.store_name} · {formatDate(item.latest_price.purchased_at)}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                            {item.matched_tags.map((tag) => (
                              <span key={tag} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                padding: '2px 8px', borderRadius: 20, fontSize: 10,
                                background: 'rgba(139,92,246,0.08)', color: 'rgba(99,102,241,0.8)',
                                border: '0.5px solid rgba(139,92,246,0.2)',
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: tp, fontSize: 13, fontWeight: 700 }}>¥{item.latest_price.unit_price}</div>
                          {item.latest_price.price_per_100 != null && (
                            <div style={{ color: ts, fontSize: 11 }}>100g ¥{item.latest_price.price_per_100}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
