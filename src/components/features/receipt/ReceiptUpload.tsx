'use client';

import { useState, useRef } from 'react';
import { AnalyzedReceipt } from '@/types/domain';
import ReceiptResult from './ReceiptResult';

interface Props {
  locale: string;
}

export default function ReceiptUpload({ locale }: Props) {
  const [stage, setStage] = useState<'upload' | 'analyzing' | 'result'>('upload');
  const [analyzed, setAnalyzed] = useState<AnalyzedReceipt | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setStage('analyzing');

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    setImageBase64(base64);
    setImageMimeType(file.type);

    const fd = new FormData();
    fd.append('image', file);

    try {
      const res = await fetch('/api/receipts/analyze', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? '분석 실패');
      }
      const data: AnalyzedReceipt = await res.json();
      setAnalyzed(data);
      setStage('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : '분석 중 오류가 발생했습니다');
      setStage('upload');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (stage === 'analyzing') {
    return (
      <div
        style={{ margin: '0 16px', padding: '44px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: 22, boxShadow: '0 8px 32px rgba(139,92,246,0.08)' }}
      >
        <div style={{ position: 'relative', width: 110, height: 150, borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.85)', boxShadow: '0 8px 32px rgba(139,92,246,0.08)' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.7),transparent)', boxShadow: '0 0 10px rgba(99,102,241,0.4)', animation: 'scan 1.5s ease-in-out infinite' }} />
          <style>{`@keyframes scan { 0%{top:0;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:100%;opacity:0} }`}</style>
        </div>
        <div style={{ color: 'rgba(40,40,55,0.88)', fontSize: 16, fontWeight: 600 }}>AI가 분석 중이에요...</div>
        <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 13 }}>잠시만 기다려주세요</div>
      </div>
    );
  }

  if (stage === 'result' && analyzed) {
    return (
      <ReceiptResult
        analyzed={analyzed}
        imageBase64={imageBase64}
        imageMimeType={imageMimeType}
        locale={locale}
      />
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        style={{ margin: '0 16px 14px', padding: '44px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, cursor: 'pointer', border: '1.5px dashed rgba(139,92,246,0.25)', borderRadius: 28, background: 'rgba(255,255,255,0.38)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', transition: 'all .2s' }}
      >
        <div style={{ width: 76, height: 76, borderRadius: 22, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, boxShadow: '0 8px 24px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.8)' }}>📷</div>
        <div style={{ color: 'rgba(40,40,55,0.88)', fontSize: 18, fontWeight: 700 }}>영수증을 촬영하세요</div>
        <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 13, textAlign: 'center', lineHeight: 1.55 }}>AI가 자동으로 상품 정보를<br />추출하고 분류해드려요</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 16px 14px' }}>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{ padding: 16, textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: 22, boxShadow: '0 8px 32px rgba(139,92,246,0.08)', transition: 'transform .2s' }}
        >
          <div style={{ fontSize: 28 }}>📷</div>
          <div style={{ color: 'rgba(40,40,55,0.88)', fontSize: 13, fontWeight: 500 }}>카메라 촬영</div>
        </div>
        <div
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.removeAttribute('capture');
              fileInputRef.current.click();
              fileInputRef.current.setAttribute('capture', 'environment');
            }
          }}
          style={{ padding: 16, textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: 22, boxShadow: '0 8px 32px rgba(139,92,246,0.08)', transition: 'transform .2s' }}
        >
          <div style={{ fontSize: 28 }}>🖼️</div>
          <div style={{ color: 'rgba(40,40,55,0.88)', fontSize: 13, fontWeight: 500 }}>갤러리 선택</div>
        </div>
      </div>

      <div
        style={{ margin: '0 16px 14px', background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: 22, boxShadow: '0 8px 32px rgba(139,92,246,0.08)' }}
      >
        <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px', padding: '14px 16px 0' }}>촬영 팁</div>
        {[
          { emoji: '💡', text: '영수증 전체가 화면에 들어오도록 촬영해주세요' },
          { emoji: '☀️', text: '밝은 곳에서 촬영하면 인식률이 높아져요' },
          { emoji: '📐', text: '구겨지지 않게 펴서 촬영해주세요' },
        ].map((tip) => (
          <div key={tip.emoji} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 16px', borderTop: '0.5px solid rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{tip.emoji}</div>
            <div style={{ color: 'rgba(80,80,110,0.58)', fontSize: 13, lineHeight: 1.5 }}>{tip.text}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ margin: '0 16px 14px', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 13, color: 'rgba(220,38,38,0.9)', fontSize: 13 }}>
          {error}
        </div>
      )}
    </>
  );
}
