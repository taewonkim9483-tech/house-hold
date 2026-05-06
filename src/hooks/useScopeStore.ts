'use client';

import { createContext, useContext } from 'react';

export type Scope =
  | { type: 'personal' }
  | { type: 'group'; groupId: string; groupName: string };

export interface ScopeStore {
  scope: Scope;
  setScope: (scope: Scope) => void;
}

const STORAGE_KEY = 'household_scope';

export function loadScope(): Scope {
  if (typeof window === 'undefined') return { type: 'personal' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { type: 'personal' };
    const parsed = JSON.parse(raw) as Scope;
    return parsed;
  } catch {
    return { type: 'personal' };
  }
}

export function saveScope(scope: Scope) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scope));
}

export const ScopeContext = createContext<ScopeStore>({
  scope: { type: 'personal' },
  setScope: () => {},
});

export function useScopeStore(): ScopeStore {
  return useContext(ScopeContext);
}
