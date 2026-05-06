'use client';

import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ProfileSettingsProps {
  locale: string;
}

const schema = z.object({
  display_name: z.string().min(1, { message: '표시 이름을 입력해주세요.' }),
});

const tp = 'rgba(40,40,55,0.88)';
const ts = 'rgba(80,80,110,0.58)';
const card = 'rgba(255,255,255,0.52)';
const cb = 'rgba(255,255,255,0.85)';
const blur = 'blur(40px) saturate(180%)';

function InitialAvatar({ name }: { name: string | null }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div style={{
      width: 88,
      height: 88,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 36,
      fontWeight: 800,
      color: '#fff',
      flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

export default function ProfileSettings({ locale }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isJa = locale === 'ja';

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setDisplayName(data.display_name ?? '');
      });
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(isJa ? 'ファイルサイズは5MB以下にしてください。' : '파일 크기는 5MB 이하여야 합니다.');
      return;
    }
    setError('');
    setPendingFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleDeleteAvatar() {
    if (!confirm(isJa ? 'プロフィール写真を削除しますか？' : '프로필 사진을 삭제할까요?')) return;
    const res = await fetch('/api/profile/avatar', { method: 'DELETE' });
    if (res.ok) {
      setProfile(p => p ? { ...p, avatar_url: null } : p);
      setPreview(null);
      setPendingFile(null);
      showToast(isJa ? '写真を削除しました。' : '사진을 삭제했습니다.');
    }
  }

  async function handleSave() {
    const result = schema.safeParse({ display_name: displayName });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setError('');
    setSaving(true);

    try {
      // 아바타 먼저 업로드
      if (pendingFile) {
        const fd = new FormData();
        fd.append('file', pendingFile);
        const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? '사진 업로드 실패');
          setSaving(false);
          return;
        }
        setProfile(p => p ? { ...p, avatar_url: data.avatar_url } : p);
        setPendingFile(null);
      }

      // 표시 이름 저장
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? '저장 실패');
        setSaving(false);
        return;
      }
      setProfile(p => p ? { ...p, display_name: displayName } : p);
      showToast(isJa ? '保存しました。' : '저장했습니다.');
    } finally {
      setSaving(false);
    }
  }

  const avatarSrc = preview ?? profile?.avatar_url ?? null;

  return (
    <div>
      <div style={{ padding: '52px 16px 8px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: tp, letterSpacing: -0.5 }}>
          {isJa ? 'プロフィール設定' : '프로필 설정'}
        </div>
      </div>

      <div style={{ margin: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 아바타 섹션 */}
        <div style={{
          background: card,
          backdropFilter: blur,
          WebkitBackdropFilter: blur,
          border: `1px solid ${cb}`,
          borderRadius: 22,
          padding: '24px 20px',
          boxShadow: '0 8px 32px rgba(139,92,246,0.08),0 2px 8px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,1)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: ts, marginBottom: 16 }}>
            {isJa ? 'プロフィール写真' : '프로필 사진'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="avatar"
                style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <InitialAvatar name={profile?.display_name ?? null} />
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: '8px 16px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {isJa ? '写真変更' : '사진 변경'}
              </button>
              {(avatarSrc || profile?.avatar_url) && (
                <button
                  onClick={handleDeleteAvatar}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 12,
                    background: 'rgba(239,68,68,0.10)',
                    color: 'rgba(239,68,68,0.85)',
                    fontWeight: 600,
                    fontSize: 13,
                    border: '1px solid rgba(239,68,68,0.20)',
                    cursor: 'pointer',
                  }}
                >
                  {isJa ? '削除' : '삭제'}
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* 표시 이름 & 이메일 섹션 */}
        <div style={{
          background: card,
          backdropFilter: blur,
          WebkitBackdropFilter: blur,
          border: `1px solid ${cb}`,
          borderRadius: 22,
          padding: '24px 20px',
          boxShadow: '0 8px 32px rgba(139,92,246,0.08),0 2px 8px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: ts, display: 'block', marginBottom: 8 }}>
              {isJa ? '表示名' : '표시 이름'}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={isJa ? '表示名を入力' : '표시 이름 입력'}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: `1px solid ${error && !displayName ? 'rgba(239,68,68,0.5)' : 'rgba(0,0,0,0.08)'}`,
                background: 'rgba(255,255,255,0.7)',
                fontSize: 15,
                color: tp,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: ts, display: 'block', marginBottom: 8 }}>
              {isJa ? 'メールアドレス（変更不可）' : '이메일 (수정 불가)'}
            </label>
            <input
              type="email"
              value={profile?.email ?? ''}
              disabled
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.06)',
                background: 'rgba(0,0,0,0.03)',
                fontSize: 15,
                color: ts,
                boxSizing: 'border-box',
                cursor: 'not-allowed',
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{ color: 'rgba(239,68,68,0.85)', fontSize: 13, padding: '0 4px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '16px',
            borderRadius: 16,
            background: saving
              ? 'rgba(139,92,246,0.4)'
              : 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85))',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
          }}
        >
          {saving ? (isJa ? '保存中...' : '저장 중...') : (isJa ? '保存' : '저장')}
        </button>
      </div>

      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(40,40,55,0.88)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: 20,
          fontSize: 14,
          fontWeight: 600,
          zIndex: 9999,
          whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
