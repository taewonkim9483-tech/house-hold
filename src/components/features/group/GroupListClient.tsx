'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface Group {
  id: string;
  name: string;
  role: 'owner' | 'member';
}

interface Props {
  groups: Group[];
  locale: string;
}

type AddMode = 'none' | 'create' | 'join';

export function GroupListClient({ groups, locale }: Props) {
  const t = useTranslations('group');
  const router = useRouter();
  const [addMode, setAddMode] = useState<AddMode>('none');
  const [groupName, setGroupName] = useState('');
  const [joinToken, setJoinToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function resetForm() {
    setAddMode('none');
    setError('');
    setGroupName('');
    setJoinToken('');
  }

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
    resetForm();
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
    resetForm();
    router.refresh();
  }

  return (
    <div style={{ padding: '52px 20px 0' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 13 }}>Group</div>
        <div style={{ color: 'rgba(40,40,55,0.88)', fontSize: 22, fontWeight: 700, marginTop: 2, letterSpacing: '-0.5px' }}>
          {t('myGroups')}
        </div>
      </div>

      {/* 그룹 목록 */}
      {groups.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.52)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.85)',
            borderRadius: 20,
            marginBottom: 16,
            boxShadow: '0 4px 16px rgba(99,102,241,0.06)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <p style={{ color: 'rgba(40,40,55,0.88)', fontWeight: 600, marginBottom: 6 }}>{t('noGroup')}</p>
          <p style={{ color: 'rgba(80,80,110,0.58)', fontSize: 13 }}>{t('noGroupDesc')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {groups.map(g => (
            <Link
              key={g.id}
              href={`/${locale}/group/${g.id}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.52)',
                backdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.85)',
                borderRadius: 20,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(99,102,241,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.7), rgba(99,102,241,0.7))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  🏠
                </div>
                <div>
                  <div style={{ color: 'rgba(40,40,55,0.88)', fontWeight: 600, fontSize: 15 }}>{g.name}</div>
                  <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 12, marginTop: 2 }}>
                    {g.role === 'owner' ? `👑 ${t('owner')}` : t('member')}
                  </div>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                style={{ width: 16, height: 16, color: 'rgba(139,92,246,0.5)', flexShrink: 0 }}>
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {/* 그룹 추가 버튼 / 폼 */}
      {addMode === 'none' ? (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setAddMode('create')}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 16, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))',
              color: 'white', fontWeight: 600, fontSize: 14,
            }}
          >
            {t('createGroup')}
          </button>
          <button
            onClick={() => setAddMode('join')}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 16, cursor: 'pointer',
              background: 'rgba(255,255,255,0.52)',
              backdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(139,92,246,0.3)',
              color: 'rgba(99,102,241,0.85)', fontWeight: 600, fontSize: 14,
            }}
          >
            {t('joinGroup')}
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: 20,
            background: 'rgba(255,255,255,0.52)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.85)',
            borderRadius: 20,
            boxShadow: '0 4px 16px rgba(99,102,241,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontWeight: 600, color: 'rgba(40,40,55,0.88)', fontSize: 15 }}>
              {addMode === 'create' ? t('createGroup') : t('joinTitle')}
            </span>
            <button
              onClick={resetForm}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(80,80,110,0.58)', fontSize: 22, lineHeight: 1, padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>

          {addMode === 'create' ? (
            <>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(80,80,110,0.58)', marginBottom: 6 }}>
                {t('groupName')}
              </label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder={t('groupNamePlaceholder')}
                autoFocus
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12, marginBottom: 12,
                  border: '1px solid rgba(139,92,246,0.3)',
                  background: 'rgba(255,255,255,0.6)', fontSize: 14, outline: 'none',
                  color: 'rgba(40,40,55,0.88)', boxSizing: 'border-box',
                }}
              />
            </>
          ) : (
            <>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(80,80,110,0.58)', marginBottom: 6 }}>
                Token
              </label>
              <input
                type="text"
                value={joinToken}
                onChange={e => setJoinToken(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                autoFocus
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12, marginBottom: 12,
                  border: '1px solid rgba(139,92,246,0.3)',
                  background: 'rgba(255,255,255,0.6)', fontSize: 13, outline: 'none',
                  color: 'rgba(40,40,55,0.88)', boxSizing: 'border-box',
                }}
              />
            </>
          )}

          {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>{error}</p>}

          <button
            onClick={addMode === 'create' ? handleCreate : handleJoin}
            disabled={loading || (addMode === 'create' ? !groupName.trim() : !joinToken.trim())}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))',
              color: 'white', fontWeight: 600, fontSize: 14,
              opacity: (loading || (addMode === 'create' ? !groupName.trim() : !joinToken.trim())) ? 0.5 : 1,
            }}
          >
            {loading ? '...' : (addMode === 'create' ? t('createButton') : t('joinButton'))}
          </button>
        </div>
      )}
    </div>
  );
}
