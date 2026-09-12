import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import logo from '../../assets/screen.png';

export default function CommitteeProgress() {
  const navigate = useNavigate();

  const [paidCount] = useState(7);
  const [capacity] = useState(10);
  const [dueAmount] = useState(5000);
  const [totalCollected] = useState(35000);
  const [totalPool] = useState(50000);

  const pct = Math.round((paidCount / capacity) * 100);

  return (
    <div className="min-h-screen bg-white text-deep-navy font-body antialiased relative overflow-x-hidden pb-28 md:pb-12">

      {/* ── AMBIENT BACKGROUND LAYER ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.3]"
          style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #006972 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[#006972]/5 blur-3xl top-[-100px] left-[-100px] animate-float-y-slow" />
        <div className="absolute w-[360px] h-[360px] rounded-full bg-amber-400/5 blur-3xl bottom-[15%] right-[-60px]"
          style={{ animation: 'float-y 8s ease-in-out infinite 2s' }} />
        <img src={logo} alt="" aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] opacity-[0.035] select-none pointer-events-none"
          style={{ filter: 'brightness(0) saturate(100%) invert(26%) sepia(85%) saturate(1450%) hue-rotate(152deg)' }} />
      </div>

      {/* ── HEADER BAR ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#006972]/12 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/committee/1')}
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 border border-[#006972]/12 text-[#006972] transition-colors cursor-pointer active:scale-95"
            >
              <Icon name="arrow_back" size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-label font-medium text-on-surface-variant truncate">Cycle #2 Progress</p>
              <h1 className="font-headline text-[18px] sm:text-[22px] font-bold text-[#006972] leading-tight truncate">
                Diwali Savings Fund
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate(`/committee/${id || '1'}/settings`)}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-deep-navy transition-all active:scale-95 cursor-pointer"
              title="Settings"
            >
              <Icon name="settings" size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6 relative z-10">

        {/* PROGRESS CIRCULAR GAUGE CARD */}
        <section className="bg-white rounded-3xl border-2 border-[#006972]/15 p-6 sm:p-8 shadow-xl shadow-[#006972]/10 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
          
          <div>
            <span className="px-3 py-1 rounded-full bg-[#006972]/10 text-[#006972] font-label text-[11px] font-bold uppercase tracking-wider">
              Cycle 2 of 10 Active
            </span>
            <h2 className="font-headline text-[24px] font-bold text-deep-navy mt-2">Cycle Collection Progress</h2>
          </div>

          {/* SVG Ring Progress */}
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle className="text-slate-100" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeWidth="8" />
              <circle
                className="text-[#006972] transition-all duration-1000 ease-out"
                cx="50"
                cy="50"
                fill="none"
                r="42"
                stroke="currentColor"
                strokeDasharray="263.89"
                strokeDashoffset={263.89 * (1 - pct / 100)}
                strokeLinecap="round"
                strokeWidth="8"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline text-[44px] font-extrabold text-[#006972] tracking-tight leading-none tabular-nums">
                {paidCount} <span className="text-[20px] font-normal text-on-surface-variant">/ {capacity}</span>
              </span>
              <span className="font-label text-[11px] uppercase font-bold text-on-surface-variant tracking-wider mt-1">
                Members Paid ({pct}%)
              </span>
            </div>
          </div>

          {/* Collected Details */}
          <div className="w-full grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#fbfaee] border border-deep-navy/5 text-left">
              <p className="font-label text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">Collected Dues</p>
              <p className="font-headline text-[16px] font-bold text-emerald-700">Rs. {totalCollected.toLocaleString()}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#fbfaee] border border-deep-navy/5 text-left">
              <p className="font-label text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">Total Target Pool</p>
              <p className="font-headline text-[16px] font-bold text-deep-navy">Rs. {totalPool.toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* PAY NOW DIRECT BANNER */}
        <section className="bg-gradient-to-r from-[#006972] to-[#00575f] rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-label text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Your Pending Contribution</span>
            <h3 className="font-headline text-[28px] font-extrabold tracking-tight mt-0.5">Rs. {dueAmount.toLocaleString()}</h3>
            <p className="font-body text-[12px] text-white/75 flex items-center gap-1 mt-1">
              <Icon name="event" size={14} /> Due Date: 15th of the month
            </p>
          </div>

          <button
            onClick={() => navigate('/payments')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white text-[#006972] hover:bg-emerald-50 font-label text-[14px] font-bold transition-all shadow-md active:scale-95 cursor-pointer border-none flex items-center justify-center gap-2 shrink-0"
          >
            Pay Dues Now
            <Icon name="arrow_forward" size={18} />
          </button>
        </section>

      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#006972]/15 px-1 py-2 flex justify-around items-center safe-area-inset-bottom shadow-[0_-4px_20px_rgba(0,105,114,0.10)]">
        {[
          { label: 'Home', icon: 'dashboard', path: '/dashboard' },
          { label: 'Pools', icon: 'groups', path: '/pools' },
          { label: 'Payments', icon: 'account_balance_wallet', path: '/payments' },
          { label: 'Support', icon: 'support_agent', path: '/support' },
          { label: 'Profile', icon: 'person', path: '/profile' },
        ].map((tab) => (
          <button key={tab.path} onClick={() => navigate(tab.path)}
            className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer border-none bg-transparent min-w-0">
            {tab.path === '/pools' && <span className="absolute inset-0 bg-[#006972]/10 rounded-2xl" />}
            <Icon name={tab.icon} size={22} className={`relative z-10 transition-all duration-200 ${tab.path === '/pools' ? 'text-[#006972] scale-110' : 'text-deep-navy/45'}`} />
            <span className={`font-label text-[9px] mt-0.5 font-semibold relative z-10 truncate max-w-[48px] ${tab.path === '/pools' ? 'text-[#006972]' : 'text-deep-navy/45'}`}>{tab.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}
