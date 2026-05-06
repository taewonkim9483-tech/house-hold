'use client';

import { useEffect, useState } from 'react';
import { useScopeStore, Scope } from '@/hooks/useScopeStore';

interface Group {
  id: string;
  name: string;
}

export default function ScopeSelector() {
  const { scope, setScope } = useScopeStore();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    fetch('/api/scope/groups')
      .then((r) => r.ok ? r.json() : { groups: [] })
      .then((data) => setGroups(data.groups ?? []));
  }, []);

  if (groups.length === 0) return null;

  const items: Array<{ label: string; scope: Scope }> = [
    { label: '👤 개인', scope: { type: 'personal' } },
    ...groups.map((g) => ({
      label: `👨‍👩‍👧 ${g.name}`,
      scope: { type: 'group' as const, groupId: g.id, groupName: g.name },
    })),
  ];

  function isActive(item: { scope: Scope }): boolean {
    if (item.scope.type === 'personal') return scope.type === 'personal';
    return scope.type === 'group' && scope.groupId === item.scope.groupId;
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        padding: '0 16px 12px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {items.map((item, idx) => {
        const active = isActive(item);
        return (
          <button
            key={idx}
            onClick={() => setScope(item.scope)}
            style={{
              flexShrink: 0,
              padding: '7px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              fontFamily: 'inherit',
              background: active
                ? 'linear-gradient(135deg,rgba(139,92,246,0.85),rgba(99,102,241,0.85))'
                : 'rgba(255,255,255,0.6)',
              color: active ? '#fff' : 'rgba(80,80,110,0.7)',
              boxShadow: active
                ? '0 4px 14px rgba(139,92,246,0.25),inset 0 1px 0 rgba(255,255,255,0.2)'
                : '0 1px 4px rgba(0,0,0,0.07)',
              transition: 'all .2s cubic-bezier(.34,1.2,.64,1)',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
