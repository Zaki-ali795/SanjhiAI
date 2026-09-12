import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/Icon';
import { useNavDrawer } from '../../context/NavDrawerContext';
import logo from '../../assets/screen.png';
import aiLogo from '../../assets/sanjhi-ai-logo.png';
import whatsappIcon from '../../assets/whatsapp-icon.svg';
import { dashboardService, notificationService } from '../../services';

import { useCountUp } from '../../hooks/useCountUp';
import { resolvePhotoUrl, getBackendUrl } from '../../utils/backendUrl';
import { SUPPORT_WHATSAPP_NUMBER } from '../../utils/constants';

/* ── Scroll-reveal hook ── */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ── Helper skeleton bone ── */
function Bone({ className = '' }) {
  return <span className={`skeleton-bone inline-block ${className}`} />;
}

/* ── Ticker items ── */
const TICKER_ITEMS = [
  { icon: 'verified_user', text: 'Welcome to Sanjhi — Verified Peer-to-Peer Savings Platform', color: 'text-[#006972]' },
  { icon: 'shield', text: 'Your payments and trust score are secured via PostgreSQL ledger', color: 'text-emerald-600' },
  { icon: 'groups', text: 'Create or join a committee pool with friends & family anytime', color: 'text-[#006972]' },
  { icon: 'auto_awesome', text: 'Ask Sanjhi AI for advice on managing committee schedules & payouts', color: 'text-amber-700' },
];

/* ── Floating particle positions ── */
const PARTICLES = [
  { x: 12, y: 20, size: 5, delay: 0, dur: 6 },
  { x: 28, y: 55, size: 3, delay: 1.2, dur: 8 },
  { x: 48, y: 15, size: 4, delay: 2.5, dur: 7 },
  { x: 65, y: 70, size: 6, delay: 0.7, dur: 5 },
  { x: 78, y: 35, size: 3, delay: 3.1, dur: 9 },
  { x: 88, y: 80, size: 5, delay: 1.8, dur: 6.5 },
  { x: 35, y: 88, size: 4, delay: 4.0, dur: 7.5 },
  { x: 92, y: 22, size: 3, delay: 0.4, dur: 8.5 },
  { x: 55, y: 50, size: 6, delay: 2.0, dur: 5.5 },
  { x: 72, y: 90, size: 4, delay: 3.5, dur: 7 },
];

const WHATSAPP_NUMBER = SUPPORT_WHATSAPP_NUMBER;

