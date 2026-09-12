import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import CnicVerificationModal from '../../components/CnicVerificationModal';
import ReportUserModal from '../../components/ReportUserModal';
import { useNavDrawer } from '../../context/NavDrawerContext';
import { getPublicCommittees, joinByCode } from '../../services/committeeService';
import { getCnicStatus } from '../../services/authService';
import { getUnreadCount } from '../../services/notificationService';
import logo from '../../assets/screen.png';
import aiLogo from '../../assets/sanjhi-ai-logo.png';
import whatsappIcon from '../../assets/whatsapp-icon.svg';
import { SUPPORT_WHATSAPP_NUMBER } from '../../utils/constants';

const WHATSAPP_NUMBER = SUPPORT_WHATSAPP_NUMBER;

const CATEGORIES = [
  { value: '', label: 'All Pools', icon: 'apps', bg: 'bg-[#006972]/10', text: 'text-[#006972]', border: 'border-[#006972]/20' },
  { value: 'savings', label: 'General Savings', icon: 'savings', bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/20' },
  { value: 'business', label: 'Business Growth', icon: 'trending_up', bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-500/20' },
  { value: 'wedding', label: 'Wedding & Events', icon: 'celebration', bg: 'bg-rose-500/10', text: 'text-rose-700', border: 'border-rose-500/20' },
  { value: 'education', label: 'Education & Fees', icon: 'school', bg: 'bg-purple-500/10', text: 'text-purple-700', border: 'border-purple-500/20' },
  { value: 'emergency', label: 'Emergency Fund', icon: 'shield_with_heart', bg: 'bg-amber-500/10', text: 'text-amber-800', border: 'border-amber-500/20' },
  { value: 'travel', label: 'Travel & Hajj', icon: 'flight_takeoff', bg: 'bg-cyan-500/10', text: 'text-cyan-700', border: 'border-cyan-500/20' },
  { value: 'health', label: 'Healthcare & Family', icon: 'medical_services', bg: 'bg-teal-500/10', text: 'text-teal-700', border: 'border-teal-500/20' },
];

function formatCurrency(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`;
}

function getCategoryMeta(catValue) {
  const found = CATEGORIES.find((c) => c.value === (catValue || '').toLowerCase());
  return found || {
    value: catValue,
    label: catValue ? catValue.charAt(0).toUpperCase() + catValue.slice(1) : 'Community Pool',
    icon: 'groups',
    bg: 'bg-[#006972]/10',
    text: 'text-[#006972]',
    border: 'border-[#006972]/20',
  };
}

function getIntervalDisplay(interval) {
  switch ((interval || '').toLowerCase()) {
    case 'weekly':
      return { text: 'Weekly', sub: 'Every 7 days', icon: 'date_range' };
    case 'biweekly':
    case 'bi_weekly':
      return { text: 'Bi-Weekly', sub: 'Every 14 days', icon: 'event_repeat' };
    case 'monthly':
    default:
      return { text: 'Monthly', sub: 'Every 30 days', icon: 'calendar_month' };
  }
}

function getTurnMethodDisplay(method) {
  switch ((method || '').toLowerCase()) {
    case 'bidding':
      return { label: 'Bidding Auction', icon: 'gavel', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    case 'lottery':
    case 'random':
      return { label: 'Random Draw', icon: 'casino', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    case 'manual':
    case 'organizer_assigned':
    default:
      return { label: 'Organizer Assigned', icon: 'manage_accounts', color: 'text-teal-700 bg-teal-50 border-teal-200' };
  }
}

export default function PublicCommittees() {
  const navigate = useNavigate();
  const { openDrawer } = useNavDrawer();
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'lowest' | 'highest' | 'spots'
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false);

  const [cnicStatus, setCnicStatus] = useState('unverified');
  const [showCnicModal, setShowCnicModal] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const [error, setError] = useState('');
  const [selectedCommittee, setSelectedCommittee] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [reportTarget, setReportTarget] = useState(null); // { id, name } of user to report

  useEffect(() => {
    loadCommittees();
    loadCnicStatus();
    loadUserData();
  }, [category, search]);

  async function loadUserData() {
    try {
      const stored = localStorage.getItem('sanjhi_user');
      if (stored) {
        setUserProfile(JSON.parse(stored));
      }
      const data = await getUnreadCount();
      if (data && typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    } catch (_) {}
  }

  async function loadCommittees() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (category) params.category = category;
      if (search.trim()) params.search = search.trim();
      const data = await getPublicCommittees(params);
      setCommittees(data.committees || []);
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load public committees.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCnicStatus() {
    try {
      const data = await getCnicStatus();
      const cnic = data.cnic || data;
      setCnicStatus(cnic.cnic_status || 'unverified');
    } catch {
      setCnicStatus('unverified');
    }
  }

  // Filter and sort committees locally for instant responsiveness
  const displayedCommittees = useMemo(() => {
    let list = [...committees];

    if (filterAvailableOnly) {
      list = list.filter((c) => {
        const memberCount = Number(c.member_count) || 1;
        const capacity = Number(c.capacity) || 1;
        return memberCount < capacity;
      });
    }

    list.sort((a, b) => {
      if (sortBy === 'lowest') {
        return Number(a.contribution_amount || 0) - Number(b.contribution_amount || 0);
      }
      if (sortBy === 'highest') {
        const totalA = Number(a.contribution_amount || 0) * Number(a.capacity || 1);
        const totalB = Number(b.contribution_amount || 0) * Number(b.capacity || 1);
        return totalB - totalA;
      }
      if (sortBy === 'spots') {
        const spotsA = Math.max(0, (Number(a.capacity) || 1) - (Number(a.member_count) || 1));
        const spotsB = Math.max(0, (Number(b.capacity) || 1) - (Number(b.member_count) || 1));
        return spotsA - spotsB;
      }
      // 'newest' default
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return list;
  }, [committees, sortBy, filterAvailableOnly]);

  async function handleJoin(committee) {
    setJoiningId(committee.id);
    setError('');

    if (cnicStatus !== 'verified') {
      setShowCnicModal(true);
      setJoiningId(null);
      return;
    }

    try {
      await joinByCode({ invite_code: committee.invite_code });
      navigate('/join-request-sent', { state: { committee } });
    } catch (err) {
      if (err.data?.code === 'CNIC_REQUIRED') {
        setCnicStatus(err.data.cnic_status || 'unverified');
        setShowCnicModal(true);
      } else {
        setError(err.data?.error || err.message || 'Failed to request to join.');
      }
    } finally {
      setJoiningId(null);
    }
  }

  function handleShare(e, committee) {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/join/${committee.invite_code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedId(committee.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  }

  function openWhatsApp() {
    const message = encodeURIComponent('Hello! I have a question about Sanjhi Public Committees.');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] font-body pb-28 md:pb-12 text-[#101F20]">
      
      {/* ══════════════════════════════════════════════════ */}
      {/*  PREMIUM TOP NAVIGATION BAR                        */}
      {/* ══════════════════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      {/*  TOP APP BAR                                      */}
      {/* ══════════════════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      {/*  TOP APP BAR (Mobile & Desktop Responsive)         */}
      {/* ══════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#006972]/10 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-18 flex items-center justify-between gap-2">
          
          {/* Left: Back Arrow + Logo & Marketplace Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              aria-label="Back to Dashboard"
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-all cursor-pointer active:scale-95 shrink-0"
              title="Return to Dashboard"
            >
              <Icon name="arrow_back" size={18} />
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="relative group cursor-pointer border-none bg-transparent p-0 shrink-0"
              title="View Profile"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#006972] shadow-sm group-hover:scale-105 transition-all overflow-hidden flex items-center justify-center bg-gradient-to-tr from-[#006972] to-[#004f56] text-white font-bold text-xs sm:text-sm">
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (userProfile?.full_name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white bg-emerald-500" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-label font-medium text-on-surface-variant">Marketplace</span>
                <span className="text-[9px] sm:text-[10px] font-label px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-700 font-bold uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Pools
                </span>
              </div>
              <h1 className="font-headline text-[15px] sm:text-[20px] font-bold text-[#006972] tracking-tight leading-tight truncate">
                Public Committees
              </h1>
            </div>
          </div>

          {/* Right: Nav Tabs + Sanjhi AI + WhatsApp + Notifications + Drawer */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <nav className="hidden md:flex items-center gap-1 mr-2">
              {[
                { label: 'Home', icon: 'dashboard', path: '/dashboard' },
                { label: 'Pools', icon: 'groups', path: '/pools' },
                { label: 'Payments', icon: 'account_balance_wallet', path: '/payments' },
                { label: 'Support', icon: 'support_agent', path: '/support' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label text-[13px] font-semibold text-deep-navy/60 hover:text-[#006972] hover:bg-[#006972]/8 transition-all cursor-pointer border-none bg-transparent"
                >
                  <Icon name={item.icon} size={16} />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Sanjhi AI Assistant Button */}
            <button
              onClick={() => navigate('/assistant')}
              className="relative overflow-hidden flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-[#006972]/10 hover:bg-[#006972]/18 text-[#006972] font-label text-[12px] font-bold border border-[#006972]/25 transition-all active:scale-95 cursor-pointer"
              title="Open Sanjhi AI Assistant"
            >
              <img
                src={aiLogo}
                alt="Sanjhi AI"
                className="w-4.5 h-4.5 rounded-lg object-cover shrink-0"
              />
              <span className="hidden sm:inline">Sanjhi AI</span>
            </button>

            {/* WhatsApp Support Button */}
            <button
              onClick={openWhatsApp}
              className="relative p-2 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/25 transition-all active:scale-95 cursor-pointer"
              aria-label="Chat on WhatsApp"
              title="Chat with us on WhatsApp"
            >
              <img
                src={whatsappIcon}
                alt="WhatsApp"
                className="w-4 h-4 sm:w-4.5 sm:h-4.5"
              />
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-full bg-white hover:bg-[#006972]/5 border border-[#006972]/20 text-[#006972] transition-all active:scale-95 cursor-pointer"
              aria-label="Notifications"
              title="Notifications"
            >
              <Icon
                name="notifications"
                size={18}
              />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold ring-1 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Drawer Toggle */}
            <button
              onClick={openDrawer}
              className="md:hidden relative p-2 rounded-full bg-[#006972]/10 hover:bg-[#006972]/20 border border-[#006972]/20 text-[#006972] transition-all active:scale-95 cursor-pointer"
              aria-label="Open Navigation Menu"
              title="Open Menu"
            >
              <Icon name="menu" size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-4">
        
        {/* ══════════════════════════════════════════════════ */}
        {/*  CONCISE HERO BANNER (Clean on Mobile)             */}
        {/* ══════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#004f56] via-[#006972] to-[#00383D] text-white p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 shadow-lg border border-white/10">
          {/* Ambient Lighting Orbs */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-[#FFE082] text-[10px] sm:text-xs font-label font-bold uppercase">
                  <Icon name="verified" size={14} />
                  <span>Public Pools</span>
                </span>
                <span className="text-[11px] text-emerald-200 font-medium">100% Verified ROSCA</span>
              </div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-headline font-bold tracking-tight text-white leading-tight">
                Explore Community Committees
              </h1>
              <p className="hidden sm:block text-white/85 text-xs sm:text-sm leading-relaxed mt-1 font-body">
                Discover active peer savings circles with guaranteed rotations and transparent payouts.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/committee/create')}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5BE48] hover:from-[#c29f2f] hover:to-[#d4af37] text-[#1a1400] font-label font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Icon name="add_circle" size={18} />
                <span>Create Pool</span>
              </button>

              {/* CNIC Quick Badge */}
              {cnicStatus === 'verified' ? (
                <div className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
                  <Icon name="check_circle" size={14} className="text-emerald-400" />
                  <span className="hidden sm:inline">CNIC Verified</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowCnicModal(true)}
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-amber-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Icon name="gpp_maybe" size={14} className="text-amber-300" />
                  <span>Verify CNIC</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar - Desktop only */}
          <div className="mt-5 pt-4 border-t border-white/15 hidden md:grid grid-cols-4 gap-4 text-white/90">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#FFE082] shrink-0">
                <Icon name="shield" size={18} />
              </div>
              <div>
                <p className="text-[11px] text-white/70 font-medium">Identity Safety</p>
                <p className="text-xs font-bold font-headline">100% Verified</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#99F6E4] shrink-0">
                <Icon name="autorenew" size={18} />
              </div>
              <div>
                <p className="text-[11px] text-white/70 font-medium">Payout Cycles</p>
                <p className="text-xs font-bold font-headline">Automated</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#FED7AA] shrink-0">
                <Icon name="payments" size={18} />
              </div>
              <div>
                <p className="text-[11px] text-white/70 font-medium">Digital Dues</p>
                <p className="text-xs font-bold font-headline">JazzCash & Banks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#FBCFE8] shrink-0">
                <Icon name="diversity_3" size={18} />
              </div>
              <div>
                <p className="text-[11px] text-white/70 font-medium">Active Members</p>
                <p className="text-xs font-bold font-headline">{committees.reduce((acc, c) => acc + (Number(c.member_count) || 1), 0)}+ Enrolled</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/*  SEARCH, CATEGORY FILTERS & CONTROLS               */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="space-y-3.5 mb-6">
          {/* Search Bar + Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <Icon
                name="search"
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by committee name, purpose, or organizer…"
                className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-gray-200 bg-white text-[#101F20] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006972]/30 focus:border-[#006972] shadow-sm transition-all text-sm sm:text-base"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>

            {/* Controls: Sort & Filter Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-9 pr-9 py-3.5 rounded-2xl border border-gray-200 bg-white text-xs sm:text-sm font-label font-bold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#006972]/30 cursor-pointer"
                >
                  <option value="newest">✨ Newest First</option>
                  <option value="lowest">💰 Lowest Contribution</option>
                  <option value="highest">🏆 Largest Total Pool</option>
                  <option value="spots">🔥 Fewest Spots Left</option>
                </select>
                <Icon name="sort" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Icon name="expand_more" size={18} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={() => setFilterAvailableOnly((prev) => !prev)}
                className={`px-3.5 py-3.5 rounded-2xl text-xs sm:text-sm font-label font-bold flex items-center gap-1.5 border shadow-sm transition-all cursor-pointer shrink-0 ${
                  filterAvailableOnly
                    ? 'bg-[#006972] text-white border-[#006972]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
                title="Toggle only pools with open slots"
              >
                <Icon name={filterAvailableOnly ? 'check_circle' : 'filter_list'} size={18} />
                <span className="hidden sm:inline">Open Spots Only</span>
                <span className="sm:hidden">Open</span>
              </button>
            </div>
          </div>

          {/* Category Chips Horizontal Scrolling */}
          <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar items-center">
            {CATEGORIES.map((cat) => {
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-label font-bold transition-all cursor-pointer active:scale-95 ${
                    active
                      ? 'bg-gradient-to-r from-[#006972] to-[#004f56] text-white shadow-md shadow-[#006972]/20 border-2 border-[#006972]'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-[#006972]/40 hover:bg-[#006972]/5'
                  }`}
                >
                  <Icon
                    name={cat.icon}
                    size={18}
                    className={active ? 'text-[#FFE082]' : 'text-gray-500'}
                  />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <Icon name="error" size={22} className="text-rose-600 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
              <Icon name="close" size={18} />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/*  PUBLIC COMMITTEES LISTING GRID                    */}
        {/* ══════════════════════════════════════════════════ */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="w-24 h-6 rounded-full bg-gray-200" />
                  <div className="w-16 h-6 rounded-full bg-gray-200" />
                </div>
                <div className="space-y-2">
                  <div className="w-3/4 h-5 rounded-full bg-gray-200" />
                  <div className="w-1/2 h-3.5 rounded-full bg-gray-200" />
                </div>
                <div className="p-4 rounded-2xl bg-gray-100 h-24" />
                <div className="w-full h-2.5 rounded-full bg-gray-200" />
                <div className="flex gap-2">
                  <div className="w-1/3 h-10 rounded-2xl bg-gray-200" />
                  <div className="w-2/3 h-10 rounded-2xl bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedCommittees.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-[#006972]/10 to-[#006972]/20 flex items-center justify-center text-[#006972] border border-[#006972]/15 shadow-inner">
              <Icon name="search_off" size={40} />
            </div>
            <h3 className="text-xl font-headline font-bold text-deep-navy mb-2">No matching public pools found</h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
              {search || category || filterAvailableOnly
                ? "Try clearing your filters or changing your search criteria to discover more pools."
                : "Be the pioneer! Create the very first public savings committee and invite trusted members to join."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {(search || category || filterAvailableOnly) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setCategory('');
                    setFilterAvailableOnly(false);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-label font-bold text-sm cursor-pointer transition-colors"
                >
                  Reset Filters
                </button>
              )}
              <Button onClick={() => navigate('/committee/create')}>
                Create a Public Pool
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedCommittees.map((c) => {
              const catMeta = getCategoryMeta(c.category);
              const intervalMeta = getIntervalDisplay(c.interval_type);
              const turnMeta = getTurnMethodDisplay(c.turn_selection_method);
              const memberCount = Number(c.member_count) || 1;
              const capacity = Number(c.capacity) || 1;
              const spotsLeft = Math.max(0, capacity - memberCount);
              const isFull = spotsLeft === 0;
              const fillPercentage = Math.min(100, Math.round((memberCount / capacity) * 100));
              const contributionNum = Number(c.contribution_amount) || 0;
              const totalPoolPot = contributionNum * capacity;
              const isJoining = joiningId === c.id;
              const isCopied = copiedId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCommittee(c)}
                  className="group bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/90 shadow-sm hover:shadow-xl hover:border-[#006972]/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
                >
                  {/* Top category & spot badges */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-label font-bold border ${catMeta.bg} ${catMeta.text} ${catMeta.border}`}>
                        <Icon name={catMeta.icon} size={14} />
                        <span>{catMeta.label}</span>
                      </span>

                      {/* Spot Urgency Pill */}
                      {isFull ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-label font-bold bg-gray-100 text-gray-600 border border-gray-200">
                          Pool Full
                        </span>
                      ) : spotsLeft <= 2 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-label font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 animate-pulse">
                          <Icon name="local_fire_department" size={13} className="text-amber-600" />
                          <span>{spotsLeft} spot{spotsLeft > 1 ? 's' : ''} left</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-label font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Icon name="check_circle" size={13} className="text-emerald-600" />
                          <span>{spotsLeft} open spots</span>
                        </span>
                      )}
                    </div>

                    {/* Committee Title & Organizer */}
                    <div className="mb-3.5">
                      <h3 className="font-headline text-lg sm:text-[19px] font-bold text-[#0D1B2A] group-hover:text-[#006972] transition-colors leading-snug line-clamp-1">
                        {c.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <div className="w-5 h-5 rounded-full bg-[#006972]/10 text-[#006972] flex items-center justify-center font-bold text-[10px]">
                          {(c.organizer_name || 'O').charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate font-medium">by {c.organizer_name || 'Verified Member'}</span>
                        {c.organizer_cnic_status === 'verified' && (
                          <span className="inline-flex items-center text-emerald-600" title="CNIC Verified Organizer">
                            <Icon name="verified" size={14} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description preview */}
                    {c.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-4 font-body leading-relaxed">
                        {c.description}
                      </p>
                    )}

                    {/* Financial Highlight Card */}
                    <div className="bg-gradient-to-br from-[#F4F9F9] to-[#E9F3F4] rounded-2xl p-3.5 mb-4 border border-[#006972]/10">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-xs text-gray-500 font-medium">Monthly Dues</span>
                        <span className="text-xs text-gray-500 font-medium">Total Pool Pot</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div className="font-headline font-extrabold text-[#006972] text-base sm:text-lg">
                          {formatCurrency(c.contribution_amount)}
                          <span className="text-xs font-normal text-gray-500">/{c.interval_type === 'weekly' ? 'wk' : 'mo'}</span>
                        </div>
                        <div className="font-headline font-extrabold text-[#0D1B2A] text-base sm:text-lg">
                          {formatCurrency(totalPoolPot)}
                        </div>
                      </div>
                    </div>

                    {/* Member Slots Progress Bar */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-xs font-semibold text-gray-600">
                        <span className="flex items-center gap-1">
                          <Icon name="group" size={14} className="text-[#006972]" />
                          <span>{memberCount} of {capacity} Members</span>
                        </span>
                        <span className="text-[#006972]">{fillPercentage}% Filled</span>
                      </div>
                      
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#006972] to-[#22D3EE] transition-all duration-500"
                          style={{ width: `${fillPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Feature Chips */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium">
                        <Icon name={intervalMeta.icon} size={14} className="text-gray-500" />
                        <span>{intervalMeta.text}</span>
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border ${turnMeta.color}`}>
                        <Icon name={turnMeta.icon} size={14} />
                        <span>{turnMeta.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCommittee(c);
                      }}
                      className="px-3 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-label font-bold transition-colors cursor-pointer"
                      title="Quick View Details"
                    >
                      Details
                    </button>

                    <button
                      onClick={(e) => handleShare(e, c)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                          : 'bg-white hover:bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                      title={isCopied ? 'Invite link copied!' : 'Share pool link'}
                    >
                      <Icon name={isCopied ? 'check' : 'share'} size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoin(c);
                      }}
                      disabled={isJoining || isFull}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-label font-bold transition-all shadow-sm cursor-pointer ${
                        isFull
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-[#006972] to-[#00575f] hover:from-[#00575f] hover:to-[#00474e] text-white active:scale-95 shadow-[#006972]/20'
                      }`}
                    >
                      {isJoining ? (
                        <>
                          <Icon name="progress_activity" size={16} className="animate-spin" />
                          <span>Requesting…</span>
                        </>
                      ) : isFull ? (
                        <span>Pool Full</span>
                      ) : (
                        <>
                          <Icon name="person_add" size={16} />
                          <span>Request to Join</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════ */}
      {/*  COMMITTEE DETAIL PREVIEW MODAL                    */}
      {/* ══════════════════════════════════════════════════ */}
      {selectedCommittee && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setSelectedCommittee(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0">
                  <Icon name={getCategoryMeta(selectedCommittee.category).icon} size={26} />
                </div>
                <div>
                  <span className="text-xs font-label font-bold text-[#006972] uppercase tracking-wider">
                    {getCategoryMeta(selectedCommittee.category).label}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-headline font-bold text-deep-navy">
                    {selectedCommittee.name}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedCommittee(null)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Organizer Credibility Banner */}
            <div className="p-4 rounded-2xl bg-[#F7F9FA] border border-gray-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#006972] text-white flex items-center justify-center font-bold">
                  {(selectedCommittee.organizer_name || 'O').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Pool Organizer</p>
                  <p className="text-sm font-bold text-deep-navy flex items-center gap-1.5">
                    {selectedCommittee.organizer_name || 'Community Leader'}
                    {selectedCommittee.organizer_cnic_status === 'verified' && (
                      <span className="inline-flex items-center text-emerald-600 text-xs font-semibold">
                        <Icon name="verified" size={14} className="mr-0.5" /> Verified
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-label font-bold bg-[#006972]/10 text-[#006972]">
                  Public Pool
                </span>
                {selectedCommittee.organizer_id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReportTarget({ id: selectedCommittee.organizer_id, name: selectedCommittee.organizer_name || 'Organizer' });
                    }}
                    title="Report organizer"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-200/60 transition-colors cursor-pointer"
                  >
                    <Icon name="flag" size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            {selectedCommittee.description && (
              <div>
                <h4 className="text-xs font-label font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  About this Committee
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed font-body">
                  {selectedCommittee.description}
                </p>
              </div>
            )}

            {/* Key Financial Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 text-center">
                <p className="text-xs text-gray-500 font-medium mb-0.5">Contribution</p>
                <p className="font-headline font-bold text-sm text-[#006972]">
                  {formatCurrency(selectedCommittee.contribution_amount)}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 text-center">
                <p className="text-xs text-gray-500 font-medium mb-0.5">Total Pot</p>
                <p className="font-headline font-bold text-sm text-deep-navy">
                  {formatCurrency(Number(selectedCommittee.contribution_amount || 0) * Number(selectedCommittee.capacity || 1))}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 text-center">
                <p className="text-xs text-gray-500 font-medium mb-0.5">Frequency</p>
                <p className="font-headline font-bold text-sm text-deep-navy capitalize">
                  {selectedCommittee.interval_type || 'Monthly'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 text-center">
                <p className="text-xs text-gray-500 font-medium mb-0.5">Capacity</p>
                <p className="font-headline font-bold text-sm text-deep-navy">
                  {selectedCommittee.member_count || 1}/{selectedCommittee.capacity}
                </p>
              </div>
            </div>

            {/* Turn Allocation & Rules */}
            <div className="p-4 rounded-2xl bg-[#006972]/5 border border-[#006972]/15 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#006972] uppercase tracking-wide">
                <Icon name="info" size={16} />
                <span>Turn Allocation & Payment Terms</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
                <li>Payout turns are managed via <strong>{getTurnMethodDisplay(selectedCommittee.turn_selection_method).label}</strong>.</li>
                <li>Digital payments supported: JazzCash, EasyPaisa, or Direct Bank Transfer.</li>
                <li>Requires verified CNIC before any member payout release.</li>
              </ul>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedCommittee(null)}
                className="px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-label font-bold text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
              <Button
                fullWidth
                onClick={() => {
                  const target = selectedCommittee;
                  setSelectedCommittee(null);
                  handleJoin(target);
                }}
                disabled={joiningId === selectedCommittee.id || Number(selectedCommittee.member_count) >= Number(selectedCommittee.capacity)}
                icon={joiningId === selectedCommittee.id ? 'progress_activity' : 'person_add'}
              >
                {joiningId === selectedCommittee.id ? 'Requesting…' : 'Request to Join this Pool'}
              </Button>
            </div>
          </div>
        </div>
      )}


      <CnicVerificationModal
        isOpen={showCnicModal}
        onClose={() => setShowCnicModal(false)}
        onVerified={() => {
          setCnicStatus('verified');
          setShowCnicModal(false);
          loadCommittees();
        }}
      />

      {reportTarget && (
        <ReportUserModal
          isOpen={true}
          targetUser={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}
