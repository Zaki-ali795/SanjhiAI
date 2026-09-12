import logo from '../assets/screen.png';
import Icon from './Icon';

const TICKER_ITEMS = [
  { icon: 'verified_user', text: 'Sanjhi — Verified Peer-to-Peer Savings Platform', color: 'text-[#006972]' },
  { icon: 'shield', text: '100% Encrypted & Bank-Grade Security', color: 'text-emerald-600' },
  { icon: 'groups', text: 'Join Trusted Committee Savings Pools', color: 'text-[#006972]' },
  { icon: 'auto_awesome', text: 'AI-Powered Smart Recommendations', color: 'text-amber-700' },
];

export default function AuthAmbientBackground({ showTicker = false, children }) {
  return (
    <div className="min-h-screen bg-[#fbfaee] text-deep-navy font-body antialiased relative overflow-x-hidden flex flex-col justify-between">
      {/* ── GPU-Accelerated Fixed Ambient Background Layer ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        style={{ contain: 'strict', transform: 'translateZ(0)' }}
      >
        {/* Crisp lightweight dot grid */}
        <div
          className="absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #006972 1.2px, transparent 1.2px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Soft atmospheric gradient accents (no heavy CSS blurs) */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full top-[-150px] left-[-150px] pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(0,105,114,0.18) 0%, rgba(0,105,114,0.04) 50%, transparent 70%)',
          }}
        />
        <div
          className="absolute w-[450px] h-[450px] rounded-full bottom-[-100px] right-[-100px] pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.03) 50%, transparent 70%)',
          }}
        />

        {/* Static Watermark */}
        <img
          src={logo}
          alt=""
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[480px] md:w-[650px] opacity-[0.035] select-none pointer-events-none"
        />
      </div>

      {/* Optional Top Live Ticker */}
      {showTicker && (
        <div className="relative z-30 bg-[#006972]/8 border-b border-[#006972]/15 overflow-hidden h-9 flex items-center shrink-0">
          <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-[#fbfaee] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-[#fbfaee] to-transparent z-10 pointer-events-none" />
          <div className="flex whitespace-nowrap animate-ticker gap-0">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-6 font-label text-[12px] font-semibold">
                <Icon name={item.icon} size={14} className={item.color} />
                <span className="text-deep-navy/70">{item.text}</span>
                <span className="mx-3 text-[#006972]/30">•</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start w-full">
        {children}
      </div>
    </div>
  );
}
