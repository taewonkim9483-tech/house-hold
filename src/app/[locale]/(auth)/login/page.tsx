import { GoogleLoginButton } from '@/components/features/auth/GoogleLoginButton';

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { next, error } = await searchParams;

  return (
    <>
      {/* 로고 */}
      <div className="text-center pb-8">
        <div
          className="w-[76px] h-[76px] rounded-[24px] mx-auto mb-4 flex items-center justify-center text-[36px]"
          style={{
            background: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(139,92,246,0.15), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
          }}
        >
          🏠
        </div>
        <div className="text-[23px] font-bold tracking-tight text-[rgba(40,40,55,0.88)]">
          {locale === 'ja' ? 'うちの家計簿' : '우리집 가계부'}
        </div>
        <div className="text-[12px] mt-1 text-[rgba(80,80,110,0.58)] tracking-wide">
          スマート家計簿 · Smart Household Budget
        </div>
      </div>

      {/* 카드 */}
      <div
        className="rounded-[22px] p-7"
        style={{
          background: 'rgba(255,255,255,0.52)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: '0 20px 60px rgba(139,92,246,0.1), 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
        }}
      >
        <h2 className="text-[17px] font-semibold text-center mb-2 text-[rgba(40,40,55,0.88)]">
          {locale === 'ja' ? 'ログイン' : '로그인'}
        </h2>
        <p className="text-[13px] text-center text-[rgba(80,80,110,0.58)] mb-6">
          {locale === 'ja'
            ? 'Googleアカウントでログインしてください'
            : 'Google 계정으로 로그인하세요'}
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-[10px] bg-red-50 border border-red-200 text-red-600 text-[13px] text-center">
            {locale === 'ja' ? '認証に失敗しました。再度お試しください。' : '인증에 실패했습니다. 다시 시도해주세요.'}
          </div>
        )}

        <GoogleLoginButton
          locale={locale}
          next={next}
          label={locale === 'ja' ? 'Googleでログイン' : 'Google로 로그인'}
        />
      </div>

      {/* 초대 안내 (next 파라미터에 invite가 포함된 경우) */}
      {next?.includes('/invite') && (
        <div
          className="mt-4 px-[18px] py-[14px] flex items-center gap-3 rounded-[16px]"
          style={{
            background: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div
            className="w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center text-[18px]"
            style={{
              background: 'linear-gradient(135deg, rgba(134,239,172,0.7), rgba(52,211,153,0.7))',
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '0 2px 8px rgba(52,211,153,0.2)',
            }}
          >
            💌
          </div>
          <div className="text-[13px] text-[rgba(80,80,110,0.58)] leading-[1.45]">
            {locale === 'ja' ? (
              <><strong className="text-[rgba(16,185,129,0.9)] font-semibold">家族の招待</strong>が届いています！<br />ログイン後、自動で家計簿が連携されます</>
            ) : (
              <><strong className="text-[rgba(16,185,129,0.9)] font-semibold">가족 초대</strong>를 받으셨어요!<br />로그인 후 자동으로 가계부가 연결됩니다</>
            )}
          </div>
        </div>
      )}
    </>
  );
}
