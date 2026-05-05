'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

type Mode = 'select' | 'create' | 'join';

export function GroupSetup({ locale }: { locale: string }) {
  const t = useTranslations('group');
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('select');
  const [groupName, setGroupName] = useState('');
  const [joinToken, setJoinToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!groupName.trim()) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName.trim() }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error); return; }
    router.refresh();
  }

  async function handleJoin() {
    if (!joinToken.trim()) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: joinToken.trim() }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (res.status === 410) setError(t('inviteExpired'));
      else if (res.status === 409) setError(t('groupFull'));
      else setError(json.error ?? t('inviteInvalid'));
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: 'rgba(255,255,255,0.52)',
          backdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.08)',
        }}
      >
        {mode === 'select' && (
          <>
            <h1 className="mb-2 text-2xl font-bold text-[rgba(40,40,55,0.88)]">{t('noGroup')}</h1>
            <p className="mb-8 text-sm text-[rgba(80,80,110,0.58)]">{t('noGroupDesc')}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setMode('create')}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))' }}
              >
                {t('createGroup')}
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full rounded-xl border border-[rgba(139,92,246,0.3)] py-3 text-sm font-semibold text-[rgba(99,102,241,0.85)]"
              >
                {t('joinGroup')}
              </button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <>
            <button onClick={() => setMode('select')} className="mb-4 text-sm text-[rgba(80,80,110,0.58)]">← {locale === 'ja' ? '戻る' : '뒤로'}</button>
            <h1 className="mb-6 text-xl font-bold text-[rgba(40,40,55,0.88)]">{t('createGroup')}</h1>
            <label className="mb-1 block text-xs font-medium text-[rgba(80,80,110,0.58)]">{t('groupName')}</label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder={t('groupNamePlaceholder')}
              className="mb-4 w-full rounded-xl border border-[rgba(255,255,255,0.85)] bg-[rgba(255,255,255,0.6)] px-4 py-3 text-sm text-[rgba(40,40,55,0.88)] outline-none focus:border-[rgba(139,92,246,0.5)]"
            />
            {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={loading || !groupName.trim()}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))' }}
            >
              {loading ? '...' : t('createButton')}
            </button>
          </>
        )}

        {mode === 'join' && (
          <>
            <button onClick={() => setMode('select')} className="mb-4 text-sm text-[rgba(80,80,110,0.58)]">← {locale === 'ja' ? '戻る' : '뒤로'}</button>
            <h1 className="mb-6 text-xl font-bold text-[rgba(40,40,55,0.88)]">{t('joinTitle')}</h1>
            <label className="mb-1 block text-xs font-medium text-[rgba(80,80,110,0.58)]">Token</label>
            <input
              type="text"
              value={joinToken}
              onChange={e => setJoinToken(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="mb-4 w-full rounded-xl border border-[rgba(255,255,255,0.85)] bg-[rgba(255,255,255,0.6)] px-4 py-3 text-xs text-[rgba(40,40,55,0.88)] outline-none focus:border-[rgba(139,92,246,0.5)]"
            />
            {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={loading || !joinToken.trim()}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))' }}
            >
              {loading ? '...' : t('joinButton')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
