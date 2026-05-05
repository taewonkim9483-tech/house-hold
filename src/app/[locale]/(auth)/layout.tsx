export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#f0eef8]">
      {/* 배경 그라디언트 블롭 */}
      <div
        className="fixed inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 15% 20%, rgba(196,181,253,0.55) 0%, transparent 65%),
            radial-gradient(ellipse 60% 70% at 85% 15%, rgba(251,207,232,0.5) 0%, transparent 60%),
            radial-gradient(ellipse 55% 55% at 75% 80%, rgba(167,243,208,0.4) 0%, transparent 60%),
            radial-gradient(ellipse 65% 50% at 20% 85%, rgba(186,230,253,0.45) 0%, transparent 65%),
            linear-gradient(145deg, #f5f3ff 0%, #fdf2f8 35%, #f0fdf4 65%, #f0f9ff 100%)
          `,
        }}
      />
      {/* 블롭 장식 */}
      <div className="fixed w-[300px] h-[300px] -top-20 -left-16 rounded-full blur-[60px] bg-[rgba(167,139,250,0.3)] pointer-events-none" />
      <div className="fixed w-[250px] h-[250px] top-[10%] -right-10 rounded-full blur-[60px] bg-[rgba(249,168,212,0.3)] pointer-events-none" />
      <div className="fixed w-[200px] h-[200px] bottom-[5%] left-[5%] rounded-full blur-[60px] bg-[rgba(134,239,172,0.25)] pointer-events-none" />
      <div className="fixed w-[180px] h-[180px] bottom-[10%] right-[5%] rounded-full blur-[60px] bg-[rgba(125,211,252,0.28)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px] px-5">
        {children}
      </div>
    </div>
  );
}
