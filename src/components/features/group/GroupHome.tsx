'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface Member {
  id: string;
  user_id: string;
  role: 'owner' | 'member';
  display_name: string;
  avatar_url: string | null;
}

interface Props {
  groupId: string;
  groupName: string;
  members: Member[];
  currentUserId: string;
  currentUserRole: 'owner' | 'member';
  locale: string;
}

export function GroupHome({ groupId, groupName, members, currentUserId, currentUserRole, locale }: Props) {
  const t = useTranslations('group');
  const router = useRouter();
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleGenerateInvite() {
    setLoadingInvite(true);
    const res = await fetch('/api/groups/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-locale': locale },
      body: JSON.stringify({ group_id: groupId }),
    });
    const json = await res.json();
    setLoadingInvite(false);
    if (res.ok) setInviteUrl(json.invite_url);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRemove(userId: string) {
    if (!confirm(t('removeConfirm'))) return;
    setRemovingId(userId);
    await fetch(`/api/groups/members/${userId}?group_id=${groupId}`, { method: 'DELETE' });
    setRemovingId(null);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-6 pt-12">
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          background: 'rgba(255,255,255,0.52)',
          backdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.08)',
        }}
      >
        <h1 className="mb-1 text-2xl font-bold text-[rgba(40,40,55,0.88)]">{groupName}</h1>
        <p className="mb-8 text-xs text-[rgba(80,80,110,0.58)]">{t('title')}</p>

        {/* 멤버 목록 */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-[rgba(40,40,55,0.88)]">{t('members')}</h2>
          <ul className="flex flex-col gap-2">
            {members.map(m => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}
              >
                <div className="flex items-center gap-3">
                  {m.avatar_url ? (
                    <img
                      src={m.avatar_url}
                      alt={m.display_name}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.7), rgba(99,102,241,0.7))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, color: 'white', fontWeight: 700,
                    }}>
                      {m.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-[rgba(40,40,55,0.88)]">{m.display_name}</span>
                    <span className="ml-2 text-xs text-[rgba(80,80,110,0.58)]">
                      {m.role === 'owner' ? t('owner') : t('member')}
                    </span>
                  </div>
                </div>
                {currentUserRole === 'owner' && m.user_id !== currentUserId && (
                  <button
                    onClick={() => handleRemove(m.user_id)}
                    disabled={removingId === m.user_id}
                    className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
                  >
                    {t('removeMember')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* 초대 링크 (오너만) */}
        {currentUserRole === 'owner' && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-[rgba(40,40,55,0.88)]">{t('inviteTitle')}</h2>
            <p className="mb-4 text-xs text-[rgba(80,80,110,0.58)]">{t('inviteDescription')}</p>
            {inviteUrl ? (
              <div className="flex flex-col gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.85)] bg-[rgba(255,255,255,0.6)] px-4 py-2 text-xs text-[rgba(40,40,55,0.88)]"
                />
                <button
                  onClick={handleCopy}
                  className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))' }}
                >
                  {copied ? t('copied') : t('copyLink')}
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateInvite}
                disabled={loadingInvite}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))' }}
              >
                {loadingInvite ? '...' : t('generateInvite')}
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