/* ── Trust score tier (0–1000 model) ── */
function scoreTier(score) {
  if (score >= 900) return { badge: 'Top Tier Participant', tagline: 'Outstanding record — you qualify for the highest-tier pools!' };
  if (score >= 750) return { badge: 'Trusted Member', tagline: 'Strong record. Keep paying on time to reach the top tier.' };
  if (score >= 600) return { badge: 'Building Trust', tagline: 'Pay on time and verify your CNIC to grow your score.' };
  return { badge: 'Needs Attention', tagline: 'Missed payments lowered your score. On-time payments restore it.' };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openDrawer } = useNavDrawer();

  // User state — initially null so no mock name flashes
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhoto, setUserPhoto] = useState(null);

  const [activeFilter, setActiveFilter] = useState('all');
  const [ripples, setRipples] = useState({});

  const [targetScore, setTargetScore] = useState(0);
  const [onTimeRate, setOnTimeRate] = useState(90); // model prior for new users
  const [showTrustBreakdown, setShowTrustBreakdown] = useState(false);
  const [breakdown, setBreakdown] = useState(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [targetTotal, setTargetTotal] = useState(0);
  const [targetPayout, setTargetPayout] = useState(0);
  const [nextPayoutInfo, setNextPayoutInfo] = useState(null);
  const [dbCommittees, setDbCommittees] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingBackend, setLoadingBackend] = useState(true);
  const [selectedActivityModal, setSelectedActivityModal] = useState(null);

  const trustScore = useCountUp(targetScore, 1600, !loadingBackend);
  
    async function openTrustBreakdown() {
      setShowTrustBreakdown(true);
      setBreakdownLoading(true);
      try {
        const data = await dashboardService.getTrustScoreBreakdown();
        setBreakdown(data);
        if (typeof data?.score === 'number') setTargetScore(data.score);
        if (typeof data?.components?.reliability?.rate === 'number') {
          setOnTimeRate(Math.round(data.components.reliability.rate * 100));
        }
      } catch (err) {
        console.error('Failed to load trust score breakdown:', err);
      } finally {
        setBreakdownLoading(false);
      }
    }
  const totalAmt = useCountUp(targetTotal, 1900, !loadingBackend);
  const nextPayoutAmt = useCountUp(targetPayout, 1700, !loadingBackend);

  const [heroRef, heroInView] = useInView(0.1);
  const [actionsRef, actionsInView] = useInView(0.1);
  const [committeeRef, committeeInView] = useInView(0.1);
  const [activityRef, activityInView] = useInView(0.1);

  useEffect(() => {
    // If navigation passed state user info, initialize with that
    if (location.state?.user?.full_name) {
      setUserName(location.state.user.full_name);
    }

    async function loadDashboardData() {
      try {
        const token = localStorage.getItem('sanjhi_token');
        if (!token) {
          setLoadingBackend(false);
          return;
        }

        // ── Stale-while-revalidate: show cached data instantly ──
        const CACHE_KEY = 'sanjhi_dashboard_cache';
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            // Hydrate UI immediately from cache
            if (cachedData?.user?.fullName) {
              setUserName(cachedData.user.fullName);
              setUserEmail(cachedData.user.email || '');
            }
            if (cachedData?.user?.photoUrl) {
              setUserPhoto(resolvePhotoUrl(cachedData.user.photoUrl));
            }
            if (cachedData?.trustScore?.score) setTargetScore(cachedData.trustScore.score);
            if (cachedData?.financialSummary?.totalContributed !== undefined) {
              setTargetTotal(cachedData.financialSummary.totalContributed);
            }
            if (cachedData?.committees) setDbCommittees(cachedData.committees);
            setLoadingBackend(false); // Don't show skeleton if we have cache
          } catch (_) {}
        }

        const data = await dashboardService.getDashboardOverview();

        if (data?.user?.fullName) {
          setUserName(data.user.fullName);
          setUserEmail(data.user.email || '');
        } else if (data?.user?.email) {
          setUserName(data.user.email.split('@')[0]);
        }

        if (data?.user?.photoUrl) {
          setUserPhoto(resolvePhotoUrl(data.user.photoUrl));
        }

        if (data?.trustScore?.score) {
          setTargetScore(data.trustScore.score);
        } else {
          setTargetScore(850); // default starting trust score
        }

        if (typeof data?.trustScore?.onTimeRate === 'number') {
          setOnTimeRate(data.trustScore.onTimeRate);
        }

        if (data?.financialSummary?.totalContributed !== undefined) {
          setTargetTotal(data.financialSummary.totalContributed);
        }

        if (data?.financialSummary?.nextPayout) {
          setNextPayoutInfo(data.financialSummary.nextPayout);
          setTargetPayout(data.financialSummary.nextPayout.amount || 0);
        }

        if (data?.committees && Array.isArray(data.committees)) {
          setDbCommittees(data.committees);
        }

        // Cache the fresh data for next visit (stale-while-revalidate)
        try {
          localStorage.setItem('sanjhi_dashboard_cache', JSON.stringify(data));
        } catch (_) {}

        // ── Defer secondary data (notifications, activity) after primary renders ──
        setTimeout(async () => {
          try {
            const activityData = await dashboardService.getRecentActivities();
            if (activityData?.activities && Array.isArray(activityData.activities)) {
              setRecentActivities(activityData.activities);
            }

            const notificationData = await notificationService.getNotifications();
            if (notificationData?.notifications && Array.isArray(notificationData.notifications)) {
              setRecentNotifications(notificationData.notifications.slice(0, 5));
            }

            const countData = await notificationService.getUnreadCount();
            setUnreadCount(countData.count || 0);
          } catch (actErr) {
            console.error('Failed to load activity/notification data:', actErr);
          }
        }, 0);
      } catch (err) {
        console.log('Backend connection notice:', err.message);
      } finally {
        setLoadingBackend(false);
      }
    }

    loadDashboardData();
  }, [location]);

  function ripple(e, id) {
    const r = e.currentTarget.getBoundingClientRect();
    setRipples((p) => ({ ...p, [id]: { x: e.clientX - r.left, y: e.clientY - r.top, k: Date.now() } }));
    setTimeout(() => setRipples((p) => { const n = { ...p }; delete n[id]; return n; }), 700);
  }

  function openWhatsApp() {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I need help with my Sanjhi account.')}`, '_blank');
  }

  const navTabs = useMemo(() => [
    { label: 'Home', icon: 'dashboard', path: '/dashboard' },
    { label: 'Pools', icon: 'groups', path: '/pools' },
    { label: 'Payments', icon: 'account_balance_wallet', path: '/payments' },
    { label: 'Support', icon: 'support_agent', path: '/support' },
    { label: 'Profile', icon: 'person', path: '/profile' },
  ], []);

  return (
    <div className="min-h-screen bg-white text-deep-navy font-body antialiased relative overflow-x-hidden pb-28 md:pb-12">

      {/* ══════════════════════════════════════════════════ */}
      {/*  AMBIENT BACKGROUND LAYER (GPU-OPTIMIZED)          */}
      {/* ══════════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        style={{ contain: 'strict', transform: 'translateZ(0)' }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.28]"
          style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #006972 1.2px, transparent 1.2px)', backgroundSize: '28px 28px' }} />

        {/* Soft atmospheric accents (zero expensive software blurs) */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full top-[-150px] left-[-150px] pointer-events-none opacity-35"
          style={{ background: 'radial-gradient(circle, rgba(0,105,114,0.18) 0%, rgba(0,105,114,0.03) 50%, transparent 70%)' }}
        />
        <div
          className="absolute w-[450px] h-[450px] rounded-full bottom-[-100px] right-[-100px] pointer-events-none opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.03) 50%, transparent 70%)' }}
        />

        {/* Sanjhi logo watermark */}
        <img src={logo} alt="" aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[480px] md:w-[650px] opacity-[0.035] select-none pointer-events-none" />
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/*  LIVE ACTIVITY TICKER                             */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="relative z-30 bg-[#006972]/8 border-b border-[#006972]/15 overflow-hidden h-9 flex items-center">
        <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
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

      {/* ══════════════════════════════════════════════════ */}
      {/*  TOP APP BAR (Mobile & Desktop Responsive)         */}
      {/* ══════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#006972]/10 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-18 flex items-center justify-between gap-2">

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => navigate('/profile')} className="relative group cursor-pointer border-none bg-transparent p-0 shrink-0">
              <img src={userPhoto || "/avatar.svg"} alt="Profile"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-[#006972] shadow-sm group-hover:scale-105 transition-all duration-300" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white bg-emerald-500">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping-slow" />
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] sm:text-[12px] font-label font-medium text-on-surface-variant">Welcome back,</span>
                <span className="text-[9px] sm:text-[10px] font-label px-1.5 py-0.2 rounded-full bg-[#006972]/10 text-[#006972] font-bold uppercase tracking-wider hidden sm:inline-block">
                  Verified ✓
                </span>
              </div>

              {/* Show skeleton while loading backend name to prevent flashing mock names */}
              {loadingBackend && !userName ? (
                <Bone className="w-28 h-5 rounded-full mt-0.5" />
              ) : (
                <h1 className="font-headline text-[15px] sm:text-[22px] font-bold text-[#006972] tracking-tight leading-tight truncate">
                  {userName || 'User'}
                </h1>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <nav className="hidden md:flex items-center gap-1 mr-2">
              {navTabs.slice(1, 4).map((item) => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label text-[13px] font-semibold text-deep-navy/60 hover:text-[#006972] hover:bg-[#006972]/8 transition-all cursor-pointer border-none bg-transparent">
                  <Icon name={item.icon} size={16} />
                  {item.label}
                </button>
              ))}
            </nav>

            <button onClick={(e) => { ripple(e, 'ai'); navigate('/assistant'); }}
              className="relative overflow-hidden flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-[#006972]/10 hover:bg-[#006972]/18 text-[#006972] font-label text-[12px] font-bold border border-[#006972]/25 transition-all active:scale-95 cursor-pointer"
              title="Open Sanjhi AI Assistant">
              {ripples.ai && <span key={ripples.ai.k} className="absolute rounded-full bg-[#006972]/20 w-24 h-24 -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none" style={{ left: ripples.ai.x, top: ripples.ai.y }} />}
              <img src={aiLogo} alt="Sanjhi AI" className="w-4.5 h-4.5 rounded-lg object-cover shrink-0" />
              <span className="hidden sm:inline">Sanjhi AI</span>
            </button>

            <button onClick={openWhatsApp}
              className="relative p-2 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/25 transition-all active:scale-95 cursor-pointer group" aria-label="Chat on WhatsApp"
              title="Chat with us on WhatsApp">
              <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            <button onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-full bg-white hover:bg-[#006972]/5 border border-[#006972]/20 text-[#006972] transition-all active:scale-95 cursor-pointer group" aria-label="Notifications">
              <Icon name="notifications" size={18} />
              {unreadCount > 0 && (
                 <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold ring-1 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                 </span>
              )}
            </button>

            {/* Mobile Menu Drawer Toggle */}
            <button
              onClick={openDrawer}
              className="md:hidden relative p-2 rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 border border-[#006972]/20 text-[#006972] transition-all active:scale-95 cursor-pointer"
              aria-label="Open Navigation Menu"
              title="Open Menu"
            >
              <Icon name="menu" size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════ */}
      {/*  MAIN CONTENT (Responsive Mobile / Desktop)        */}
      {/* ══════════════════════════════════════════════════ */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6 relative z-10">

        {/* ── TRUST SCORE + METRICS ── */}
        <section ref={heroRef} className={`grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 transition-all duration-700 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

          {/* Trust Score Card — Compact on mobile, rich on desktop */}
          <div onClick={openTrustBreakdown} role="button" tabIndex={0} title="Tap to see your score breakdown"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openTrustBreakdown(); }}
            className="lg:col-span-8 bg-[#006972] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 relative overflow-hidden flex flex-col justify-between shadow-lg shadow-[#006972]/20 group cursor-pointer animate-border-breathe border-2 border-transparent min-h-[150px] sm:min-h-[210px]">
            <div className="absolute inset-0 opacity-15 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />

            <img src={logo} alt="" aria-hidden
              className="absolute right-6 top-1/2 -translate-y-1/2 w-20 opacity-15 select-none hidden sm:block pointer-events-none"
              style={{ filter: 'brightness(0) invert(1)' }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 sm:p-1.5 rounded-lg bg-white/20">
                    <Icon name="shield_with_heart" size={16} />
                  </span>
                  <h2 className="font-label text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-white/90">Trust Score</h2>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] sm:text-[11px] font-label font-bold border border-white/30 flex items-center gap-1">
                  <Icon name="verified" size={13} /> {scoreTier(targetScore).badge}
                </span>
              </div>

              <div className="flex items-baseline gap-3 sm:gap-4 my-1">
                {loadingBackend ? (
                  <Bone className="w-28 h-10 rounded-xl bg-white/20" />
                ) : (
                  <span className="font-headline text-[38px] sm:text-[56px] lg:text-[68px] font-extrabold text-white tracking-tight leading-none tabular-nums">
                    {trustScore.toLocaleString()}
                  </span>
                )}
                <span className="text-[11px] sm:text-[13px] font-body text-white/85 leading-tight flex-1">
                  {scoreTier(targetScore).tagline}
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 sm:mt-4 sm:pt-3 border-t border-white/20 relative z-10">
              <div className="flex justify-between text-[11px] sm:text-[12px] font-label text-white/90 mb-1 font-medium">
                <span>{trustScore.toLocaleString()} / 1000</span>
                <span className="font-bold">{onTimeRate}% Reliability</span>
              </div>
              <div className="w-full h-2 sm:h-2.5 bg-black/25 rounded-full overflow-hidden p-0.5 border border-white/20">
                <div className="h-full rounded-full transition-all duration-[1700ms] ease-out relative overflow-hidden"
                  style={{ width: heroInView ? `${Math.min(100, Math.max(0, targetScore / 10))}%` : '0%', background: 'linear-gradient(90deg, #fcd34d, #6ee7b7, #ffffff)' }}>
                  <div className="absolute inset-0 animate-shimmer" />
                </div>
              </div>
              <p className="mt-1.5 text-[9.5px] sm:text-[11px] font-label font-bold text-white/70 flex items-center gap-1">
                <Icon name="analytics" size={13} /> Tap for full reliability & penalty breakdown
              </p>
            </div>
          </div>

          {/* Side Metric Cards — 2 columns on mobile, clean cards on desktop */}
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
            {[
              {
                icon: 'account_balance_wallet',
                label: 'Contributed',
                value: `PKR ${totalAmt.toLocaleString()}`,
                sub: 'Confirmed dues',
                subIcon: 'trending_up',
                subColor: 'text-emerald-700',
                iconCls: 'bg-[#006972] text-white shadow-sm',
              },
              {
                icon: 'event_available',
                label: 'Next Payout',
                value: nextPayoutInfo ? `PKR ${nextPayoutAmt.toLocaleString()}` : 'None',
                sub: nextPayoutInfo ? `Turn #${nextPayoutInfo.turnNumber}` : 'No upcoming turn',
                subIcon: 'schedule',
                subColor: 'text-amber-800',
                iconCls: 'bg-[#006972]/10 text-[#006972] border border-[#006972]/20',
              },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-[#006972]/15 flex items-center gap-2.5 sm:gap-3 shadow-sm hover:shadow-md transition-all">
                <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${card.iconCls}`}>
                  <Icon name={card.icon} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label text-[9.5px] sm:text-[11px] font-bold text-[#006972] uppercase tracking-wider truncate">{card.label}</p>
                  {loadingBackend ? (
                    <Bone className="w-16 h-4 rounded-full my-0.5" />
                  ) : (
                    <p className="font-headline text-[13.5px] sm:text-[19px] font-extrabold text-deep-navy tabular-nums truncate leading-tight">{card.value}</p>
                  )}
                  <p className={`font-label text-[10px] sm:text-[11px] font-bold flex items-center gap-0.5 truncate ${card.subColor}`}>
                    <Icon name={card.subIcon} size={12} /> {card.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── QUICK ACTIONS (Compact Mobile Grid) ── */}
        <section ref={actionsRef} className={`grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 transition-all duration-700 delay-100 ${actionsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {[
            { label: 'Create Pool', icon: 'add_circle', primary: true, path: '/committee/create', id: 'act-create' },
            { label: 'Join Code', icon: 'group_add', primary: false, path: '/join', id: 'act-join' },
            { label: 'Explore Pools', icon: 'public', primary: false, path: '/committees/public', id: 'act-explore' },
            { label: 'Pay Dues', icon: 'payments', primary: false, path: '/payments', id: 'act-pay' },
            { label: 'Support', icon: 'report_problem', primary: false, path: '/support/file-complaint', id: 'act-support' },
          ].map((action, idx) => (
            <button key={action.id}
              onClick={(e) => { ripple(e, action.id); setTimeout(() => navigate(action.path), 120); }}
              className={`relative overflow-hidden py-3 px-2 sm:py-4 sm:px-3 rounded-xl sm:rounded-2xl font-label text-[12px] sm:text-[13px] font-bold active:scale-95 transition-all shadow-sm flex flex-col items-center gap-1.5 cursor-pointer ${action.primary
                  ? 'bg-[#006972] text-white hover:bg-[#005a62] shadow-[#006972]/20'
                  : 'bg-white text-[#006972] border border-[#006972]/30 hover:bg-[#006972]/5'
                }`}
              style={{ animationDelay: `${idx * 0.1}s` }}>
              {ripples[action.id] && (
                <span key={ripples[action.id].k} className={`absolute rounded-full w-28 h-28 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-ping ${action.primary ? 'bg-white/20' : 'bg-[#006972]/10'}`}
                  style={{ left: ripples[action.id].x, top: ripples[action.id].y }} />
              )}
              <Icon name={action.icon} size={22} className="shrink-0" />
              <span className="truncate">{action.label}</span>
            </button>
          ))}
        </section>

        {/* ── COMMITTEES ── */}
        <section ref={committeeRef} className={`space-y-4 transition-all duration-700 delay-150 ${committeeInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="font-headline text-[22px] sm:text-[26px] font-bold text-[#006972] tracking-tight">Your Committees</h2>
              <p className="font-body text-[13px] text-on-surface-variant">Active savings pools you belong to in PostgreSQL</p>
            </div>
            <div className="flex items-center gap-2">
              {[{ id: 'all', label: 'All' }, { id: 'organizer', label: 'Organizing' }, { id: 'member', label: 'Member' }].map((f) => (
                <button key={f.id} onClick={() => setActiveFilter(f.id)}
                  className={`px-4 py-1.5 rounded-full font-label text-[12px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${activeFilter === f.id ? 'bg-[#006972] text-white shadow-sm scale-105' : 'bg-white text-[#006972] border border-[#006972]/30 hover:bg-[#006972]/5 hover:scale-105'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {loadingBackend ? (
              // Shimmer skeleton cards while loading
              [0, 1].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border-2 border-[#006972]/10 space-y-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Bone className="w-12 h-12 rounded-2xl shrink-0" />
                      <div className="flex flex-col gap-2">
                        <Bone className="w-36 h-4 rounded-full" />
                        <Bone className="w-28 h-3 rounded-full" />
                      </div>
                    </div>
                    <Bone className="w-20 h-6 rounded-full" />
                  </div>
                  <Bone className="w-full h-14 rounded-2xl" />
                  <Bone className="w-full h-2 rounded-full" />
                </div>
              ))
            ) : dbCommittees.length > 0 ? (
              // Real committees from database
              dbCommittees
                .filter((c) => {
                  if (activeFilter === 'organizer') return c.userRole === 'Organizer' || c.userRole === 'Co-Organizer';
                  if (activeFilter === 'member') return c.userRole === 'Member';
                  return true;
                })
                .map((c) => (
                  <CommitteeCard
                    key={c.id}
                    onClick={() => navigate(`/committee/${c.id}`)}
                    iconName={c.userRole === 'Organizer' ? 'groups' : 'savings'}
                    iconBg={c.userRole === 'Organizer' ? 'bg-[#006972]/10 text-[#006972]' : 'bg-amber-500/10 text-amber-800'}
                    title={c.name}
                    subtitle={`${c.intervalType === '15_days' ? 'Bi-weekly' : 'Monthly'} • PKR ${c.contributionAmount.toLocaleString()} / cycle`}
                    badge={c.userRole}
                    badgeStyle={c.userRole === 'Organizer' ? 'bg-[#006972]/10 text-[#006972] border-[#006972]/20' : 'bg-amber-500/10 text-amber-800 border-amber-500/20'}
                    progress={c.capacity > 0 ? Math.round((c.completedCycles / c.capacity) * 100) : 0}
                    metrics={[
                      { label: 'Cycles', value: `${c.completedCycles} of ${c.capacity}` },
                      { label: 'Members', value: `${c.memberCount}` },
                      { label: 'Pool', value: `PKR ${c.totalPool >= 1000 ? (c.totalPool / 1000).toFixed(0) + 'k' : c.totalPool}`, highlight: true },
                    ]}
                    footerLeft={<><Icon name="check_circle" size={14} /> Active Pool</>}
                    footerLeftColor="text-emerald-700"
                    footerRight="Manage"
                  />
                ))
            ) : (
              // Clean Empty State Card when user is not part of any committee yet
              <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-8 border-2 border-[#006972]/15 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center mb-1">
                  <Icon name="group_add" size={36} />
                </div>
                <h3 className="font-headline text-[20px] font-bold text-deep-navy">No Active Committees Yet</h3>
                <p className="font-body text-[14px] text-on-surface-variant max-w-md">
                  You haven't joined or created any committee pools yet. Get started by organizing a new committee or joining one with an invite code!
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                  <button
                    onClick={() => navigate('/committee/create')}
                    className="px-6 py-2.5 rounded-full font-label text-[14px] font-bold text-white bg-[#006972] hover:bg-[#005a62] transition-colors shadow-sm cursor-pointer"
                  >
                    Create Committee
                  </button>
                  <button
                    onClick={() => navigate('/join')}
                    className="px-6 py-2.5 rounded-full font-label text-[14px] font-bold text-[#006972] border-2 border-[#006972] bg-white hover:bg-[#006972]/5 transition-colors cursor-pointer"
                  >
                    Join with Code
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── RECENT ACTIVITY ── */}
        <section ref={activityRef} className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#006972]/15 shadow-sm transition-all duration-700 delay-200 ${activityInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-headline text-[16px] sm:text-[18px] font-bold text-[#006972] flex items-center gap-1.5">
              <Icon name="history" size={20} />
              Recent Activity
            </h3>
            <button onClick={() => navigate('/notifications')} className="font-label text-[12px] sm:text-[13px] font-bold text-[#006972] hover:underline bg-transparent border-none cursor-pointer">
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {loadingBackend ? (
              [0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl sm:rounded-2xl bg-[#fbfaee]">
                  <Bone className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Bone className="w-1/3 h-3.5 rounded-full" />
                    <Bone className="w-2/3 h-3 rounded-full" />
                  </div>
                </div>
              ))
            ) : recentActivities.length > 0 ? (
              recentActivities.slice(0, 5).map((act, idx) => {
                const iconMap = {
                  payment: { name: 'payments', bg: 'bg-emerald-500/10 text-emerald-700' },
                  committee_join: { name: 'group_add', bg: 'bg-[#006972]/10 text-[#006972]' },
                  committee_create: { name: 'add_circle', bg: 'bg-[#D4AF37]/20 text-[#7a6400]' },
                  default: { name: 'notifications', bg: 'bg-slate-100 text-slate-700' },
                };
                const ic = iconMap[act.action_type] || iconMap.default;
                return (
                    <div key={act.id || idx}
                    onClick={() => setSelectedActivityModal({
                      title: act.title,
                      description: act.description,
                      date: act.created_at,
                      type: act.action_type || 'activity',
                      icon: ic.name,
                      iconBg: ic.bg,
                    })}
                    className="flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#fbfaee] border border-deep-navy/5 hover:bg-[#006972]/5 hover:border-[#006972]/25 transition-all cursor-pointer group">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${ic.bg}`}>
                      <Icon name={ic.name} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-headline text-[13px] sm:text-[14px] font-bold text-deep-navy truncate">{act.title}</p>
                      <p className="font-body text-[11px] sm:text-[12px] text-on-surface-variant truncate">{act.description}</p>
                    </div>
                    <span className="font-label text-[10px] sm:text-[11px] text-on-surface-variant shrink-0 ml-1">
                      {new Date(act.created_at).toLocaleDateString()}
                    </span>
                  </div>
                );
              })
            ) : recentNotifications.length > 0 ? (
              recentNotifications.map((item, idx) => (
                <div key={item.id || idx}
                  onClick={() => setSelectedActivityModal({
                    title: item.type?.replace(/_/g, ' ').toUpperCase() || 'Notification',
                    description: item.content || item.body || 'Notification detail',
                    date: item.created_at,
                    type: item.type || 'notification',
                    icon: 'notifications',
                    iconBg: 'bg-[#006972]/10 text-[#006972]',
                  })}
                  className="flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#fbfaee] border border-deep-navy/5 hover:bg-[#006972]/5 hover:border-[#006972]/25 transition-all cursor-pointer group">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#006972]/10 text-[#006972]">
                    <Icon name="notifications" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-headline text-[13px] sm:text-[14px] font-bold text-deep-navy truncate">{item.type?.replace('_', ' ').toUpperCase() || 'Notification'}</p>
                    <p className="font-body text-[11px] sm:text-[12px] text-on-surface-variant truncate">{item.content}</p>
                  </div>
                  <span className="font-label text-[10px] sm:text-[11px] text-on-surface-variant shrink-0 ml-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3.5 rounded-xl sm:rounded-2xl bg-[#fbfaee] text-center text-on-surface-variant text-[12px] sm:text-[13px] font-body">
                No recent activity yet.
              </div>
            )}
          </div>
        </section>

      </main>


      {showTrustBreakdown && (
        <TrustBreakdownModal
          loading={breakdownLoading}
          data={breakdown}
          score={typeof breakdown?.score === 'number' ? breakdown.score : targetScore}
          onClose={() => setShowTrustBreakdown(false)}
        />
      )}

      {/* ── ACTIVITY / NOTIFICATION DETAIL MODAL ── */}
      {selectedActivityModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedActivityModal(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-[#fbfaee]/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedActivityModal.iconBg || 'bg-[#006972]/10 text-[#006972]'}`}>
                  <Icon name={selectedActivityModal.icon || 'notifications'} size={20} />
                </div>
                <div className="min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded-full font-label text-[10px] font-bold bg-[#006972]/10 text-[#006972] border border-[#006972]/20 mb-0.5">
                    {selectedActivityModal.type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <h3 className="font-headline text-[15px] sm:text-[16px] font-bold text-deep-navy truncate">
                    Activity Details
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivityModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
              <div>
                <h4 className="font-headline text-[15px] sm:text-[16px] font-bold text-deep-navy mb-1.5">
                  {selectedActivityModal.title}
                </h4>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-slate-800 font-body text-[13px] leading-relaxed select-text">
                  {selectedActivityModal.description}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#fbfaee] border border-deep-navy/5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0">
                  <Icon name="schedule" size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-label uppercase font-bold text-on-surface-variant">Recorded At</p>
                  <p className="text-[12px] font-bold text-deep-navy truncate">
                    {new Date(selectedActivityModal.date).toLocaleString('en-PK', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${selectedActivityModal.title}\n\n${selectedActivityModal.description}`);
                  setSelectedActivityModal(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-label text-[12px] font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Icon name="content_copy" size={14} />
                <span>Copy</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedActivityModal(null)}
                className="px-4 py-2 rounded-xl bg-[#006972] hover:bg-[#005a62] text-white font-label text-[12px] font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/*  FLOATING WHATSAPP BUTTON                         */}
      {/* ══════════════════════════════════════════════════ */}
      <button
        onClick={openWhatsApp}
        className="fixed bottom-20 right-3.5 md:bottom-6 md:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#1da851] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/30 transition-all active:scale-90 cursor-pointer border-2 sm:border-4 border-white group"
        title="Chat with us on WhatsApp"
      >
        <img src={whatsappIcon} alt="WhatsApp" className="w-6 h-6 sm:w-7 sm:h-7 brightness-0 invert" />
        <span className="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-deep-navy text-white font-label text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          Chat on WhatsApp
        </span>
      </button>

    </div>
  );
}

/* ── Committee Card Component ── */
function CommitteeCard({ onClick, iconName, iconBg, title, subtitle, badge, badgeStyle, metrics, footerLeft, footerLeftColor, footerRight, progress }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#006972]/15 hover:border-[#006972] transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon name={iconName} size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="font-headline text-[14.5px] sm:text-[17px] font-bold text-deep-navy group-hover:text-[#006972] transition-colors truncate">{title}</h3>
            <p className="font-label text-[11px] sm:text-[12px] text-on-surface-variant truncate">{subtitle}</p>
          </div>
        </div>
        <span className={`font-label text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${badgeStyle}`}>{badge}</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 sm:py-2.5 sm:px-3 bg-[#fbfaee] rounded-xl sm:rounded-2xl mb-2 text-center border border-deep-navy/5">
        {metrics.map((m, i) => (
          <div key={i}>
            <p className="font-label text-[8.5px] sm:text-[9px] uppercase text-on-surface-variant font-semibold mb-0.5">{m.label}</p>
            <p className={`font-headline text-[13px] sm:text-[15px] font-bold ${m.color || (m.highlight ? 'text-[#006972]' : 'text-deep-navy')}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-2">
        <div className="w-full h-1 sm:h-1.5 bg-deep-navy/6 rounded-full overflow-hidden">
          <div className="h-full bg-[#006972] rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] sm:text-[12px] font-label font-bold pt-1 border-t border-deep-navy/5">
        <span className={`flex items-center gap-1 ${footerLeftColor || 'text-deep-navy/70'}`}>
          {footerLeft}
        </span>
        <span className="text-[#006972] flex items-center gap-0.5 group-hover:underline">
          {footerRight} →
        </span>
      </div>
    </div>
  );
}

/* ── Trust Score Breakdown Modal ── */
const TRUST_EVENT_STYLES = {
  payment_on_time: { icon: 'check_circle', cls: 'bg-emerald-50 text-emerald-600' },
  payment_late: { icon: 'schedule', cls: 'bg-amber-50 text-amber-600' },
  payment_missed: { icon: 'cancel', cls: 'bg-red-50 text-red-600' },
  committee_completed: { icon: 'task_alt', cls: 'bg-emerald-50 text-emerald-600' },
  committee_dropout: { icon: 'exit_to_app', cls: 'bg-red-50 text-red-600' },
  complaint_penalty: { icon: 'gavel', cls: 'bg-red-50 text-red-600' },
  verification: { icon: 'verified_user', cls: 'bg-[#006972]/10 text-[#006972]' },
};

function TrustBreakdownModal({ loading, data, score, onClose }) {
  const c = data?.components;
  const bars = c
    ? [
        { key: 'base', icon: 'flag', label: 'Base score', points: c.base, max: 250, note: 'Every verified user starts here', bar: 'bg-deep-navy' },
        { key: 'rel', icon: 'schedule', label: 'Payment reliability', points: c.reliability.points, max: c.reliability.max, note: `${Math.round(c.reliability.rate * 100)}% on-time quality • 90-day decay`, bar: 'bg-[#006972]' },
        { key: 'comp', icon: 'task_alt', label: 'Committee completion', points: c.completion.points, max: c.completion.max, note: 'Finish the pools you join • 180-day decay', bar: 'bg-emerald-600' },
        { key: 'ver', icon: 'verified_user', label: 'Identity verification', points: c.verification.points, max: c.verification.max, note: 'Phone + email + CNIC', bar: 'bg-amber-500' },
      ]
    : [];
  const penaltyPoints = c?.penalties?.points || 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Trust score breakdown">
      <div className="fixed inset-0 bg-deep-navy/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl max-h-[86vh] overflow-y-auto my-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#006972] text-white px-6 py-5 rounded-t-3xl flex items-start justify-between">
          <div>
            <p className="font-label text-[11px] uppercase tracking-widest font-bold text-white/80 flex items-center gap-1.5">
              <Icon name="shield_with_heart" size={16} /> Community Trust Score
            </p>
            <p className="font-headline text-[42px] font-extrabold leading-none mt-1 tabular-nums">
              {Math.round(score).toLocaleString()}<span className="text-[16px] font-bold text-white/70"> / 1000</span>
            </p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors cursor-pointer">
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="space-y-3 py-4">
              <Bone className="w-full h-12 rounded-2xl" />
              <Bone className="w-full h-12 rounded-2xl" />
              <Bone className="w-2/3 h-12 rounded-2xl" />
            </div>
          ) : !data ? (
            <p className="text-center text-on-surface-variant font-body text-[14px] py-6">
              Could not load the breakdown right now. Please try again.
            </p>
          ) : (
            <>
              {/* Component bars */}
              <div className="space-y-4">
                {bars.map((b) => (
                  <div key={b.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label text-[12px] font-bold text-deep-navy flex items-center gap-1.5">
                        <Icon name={b.icon} size={16} className="text-[#006972]" /> {b.label}
                      </span>
                      <span className="font-label text-[12px] font-bold text-deep-navy tabular-nums">
                        {b.points}<span className="text-on-surface-variant font-semibold"> / {b.max}</span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-deep-navy/8 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${b.bar} transition-all duration-700`}
                        style={{ width: `${Math.min(100, (b.points / b.max) * 100)}%` }} />
                    </div>
                    <p className="font-body text-[11px] text-on-surface-variant mt-1">{b.note}</p>
                  </div>
                ))}

                {penaltyPoints < 0 && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-red-50 border border-red-100">
                    <span className="font-label text-[12px] font-bold text-red-700 flex items-center gap-1.5">
                      <Icon name="gavel" size={16} /> Dispute penalties
                    </span>
                    <span className="font-label text-[13px] font-extrabold text-red-700 tabular-nums">{penaltyPoints} pts</span>
                  </div>
                )}
              </div>

              {/* Recent score events */}
              {data.recentEvents?.length > 0 && (
                <div>
                  <h3 className="font-label text-[11px] uppercase tracking-widest font-bold text-on-surface-variant mb-2.5">What moved your score</h3>
                  <div className="space-y-2">
                    {data.recentEvents.map((e, i) => {
                      const st = TRUST_EVENT_STYLES[e.type] || { icon: 'info', cls: 'bg-deep-navy/5 text-deep-navy' };
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-[#fbfaee] border border-deep-navy/5">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${st.cls}`}>
                            <Icon name={st.icon} size={16} />
                          </span>
                          <span className="flex-1 min-w-0 font-body text-[13px] text-deep-navy truncate">{e.label}</span>
                          <span className="font-label text-[11px] text-on-surface-variant shrink-0">
                            {e.occurredAt ? new Date(e.occurredAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Disclosed formula */}
              {data.formula && (
                <div className="p-4 rounded-2xl bg-[#006972]/5 border border-[#006972]/15">
                  <p className="font-label text-[10px] uppercase tracking-widest font-bold text-[#006972] mb-1 flex items-center gap-1">
                    <Icon name="calculate" size={14} /> Disclosed formula
                  </p>
                  <p className="font-body text-[12px] text-deep-navy/80 leading-relaxed">{data.formula}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
