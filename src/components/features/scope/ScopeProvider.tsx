'use client';

import { useState } from 'react';
import { ScopeContext, Scope, loadScope, saveScope } from '@/hooks/useScopeStore';

export default function ScopeProvider({ children }: { children: React.ReactNode }) {
  const [scope, setScopeState] = useState<Scope>(() => loadScope());

  function setScope(next: Scope) {
    setScopeState(next);
    saveScope(next);
  }

  return (
    <ScopeContext.Provider value={{ scope, setScope }}>
      {children}
    </ScopeContext.Provider>
  );
}
