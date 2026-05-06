'use client';

import { useState, useEffect } from 'react';
import DailyBarChart from './DailyBarChart';
import CategoryAnalysis from './CategoryAnalysis';
import MemberBreakdown from './MemberBreakdown';

interface DailyEntry { date: string; amount: number }
interface CategoryEntry {
  category_id: string;
  name_ko: string;
  name_ja: string;
  icon: string;
  amount: number;
  ratio: number;
  item_count: number;
}
interface MemberEntry { user_id: string; display_name: string; amount: number }

interface MonthlyData {
  year: number;
  month: number;
  total_amount: number;
  receipt_count: number;
  daily_breakdown: DailyEntry[];
  category_breakdown: CategoryEntry[];
  member_breakdown: MemberEntry[];
  prev_month_total: number;
}

interface Props { locale: string }

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.52)',
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: '1.5px solid rgba(255,255,255,0.85)',
  borderRadius: 20,
  padding: '18px 16px',
  boxShadow: '0 4px 24px rgba(139,92,246,0.07), 0 1.5px 6px rgba(0,0,0,0.04)',
  marginBottom: 14,
};

function formatJPY(amount: number) {
  return `¥${amount.toLocaleString()}`;
}

export default function MonthlyReportClient({ locale }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [result, setResult] = useState<{ year: number; month: number; data: MonthlyData | null } | null>(null);
  const loading = result === null || result.year !== year || result.month !== month;
  const data = result?.year === year && result?.month === month ? result.data : null;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reports/monthly?year=${year}&month=${month}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: MonthlyData | null) => { if (!cancelled) setResult({ year, month, data: json }); })
      .catch(() => { if (!cancelled) setResult({ year, month, data: null }); });
    return () => { cancelled = true; };
  }, [year, month]);

  const canGoBack = (() => {
    const d = new Date(year, month - 2);
    const limit = new Date(now.getFullYear(), now.getMonth() - 11);
    return d >= limit;
  })();

  const canGoForward = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  function goBack() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function goForward() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const diff = data ? data.total_amount - data.prev_month_total : 0;
  const diffPct = data?.prev_month_total ? ((diff / data.prev_month_total) * 100).toFixed(1) : null;

  const monthLabel = locale === 'ja'
    ? `${year}年${month}月`
    : `${year}년 ${month}월`;

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {/* 월 네비게이션 */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={goBack}
          disabled={!canGoBack}
          style={{
            width: 36, height: 36, borderRadius: 10, border: 'none',
            background: canGoBack ? 'rgba(139,92,246,0.1)' : 'rgba(0,0,0,0.04)',
            color: canGoBack ? 'rgba(99,102,241,0.9)' : 'rgba(80,80,110,0.3)',
            fontSize: 18, cursor: canGoBack ? 'pointer' : 'default', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >‹</button>
        <span style={{ fontWeight: 700, fontSize: 17, color: 'rgba(40,40,55,0.88)' }}>
          {monthLabel}
        </span>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          style={{
            width: 36, height: 36, borderRadius: 10, border: 'none',
            background: canGoForward ? 'rgba(139,92,246,0.1)' : 'rgba(0,0,0,0.04)',
            color: canGoForward ? 'rgba(99,102,241,0.9)' : 'rgba(80,80,110,0.3)',
            fontSize: 18, cursor: canGoForward ? 'pointer' : 'default', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >›</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(80,80,110,0.5)', fontSize: 15 }}>
          불러오는 중...
        </div>
      ) : !data || data.total_amount === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 15 }}>
            {locale === 'ja' ? 'この月のデータがありません' : '이 달의 데이터가 없습니다'}
          </div>
        </div>
      ) : (
        <>
          {/* 총 지출 */}
          <div style={cardStyle}>
            <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 13, marginBottom: 6 }}>
              {locale === 'ja' ? '合計支出' : '총 지출'}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'rgba(40,40,55,0.88)', letterSpacing: '-1px' }}>
              {formatJPY(data.total_amount)}
            </div>
            {diffPct !== null && (
              <div style={{ marginTop: 6, fontSize: 13, color: diff > 0 ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)' }}>
                {diff > 0 ? '▲' : '▼'} {formatJPY(Math.abs(diff))} ({diff > 0 ? '+' : ''}{diffPct}%)&nbsp;
                <span style={{ color: 'rgba(80,80,110,0.5)' }}>
                  {locale === 'ja' ? '前月比' : '전월 대비'}
                </span>
              </div>
            )}
            <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(80,80,110,0.45)' }}>
              {locale === 'ja' ? `${data.receipt_count}件のレシート` : `영수증 ${data.receipt_count}건`}
            </div>
          </div>

          {/* 일별 차트 */}
          <div style={cardStyle}>
            <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 13, marginBottom: 14 }}>
              {locale === 'ja' ? '日別支出' : '일별 지출'}
            </div>
            <DailyBarChart data={data.daily_breakdown} year={year} month={month} />
          </div>

          {/* 카테고리별 */}
          <div style={cardStyle}>
            <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 13, marginBottom: 14 }}>
              {locale === 'ja' ? 'カテゴリ別分析' : '카테고리별 분석'}
            </div>
            <CategoryAnalysis items={data.category_breakdown} locale={locale} />
          </div>

          {/* 멤버별 */}
          {data.member_breakdown.length > 1 && (
            <div style={cardStyle}>
              <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 13, marginBottom: 14 }}>
                {locale === 'ja' ? 'メンバー別支出' : '멤버별 지출'}
              </div>
              <MemberBreakdown members={data.member_breakdown} total={data.total_amount} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
