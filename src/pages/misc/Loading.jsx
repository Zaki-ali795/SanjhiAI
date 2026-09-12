import { useNavigate } from 'react-router-dom';
import logo from '../../assets/screen.png';

export default function Loading() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FBFAEE] relative flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      {/* ── Ambient Background Layer (Lightweight & Hardware-Accelerated) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #006972 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="hidden sm:block absolute w-[400px] h-[400px] rounded-full bg-[#006972]/8 blur-3xl top-[-80px] left-[-80px]" />
        <div className="hidden sm:block absolute w-[360px] h-[360px] rounded-full bg-[#d4af37]/8 blur-3xl bottom-[-60px] right-[-60px]" />
      </div>

      {/* ── Central Card with Stable Sizing ── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center p-7 sm:p-9 rounded-3xl bg-white border border-[#006972]/15 shadow-[0_16px_40px_-12px_rgba(0,105,114,0.12)] w-[360px] max-w-[92vw] min-h-[440px] transform-gpu">
        {/* Logo Container with Smooth Pulse */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mb-5 shrink-0">
          <div className="absolute -inset-1.5 rounded-[1.75rem] border-2 border-[#006972]/20 animate-glow-pulse" />
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white p-2.5 shadow-md border border-[#006972]/15 flex items-center justify-center">
            <img src={logo} alt="Sanjhi Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Brand Text */}
        <div className="flex flex-col items-center gap-1.5 mb-6">
          <h1 className="font-headline text-[26px] font-extrabold text-[#006972] tracking-tight leading-tight">
            Sanjhi
          </h1>
          <p className="font-urdu text-[24px] text-deep-navy font-bold leading-normal">
            سانجھی
          </p>
          <span className="font-label text-[11px] uppercase tracking-[0.14em] font-bold text-[#006972]/80 mt-0.5">
            Community Savings · Trusted Pools
          </span>
        </div>

        {/* Progress Section with Ultra-Smooth Indeterminate Beam */}
        <div className="w-full flex flex-col items-center gap-3">
          <div className="w-full max-w-[220px] h-1.5 rounded-full bg-[#006972]/12 overflow-hidden relative">
            <div
              className="h-full w-full rounded-full bg-gradient-to-r from-[#006972] via-emerald-400 to-[#d4af37] animate-smooth-beam"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#006972]/7 border border-[#006972]/14 font-label text-[11px] font-semibold text-[#006972]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Loading experience...</span>
          </div>
        </div>

        {/* Fallback button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 text-[11px] font-label font-bold text-[#006972]/70 hover:text-[#006972] transition-colors cursor-pointer border-none bg-transparent"
        >
          Taking too long? Go to Dashboard →
        </button>
      </div>
    </div>
  );
}
