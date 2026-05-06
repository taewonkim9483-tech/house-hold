'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useScopeStore } from '@/hooks/useScopeStore';
import ScopeSelector from '@/components/features/scope/ScopeSelector';
import WeeklyBudgetCard from './WeeklyBudgetCard';
import CategoryBreakdown from './CategoryBreakdown';
import RecentReceiptList from './RecentReceiptList';
import QuickActionButtons from './QuickActionButtons';

interface CategoryItem {
  category_id: string;
  name_ko: string;
  name_ja: string;
  icon: string;
  amount: number;
  ratio: number;
}

interface RecentReceipt {
  id: string;
  store_name: string;
  purchased_at: string;
  total_amount: number;
  uploaded_by_name: string;
}

interface DashboardData {
  week: { budget: number; spent: number; remaining: number; start: string; end: string };
  category_breakdown: CategoryItem[];
  recent_receipts: RecentReceipt[];
}

interface DashboardClientProps {
  locale: string;
  displayName: string;
  initial: string;
  avatarUrl: string | null;
}

const defaultWeek = { budget: 0, spent: 0, remaining: 0, start: '', end: '' };

export default function DashboardClient({ locale, displayName, initial, avatarUrl }: DashboardClientProps) {
  const { scope } = useScopeStore();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const greeting = locale === 'ja' ? 'こんにちは 👋' : '안녕하세요 👋';

  useEffect(() => {
    const params = new URLSearchParams();
    if (scope.type === 'personal') params.set('scope', 'personal');
    fetch(`/api/dashboard?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setDashboard);
  }, [scope]);

  return (
    <>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'52px 20px 14px' }}>
        <div>
          <div style={{ color:'rgba(80,80,110,0.58)', fontSize:13 }}>{greeting}</div>
          <div style={{ color:'rgba(40,40,55,0.88)', fontSize:22, fontWeight:700, marginTop:2, letterSpacing:'-0.5px' }}>우리집 가계부</div>
        </div>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={42}
            height={42}
            style={{
              borderRadius:'50%', objectFit:'cover',
              border:'2px solid rgba(255,255,255,0.9)',
              boxShadow:'0 4px 14px rgba(139,92,246,0.25)',
            }}
          />
        ) : (
          <div
            style={{
              width:42, height:42, borderRadius:'50%',
              background:'linear-gradient(135deg,rgba(139,92,246,0.7),rgba(99,102,241,0.7))',
              border:'2px solid rgba(255,255,255,0.9)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:16, color:'white', fontWeight:700,
              boxShadow:'0 4px 14px rgba(139,92,246,0.25)',
            }}
          >
            {initial}
          </div>
        )}
      </div>

      {/* 범위 선택 */}
      <ScopeSelector />

      <WeeklyBudgetCard week={dashboard?.week ?? defaultWeek} locale={locale} />
      <QuickActionButtons locale={locale} />
      <CategoryBreakdown items={dashboard?.category_breakdown ?? []} locale={locale} />
      <RecentReceiptList receipts={dashboard?.recent_receipts ?? []} locale={locale} />
    </>
  );
}
