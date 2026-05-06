'use client';

import { useState, useCallback } from 'react';
import ScopeSelector from '@/components/features/scope/ScopeSelector';
import { useScopeStore } from '@/hooks/useScopeStore';

interface BudgetWeek {
  id: string;
  week_start: string;
  week_end: string;
  base_amount: number;
  spent_amount: number;
  status: 'open' | 'pending_close' | 'closed';
}

interface CurrentWeek {
  week_id: string | null;
  week_start: string;
  week_end: string;
  base_amount: number;
  spent_amount: number;
  remaining: number;
  is_over: boolean;
  status: string;
}

interface BudgetClientProps {
  weeklyAmount: number | null;
  weeks: BudgetWeek[];
  current: CurrentWeek | null;
  locale: string;
}

const tp = 'rgba(40,40,55,0.88)';
const ts = 'rgba(80,80,110,0.58)';
const tt = 'rgba(120,120,150,0.38)';
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
    boxShadow: '0 8px 32px rgba(251,191,36,0.08),0 2px 8px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,1)',
    ...extra,
  };
}

function formatYen(n: number): string {
  return `¥${Math.abs(n).toLocaleString()}`;
}

function formatDate(s: string): string {
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const PRESETS = [15000, 20000, 25000, 30000];

export default function BudgetClient({ weeklyAmount, weeks, current, locale }: BudgetClientProps) {
  const { scope } = useScopeStore();
  const [tab, setTab] = useState<'setting' | 'closing'>('setting');
  const [inputAmount, setInputAmount] = useState(String(weeklyAmount ?? 20000));
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [closeOpt, setCloseOpt] = useState<'carry' | 'savings' | 'split'>('carry');
  const [carryInput, setCarryInput] = useState('');
  const [savingsInput, setSavingsInput] = useState('');
  const [closing, setClosing] = useState(false);
  const [closeResult, setCloseResult] = useState<{ next_week_budget: number } | null>(null);

  const remaining = current?.remaining ?? 0;
  const isOver = current?.is_over ?? false;

  const splitTotal = (parseInt(carryInput) || 0) + (parseInt(savingsInput) || 0);
  const splitOk = splitTotal === remaining;

  const handleSave = useCallback(async () => {
    const amount = parseInt(inputAmount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    setSaveMsg('');
    const groupId = scope.type === 'group' ? scope.groupId : undefined;
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekly_amount: amount, group_id: groupId }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg('저장되었습니다');
      setTimeout(() => setSaveMsg(''), 2000);
    } else {
      setSaveMsg('저장 실패');
    }
  }, [inputAmount]);

  const handleClose = useCallback(async () => {
    if (!current?.week_id) return;
    let toCarry = 0;
    let toSavings = 0;

    if (!isOver) {
      if (closeOpt === 'carry') { toCarry = remaining; toSavings = 0; }
      else if (closeOpt === 'savings') { toCarry = 0; toSavings = remaining; }
      else {
        if (!splitOk) return;
        toCarry = parseInt(carryInput) || 0;
        toSavings = parseInt(savingsInput) || 0;
      }
    }

    setClosing(true);
    const res = await fetch('/api/budgets/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_id: current.week_id, to_carry_over: toCarry, to_savings_pool: toSavings }),
    });
    setClosing(false);
    if (res.ok) {
      const data = await res.json();
      setCloseResult(data);
    }
  }, [current, isOver, remaining, closeOpt, splitOk, carryInput, savingsInput]);

  const pendingClose = current?.status === 'pending_close';
  const alreadyClosed = current?.status === 'closed';

  return (
    <div>
      {/* 헤더 */}
      <div style={{ padding:'52px 20px 10px', color:'rgba(40,40,55,0.88)', fontSize:20, fontWeight:700 }}>
        {locale === 'ja' ? '予算管理' : '예산 관리'}
      </div>

      {/* 범위 선택 */}
      <ScopeSelector />

      {/* Tabs */}
      <div style={{ display:'flex', margin:'0 16px 14px', background:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.85)', borderRadius:14, padding:3, boxShadow:'0 2px 8px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,1)' }}>
        {(['setting', 'closing'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex:1, padding:'9px 0', border:'none', cursor:'pointer', borderRadius:11, fontSize:13, fontWeight:500,
              fontFamily:'inherit',
              background: tab === t ? 'rgba(255,255,255,0.9)' : 'transparent',
              color: tab === t ? tp : ts,
              boxShadow: tab === t ? '0 2px 10px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,1)' : 'none',
              transition: 'all .22s cubic-bezier(.34,1.2,.64,1)',
            }}
          >
            {t === 'setting' ? '예산 설정' : '주간 마감'}
            {t === 'closing' && pendingClose && (
              <span style={{ marginLeft:6, background:'rgba(239,68,68,0.9)', color:'#fff', fontSize:10, borderRadius:20, padding:'1px 6px' }}>마감 필요</span>
            )}
          </button>
        ))}
      </div>

      {/* ─── 예산 설정 탭 ─── */}
      {tab === 'setting' && (
        <>
          {/* Hero card */}
          <div style={{ margin:'0 16px 14px', padding:26, position:'relative', overflow:'hidden', background:'rgba(255,255,255,0.58)', backdropFilter:'blur(40px) saturate(200%)', WebkitBackdropFilter:'blur(40px) saturate(200%)', border:'1px solid rgba(255,255,255,0.9)', borderRadius:28, boxShadow:'0 16px 48px rgba(251,191,36,0.12),0 4px 12px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,1)', animation:'up .6s cubic-bezier(.34,1.4,.64,1) both' }}>
            <div style={{ position:'absolute', top:-50, right:-30, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(251,191,36,0.18) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div style={{ color:'rgba(161,128,10,0.7)', fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:6 }}>
              {locale === 'ja' ? '今週の予算' : '현재 주간 예산'}
            </div>
            <div style={{ fontSize:50, fontWeight:700, color:tp, letterSpacing:-2, lineHeight:1 }}>
              <span style={{ fontSize:24, fontWeight:500, opacity:0.6, marginRight:2 }}>¥</span>
              {(current?.base_amount ?? weeklyAmount ?? 0).toLocaleString()}
            </div>
            {current && (
              <div style={{ color:ts, fontSize:13, marginTop:7 }}>
                {formatDate(current.week_start)} – {formatDate(current.week_end)} ·{' '}
                {formatYen(current.spent_amount)} 지출 ·{' '}
                <span style={{ color: isOver ? 'rgba(239,68,68,0.8)' : 'rgba(5,150,105,0.9)' }}>
                  {isOver ? `${formatYen(remaining)} 초과` : `${formatYen(remaining)} 잔액`}
                </span>
              </div>
            )}
            <div style={{ marginTop:18 }}>
              <div style={{ color:ts, fontSize:12, marginBottom:7 }}>다음 주부터 적용할 예산</div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <input
                  type="number"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  style={{ flex:1, padding:'13px 15px', background:'rgba(255,255,255,0.65)', border:'1px solid rgba(255,255,255,0.9)', borderRadius:13, color:tp, fontSize:18, fontWeight:600, fontFamily:'inherit', outline:'none', boxShadow:'inset 0 1px 3px rgba(0,0,0,0.04)' }}
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ padding:'13px 18px', borderRadius:13, background:'linear-gradient(135deg,rgba(245,158,11,0.85),rgba(251,191,36,0.8))', border:'1px solid rgba(255,255,255,0.4)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(245,158,11,0.28),inset 0 1px 0 rgba(255,255,255,0.25)', opacity: saving ? 0.7 : 1 }}
                >
                  저장
                </button>
              </div>
              {saveMsg && <div style={{ marginTop:8, fontSize:12, color:'rgba(5,150,105,0.9)' }}>{saveMsg}</div>}
            </div>
          </div>

          {/* Presets */}
          <div style={{ margin:'0 16px 14px', animation:'up .5s cubic-bezier(.34,1.4,.64,1) .08s both' }}>
            <div style={{ color:ts, fontSize:12, paddingLeft:4, marginBottom:8 }}>빠른 선택</div>
            <div style={{ display:'flex', gap:8 }}>
              {PRESETS.map((p) => {
                const isCurrent = p === (weeklyAmount ?? 0);
                return (
                  <button
                    key={p}
                    onClick={() => setInputAmount(String(p))}
                    style={{ flex:1, padding:'12px 6px', textAlign:'center', borderRadius:22, cursor:'pointer', fontFamily:'inherit', border: isCurrent ? '1px solid rgba(245,158,11,0.4)' : `1px solid ${cb}`, background: isCurrent ? 'rgba(245,158,11,0.08)' : card, backdropFilter: blur, WebkitBackdropFilter: blur, boxShadow:'0 8px 32px rgba(251,191,36,0.08),0 2px 8px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,1)' }}
                  >
                    <div style={{ color:tp, fontSize:13, fontWeight:600, fontVariantNumeric:'tabular-nums' }}>¥{p.toLocaleString()}</div>
                    <div style={{ color:tt, fontSize:10, marginTop:2 }}>
                      {isCurrent ? '현재 ✓' : p === 15000 ? '절약형' : p === 25000 ? '여유형' : '넉넉'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 주간 기록 */}
          <div style={{ margin:'0 16px 14px', animation:'up .6s cubic-bezier(.34,1.4,.64,1) .14s both' }}>
            <div style={{ color:tp, fontSize:15, fontWeight:700, paddingLeft:4, marginBottom:10 }}>최근 주간 기록</div>
            <div style={glass()}>
              {weeks.length === 0 && (
                <div style={{ padding:'20px 16px', textAlign:'center', color:ts, fontSize:13 }}>기록이 없습니다</div>
              )}
              {weeks.map((w, i) => {
                const rem = w.base_amount - w.spent_amount;
                const isOpen = w.status === 'open' || w.status === 'pending_close';
                const isWeekOver = rem < 0;
                return (
                  <div key={w.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderTop: i === 0 ? 'none' : '0.5px solid rgba(0,0,0,0.06)' }}>
                    <div>
                      <div style={{ color:ts, fontSize:12, marginBottom:4 }}>
                        {formatDate(w.week_start)} – {formatDate(w.week_end)}
                        {isOpen ? ' (이번 주)' : ''}
                      </div>
                      <div style={{
                        display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:500,
                        background: isOpen ? 'rgba(251,191,36,0.15)' : isWeekOver ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.12)',
                        color: isOpen ? 'rgba(161,128,10,0.9)' : isWeekOver ? 'rgba(185,28,28,0.8)' : 'rgba(5,150,105,0.9)',
                      }}>
                        {isOpen ? '● 진행 중' : isWeekOver ? `↓ ${formatYen(rem)} 초과` : `↑ ${formatYen(rem)} 잔액`}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ color:tp, fontSize:14, fontWeight:700, fontVariantNumeric:'tabular-nums' }}>{formatYen(w.spent_amount)}</div>
                      <div style={{ color:ts, fontSize:11, marginTop:2, fontVariantNumeric:'tabular-nums' }}>예산 {formatYen(w.base_amount)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ─── 주간 마감 탭 ─── */}
      {tab === 'closing' && (
        <>
          {closeResult ? (
            <div style={{ margin:'0 16px', padding:32, textAlign:'center', ...glass({ borderRadius:28 }) }}>
              <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
              <div style={{ color:tp, fontSize:18, fontWeight:700, marginBottom:8 }}>마감 완료!</div>
              <div style={{ color:ts, fontSize:14 }}>다음 주 예산: <strong>¥{closeResult.next_week_budget.toLocaleString()}</strong></div>
            </div>
          ) : alreadyClosed ? (
            <div style={{ margin:'0 16px', padding:32, textAlign:'center', ...glass({ borderRadius:28 }) }}>
              <div style={{ color:ts, fontSize:15 }}>이번 주는 이미 마감 처리되었습니다.</div>
            </div>
          ) : !current ? (
            <div style={{ margin:'0 16px', padding:32, textAlign:'center', ...glass({ borderRadius:28 }) }}>
              <div style={{ color:ts, fontSize:15 }}>예산을 먼저 설정해주세요.</div>
            </div>
          ) : (
            <>
              {/* 헤더 */}
              <div style={{ margin:'0 16px 14px', padding:20, animation:'up .4s cubic-bezier(.34,1.4,.64,1) both', ...glass() }}>
                <div style={{ color:tp, fontSize:20, fontWeight:700, marginBottom:4 }}>이번 주 마감 처리</div>
                <div style={{ color:ts, fontSize:13 }}>
                  {formatDate(current.week_start)} – {formatDate(current.week_end)}
                </div>
              </div>

              {/* 잔액 카드 */}
              <div style={{ margin:'0 16px 14px', padding:28, textAlign:'center', position:'relative', overflow:'hidden', background:'rgba(255,255,255,0.58)', backdropFilter:'blur(40px) saturate(200%)', WebkitBackdropFilter:'blur(40px) saturate(200%)', border:'1px solid rgba(255,255,255,0.9)', borderRadius:28, boxShadow: isOver ? '0 16px 48px rgba(239,68,68,0.1),0 4px 12px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,1)' : '0 16px 48px rgba(52,211,153,0.1),0 4px 12px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,1)', animation:'up .5s cubic-bezier(.34,1.4,.64,1) .05s both' }}>
                <div style={{ position:'absolute', top:-40, right:-30, width:140, height:140, borderRadius:'50%', background:`radial-gradient(circle,${isOver ? 'rgba(239,68,68,0.15)' : 'rgba(134,239,172,0.2)'} 0%,transparent 70%)` }} />
                <div style={{ color: isOver ? 'rgba(185,28,28,0.8)' : 'rgba(5,150,105,0.8)', fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:8 }}>
                  {isOver ? '이번 주 초과' : '이번 주 잔액'}
                </div>
                <div style={{ fontSize:52, fontWeight:700, color:tp, letterSpacing:-2, fontVariantNumeric:'tabular-nums' }}>
                  <span style={{ fontSize:24, fontWeight:500, opacity:0.6, marginRight:2 }}>¥</span>
                  {Math.abs(remaining).toLocaleString()}
                </div>
                <div style={{ color:ts, fontSize:13, marginTop:7 }}>
                  예산 {formatYen(current.base_amount)} 중 {formatYen(current.spent_amount)} 지출
                </div>
              </div>

              {isOver ? (
                <>
                  <div style={{ margin:'0 16px 14px', padding:16, ...glass() }}>
                    <div style={{ color:'rgba(185,28,28,0.9)', fontSize:14, fontWeight:600, marginBottom:6 }}>초과 처리</div>
                    <div style={{ color:ts, fontSize:13 }}>
                      이번 주 {formatYen(Math.abs(remaining))} 초과했습니다.<br />
                      다음 주 예산은 {formatYen((weeklyAmount ?? 0) + remaining)} 으로 설정됩니다.
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={closing}
                    style={{ margin:'0 16px', padding:15, width:'calc(100% - 32px)', display:'block', textAlign:'center', background:'linear-gradient(135deg,rgba(239,68,68,0.82),rgba(220,38,38,0.82))', border:'1px solid rgba(255,255,255,0.4)', borderRadius:22, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 8px 28px rgba(239,68,68,0.25),inset 0 1px 0 rgba(255,255,255,0.2)', opacity: closing ? 0.7 : 1 }}
                  >
                    {closing ? '처리 중...' : '마감 확정하기'}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ color:tp, fontSize:15, fontWeight:700, padding:'0 20px', marginBottom:10, animation:'up .4s cubic-bezier(.34,1.4,.64,1) .1s both' }}>
                    잔액을 어떻게 처리할까요?
                  </div>
                  <div style={{ margin:'0 16px', display:'flex', flexDirection:'column', gap:10, animation:'up .5s cubic-bezier(.34,1.4,.64,1) .14s both' }}>
                    {([
                      { key: 'carry', title: '전액 이월', desc: '다음 주 예산에 전액 추가', amount: `+${formatYen(remaining)}` },
                      { key: 'savings', title: '전액 적금 풀', desc: '적금 풀에 누적', amount: `+${formatYen(remaining)}` },
                      { key: 'split', title: '직접 나누기', desc: '이월 + 적금 풀 비율 설정', amount: formatYen(remaining) },
                    ] as const).map((opt) => (
                      <div
                        key={opt.key}
                        onClick={() => setCloseOpt(opt.key)}
                        style={{ padding:17, display:'flex', alignItems:'center', gap:14, cursor:'pointer', border: closeOpt === opt.key ? '1.5px solid rgba(99,102,241,0.35)' : `1.5px solid rgba(255,255,255,0.7)`, borderRadius:22, background: closeOpt === opt.key ? 'rgba(139,92,246,0.06)' : card, backdropFilter: blur, WebkitBackdropFilter: blur, boxShadow: closeOpt === opt.key ? '0 0 20px rgba(139,92,246,0.08)' : '0 8px 32px rgba(251,191,36,0.08),0 2px 8px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,1)' }}
                      >
                        <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, border: closeOpt === opt.key ? '2px solid rgba(99,102,241,0.8)' : '2px solid rgba(0,0,0,0.12)', background: closeOpt === opt.key ? 'rgba(99,102,241,0.85)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: closeOpt === opt.key ? '0 0 10px rgba(99,102,241,0.3)' : 'none', transition:'all .2s' }}>
                          {closeOpt === opt.key && <div style={{ width:8, height:8, borderRadius:'50%', background:'white' }} />}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ color:tp, fontSize:15, fontWeight:500 }}>{opt.title}</div>
                          <div style={{ color:ts, fontSize:12, marginTop:3 }}>{opt.desc}</div>
                        </div>
                        <div style={{ color:tp, fontSize:15, fontWeight:700, flexShrink:0, fontVariantNumeric:'tabular-nums' }}>{opt.amount}</div>
                      </div>
                    ))}
                  </div>

                  {/* 직접 나누기 입력 */}
                  {closeOpt === 'split' && (
                    <div style={{ margin:'10px 16px 0', padding:16, background:'rgba(255,255,255,0.55)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:22, animation:'up .3s cubic-bezier(.34,1.4,.64,1) both' }}>
                      {[
                        { label:'이월 금액', value: carryInput, set: setCarryInput },
                        { label:'적금 풀', value: savingsInput, set: setSavingsInput },
                      ].map((row) => (
                        <div key={row.label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                          <div style={{ color:ts, fontSize:13, flex:1 }}>{row.label}</div>
                          <input
                            type="number"
                            value={row.value}
                            onChange={(e) => row.set(e.target.value)}
                            placeholder="0"
                            style={{ width:110, padding:'10px 12px', background:'rgba(255,255,255,0.75)', border:'1px solid rgba(255,255,255,0.9)', borderRadius:12, color:tp, fontSize:15, fontWeight:600, fontFamily:'inherit', fontVariantNumeric:'tabular-nums', outline:'none', textAlign:'right', boxShadow:'inset 0 1px 3px rgba(0,0,0,0.04)' }}
                          />
                        </div>
                      ))}
                      <div style={{ paddingTop:10, borderTop:'0.5px solid rgba(0,0,0,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:0 }}>
                        <div style={{ color:ts, fontSize:12 }}>합계</div>
                        <div style={{ color: splitOk ? 'rgba(5,150,105,0.9)' : 'rgba(239,68,68,0.8)', fontSize:14, fontWeight:700, fontVariantNumeric:'tabular-nums' }}>
                          {splitOk ? `¥${splitTotal.toLocaleString()} ✓` : `¥${splitTotal.toLocaleString()} (¥${remaining.toLocaleString()} 필요)`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 다음 주 미리보기 */}
                  <div style={{ margin:'14px 16px 0', padding:16, animation:'up .5s cubic-bezier(.34,1.4,.64,1) .22s both', ...glass() }}>
                    <div style={{ color:ts, fontSize:12, marginBottom:6 }}>다음 주 예산 미리보기</div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ color:tp, fontSize:14 }}>다음 주</div>
                      <div style={{ color:tp, fontSize:17, fontWeight:700, fontVariantNumeric:'tabular-nums' }}>
                        ¥{(() => {
                          const carry = closeOpt === 'carry' ? remaining : closeOpt === 'split' ? (parseInt(carryInput)||0) : 0;
                          return ((weeklyAmount ?? 0) + carry).toLocaleString();
                        })()}
                      </div>
                    </div>
                    <div style={{ color:ts, fontSize:11, marginTop:4 }}>
                      기준 {formatYen(weeklyAmount ?? 0)} + 이월{' '}
                      {formatYen(closeOpt === 'carry' ? remaining : closeOpt === 'split' ? (parseInt(carryInput)||0) : 0)}
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    disabled={closing || (closeOpt === 'split' && !splitOk)}
                    style={{ margin:'14px 16px 0', padding:15, width:'calc(100% - 32px)', display:'block', textAlign:'center', background:'linear-gradient(135deg,rgba(139,92,246,0.82),rgba(99,102,241,0.82))', border:'1px solid rgba(255,255,255,0.4)', borderRadius:22, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 8px 28px rgba(139,92,246,0.25),inset 0 1px 0 rgba(255,255,255,0.2)', animation:'up .5s cubic-bezier(.34,1.4,.64,1) .28s both', opacity: (closing || (closeOpt === 'split' && !splitOk)) ? 0.6 : 1 }}
                  >
                    {closing ? '처리 중...' : '마감 확정하기'}
                  </button>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
