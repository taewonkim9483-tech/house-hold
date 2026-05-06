'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
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

function Avatar({ member }: { member: Member }) {
  if (member.avatar_url) {
    return (
      <Image
        src={member.avatar_url}
        alt={member.display_name}
        width={36}
        height={36}
        style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, rgba(139,92,246,0.7), rgba(99,102,241,0.7))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, color: 'white', fontWeight: 700,
    }}>
      {member.display_name.charAt(0).toUpperCase()}
    </div>
  );
}

interface MemberMenuProps {
  member: Member;
  groupId: string;
  onClose: () => void;
  onRefresh: () => void;
}

function MemberMenu({ member, groupId, onClose, onRefresh }: MemberMenuProps) {
  const t = useTranslations('group');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'member'>(member.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  async function handleSaveRole() {
    if (selectedRole === member.role) { onClose(); return; }
    setLoading(true);
    setError('');
    const res = await fetch(`/api/groups/${groupId}/members/${member.user_id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: selectedRole }),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json();
      if (json.error === 'Cannot demote the last owner') {
        setError(t('singleOwnerError'));
      } else {
        setError(json.error ?? t('roleChanged'));
      }
      return;
    }
    onClose();
    onRefresh();
  }

  async function handleKick() {
    if (!confirm(t('kickConfirm'))) return;
    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/members/${member.user_id}`, { method: 'DELETE' });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? '');
      return;
    }
    onClose();
    onRefresh();
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 z-50 w-64 rounded-2xl p-4 shadow-xl"
      style={{
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.85)',
        boxShadow: '0 8px 32px rgba(99,102,241,0.18)',
      }}
    >
      <p className="mb-3 text-xs font-semibold text-[rgba(80,80,110,0.58)]">{member.display_name}</p>

      {/* 권한 선택 */}
      <div className="mb-3 flex flex-col gap-2">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="role"
            value="owner"
            checked={selectedRole === 'owner'}
            onChange={() => setSelectedRole('owner')}
            className="accent-indigo-500"
          />
          <span className="text-sm text-[rgba(40,40,55,0.88)]">{t('promoteToOwner')}</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="role"
            value="member"
            checked={selectedRole === 'member'}
            onChange={() => setSelectedRole('member')}
            className="accent-indigo-500"
          />
          <span className="text-sm text-[rgba(40,40,55,0.88)]">{t('keepMember')}</span>
        </label>
      </div>

      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleKick}
          disabled={loading}
          className="flex-1 rounded-xl py-2 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-40"
          style={{ border: '1px solid rgba(239,68,68,0.3)' }}
        >
          {t('kickMember')}
        </button>
        <button
          onClick={handleSaveRole}
          disabled={loading}
          className="flex-1 rounded-xl py-2 text-xs font-semibold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))' }}
        >
          {loading ? '...' : t('manage')}
        </button>
      </div>
    </div>
  );
}

export function GroupHome({ groupId, groupName, members, currentUserId, currentUserRole, locale }: Props) {
  const t = useTranslations('group');
  const router = useRouter();

  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(false);

  // 그룹 이름 인라인 편집
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(groupName);
  const [savingName, setSavingName] = useState(false);

  // 멤버 메뉴
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);

  // 그룹 탈퇴
  const [leaving, setLeaving] = useState(false);

  function handleRefresh() {
    router.refresh();
  }

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

  async function handleSaveName() {
    if (!nameInput.trim() || nameInput.trim() === groupName) { setEditingName(false); return; }
    setSavingName(true);
    const res = await fetch(`/api/groups/${groupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput.trim() }),
    });
    setSavingName(false);
    if (res.ok) {
      setEditingName(false);
      router.refresh();
    }
  }

  async function handleLeave() {
    if (!confirm(t('leaveConfirm'))) return;
    setLeaving(true);
    const res = await fetch(`/api/groups/${groupId}/leave`, { method: 'DELETE' });
    setLeaving(false);
    if (!res.ok) {
      const json = await res.json();
      if (json.error === 'Must assign another owner before leaving') {
        alert(t('leaveOwnerError'));
      }
      return;
    }
    router.refresh();
  }

  return (
    <div
      className="w-full rounded-2xl p-8"
      style={{
        background: 'rgba(255,255,255,0.52)',
        backdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.85)',
        boxShadow: '0 8px 32px rgba(99,102,241,0.08)',
      }}
    >
      {/* 그룹 이름 (G-6 인라인 편집) */}
      <div className="mb-1 flex items-center gap-2">
        {editingName ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
              className="flex-1 rounded-xl border border-[rgba(139,92,246,0.4)] bg-[rgba(255,255,255,0.8)] px-3 py-1.5 text-lg font-bold text-[rgba(40,40,55,0.88)] outline-none"
            />
            <button
              onClick={() => setEditingName(false)}
              className="text-xs text-[rgba(80,80,110,0.58)] hover:text-[rgba(40,40,55,0.88)]"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSaveName}
              disabled={savingName}
              className="rounded-lg px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))' }}
            >
              {savingName ? '...' : t('save')}
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[rgba(40,40,55,0.88)]">{groupName}</h1>
            {currentUserRole === 'owner' && (
              <button
                onClick={() => { setNameInput(groupName); setEditingName(true); }}
                className="text-[rgba(139,92,246,0.7)] hover:text-[rgba(99,102,241,0.9)]"
                title={t('editName')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
                  <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
      <p className="mb-8 text-xs text-[rgba(80,80,110,0.58)]">{t('title')}</p>

      {/* 멤버 목록 (G-4) */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-[rgba(40,40,55,0.88)]">
          {t('members')} ({members.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {members.map(m => (
            <li
              key={m.user_id}
              className="relative flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}
            >
              <div className="flex items-center gap-3">
                <Avatar member={m} />
                <div>
                  <span className="text-sm font-medium text-[rgba(40,40,55,0.88)]">{m.display_name}</span>
                  {m.role === 'owner' ? (
                    <span className="ml-2 text-xs text-[rgba(139,92,246,0.8)]">👑 {t('owner')}</span>
                  ) : (
                    <span className="ml-2 text-xs text-[rgba(80,80,110,0.58)]">{t('member')}</span>
                  )}
                </div>
              </div>

              {/* owner만, 본인 제외 ⋮ 메뉴 */}
              {currentUserRole === 'owner' && m.user_id !== currentUserId && (
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuUserId(prev => prev === m.user_id ? null : m.user_id)}
                    className="rounded-full p-1 text-[rgba(80,80,110,0.58)] hover:bg-[rgba(139,92,246,0.1)] hover:text-[rgba(40,40,55,0.88)]"
                    title={t('memberMenu')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}>
                      <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
                    </svg>
                  </button>
                  {openMenuUserId === m.user_id && (
                    <MemberMenu
                      member={m}
                      groupId={groupId}
                      onClose={() => setOpenMenuUserId(null)}
                      onRefresh={handleRefresh}
                    />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* 초대 링크 (오너만) */}
      {currentUserRole === 'owner' && (
        <section className="mb-8">
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

      {/* 그룹 탈퇴 */}
      <div className="border-t border-[rgba(139,92,246,0.1)] pt-6">
        <button
          onClick={handleLeave}
          disabled={leaving}
          className="w-full rounded-xl border border-[rgba(239,68,68,0.3)] py-2.5 text-sm font-semibold text-red-400 hover:bg-red-50 disabled:opacity-40"
        >
          {leaving ? '...' : t('leaveGroup')}
        </button>
      </div>
    </div>
  );
}
