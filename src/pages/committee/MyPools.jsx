import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import { useNavDrawer } from '../../context/NavDrawerContext';
import { getMyCommittees, joinByCode } from '../../services/committeeService';

const GLASS_CARD = 'bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,105,114,0.12)]';

/* ── Skeleton Bone Helper ── */
function Bone({ className = '' }) {
  return <span className={`skeleton-bone inline-block ${className}`} />;
}

export default function MyPools() {
  const navigate = useNavigate();
  const { openDrawer } = useNavDrawer();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [committees, setCommittees] = useState([]);

  /* Filters & Search */
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ORGANIZER, MEMBER, COMPLETED
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, amount, turn

  /* Join Code Modal */
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  /* Toast Notification */
  const [toastMessage, setToastMessage] = useState('');

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }

  /* Fetch user's committees */
  useEffect(() => {
    let cancelled = false;

    async function loadPools() {
      try {
        setLoading(true);
        setLoadError('');
        const data = await getMyCommittees();
        if (cancelled) return;
        setCommittees(data?.committees || data || []);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Failed to load your committee pools.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPools();
    return () => { cancelled = true; };
  }, []);

  /* Filtered & Sorted Pools */
  const filteredPools = useMemo(() => {
    let list = [...committees];

    // Filter by Role / Tab
    if (activeTab === 'ORGANIZER') {
      list = list.filter((c) => c.userRole === 'Organizer' || c.userRole === 'Co-Organizer' || c.my_role === 'organizer' || c.my_role === 'co_organizer');
    } else if (activeTab === 'MEMBER') {
      list = list.filter((c) => c.userRole === 'Member' || c.my_role === 'participant');
    } else if (activeTab === 'COMPLETED') {
      list = list.filter((c) => c.status === 'completed');
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => (c.name || '').toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q));
    }

    // Sorting
    if (sortBy === 'amount') {
      list.sort((a, b) => (parseFloat(b.contributionAmount || b.contribution_amount) || 0) - (parseFloat(a.contributionAmount || a.contribution_amount) || 0));
    } else if (sortBy === 'turn') {
      list.sort((a, b) => (a.my_turn || 99) - (b.my_turn || 99));
    }

    return list;
  }, [committees, activeTab, searchQuery, sortBy]);

  /* Total Stats Summary */
  const stats = useMemo(() => {
    const totalActive = committees.filter((c) => c.status !== 'completed').length;
    const totalContribution = committees.reduce((sum, c) => sum + (parseFloat(c.contributionAmount || c.contribution_amount) || 0), 0);
    const totalPoolValue = committees.reduce((sum, c) => {
      const amount = parseFloat(c.contributionAmount || c.contribution_amount) || 0;
      const capacity = parseInt(c.capacity, 10) || 0;
      return sum + amount * capacity;
    }, 0);
    return { totalActive, totalContribution, totalPoolValue };
  }, [committees]);

  /* Handle Join Code Submission */
  async function handleJoinSubmit(e) {
    e.preventDefault();
    if (!inviteCode.trim() || joining) return;
    setJoining(true);
    setJoinError('');
    try {
      const res = await joinByCode(inviteCode.trim().toUpperCase());
      setShowJoinModal(false);
      setInviteCode('');
      showToast('Join request submitted successfully!');
      if (res?.committee_id) {
        navigate(`/committee/${res.committee_id}`);
      }
    } catch (err) {
      setJoinError(err.message || 'Invalid or expired invite code.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <AuthAmbientBackground showTicker={false}>
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col min-h-[calc(100vh-36px)] gap-5 pb-28 md:pb-12">

        {/* Top Header */}
        {/* Top Header (Responsive Mobile / Desktop) */}
        <header className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              aria-label="Go to Dashboard"
              className="w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-[#006972] transition-all cursor-pointer active:scale-90 border border-white/80 shadow-sm shrink-0"
            >
              <Icon name="arrow_back" size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="font-headline text-[16px] sm:text-[24px] font-bold text-deep-navy tracking-tight truncate leading-tight">
                My Committee Pools
              </h1>
              <p className="font-label text-[10.5px] sm:text-[11px] text-on-surface-variant font-medium truncate">
                Manage your active, hosting, and member pools
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-white/80 hover:bg-white text-[#006972] font-label text-[11px] sm:text-[12px] font-bold transition-all cursor-pointer border border-[#006972]/15 shadow-sm flex items-center gap-1 active:scale-95"
              title="Join by Invite Code"
            >
              <Icon name="vpn_key" size={15} />
              <span className="hidden sm:inline">Join Code</span>
            </button>

            <button
              onClick={() => navigate('/committee/create')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#006972] to-[#007a82] hover:from-[#00575f] hover:to-[#006972] text-white font-label text-[11px] sm:text-[13px] font-bold transition-all shadow-md shadow-[#006972]/20 flex items-center gap-1 cursor-pointer border-none active:scale-95"
            >
              <Icon name="add_circle" size={16} />
              <span>Create Pool</span>
            </button>

            {/* Mobile Menu Drawer Toggle */}
            <button
              onClick={openDrawer}
              className="md:hidden w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl sm:rounded-2xl bg-white/80 hover:bg-white text-[#006972] border border-[#006972]/15 shadow-sm transition-all active:scale-95 cursor-pointer"
              aria-label="Open Navigation Menu"
              title="Open Menu"
            >
              <Icon name="menu" size={18} />
            </button>
          </div>
        </header>

        {loading ? (
          /* Skeleton Loader Screen */
          <div className="space-y-5 w-full">
            <div className="grid grid-cols-3 gap-3">
              <Bone className="w-full h-24 rounded-3xl" />
              <Bone className="w-full h-24 rounded-3xl" />
              <Bone className="w-full h-24 rounded-3xl" />
            </div>

            <div className="flex gap-2">
              <Bone className="w-28 h-10 rounded-full" />
              <Bone className="w-32 h-10 rounded-full" />
              <Bone className="w-32 h-10 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`${GLASS_CARD} rounded-3xl p-5 space-y-4`}>
                  <div className="flex justify-between items-center">
                    <Bone className="w-36 h-5 rounded-lg" />
                    <Bone className="w-20 h-5 rounded-full" />
                  </div>
                  <Bone className="w-full h-12 rounded-2xl" />
                  <Bone className="w-full h-3 rounded-full" />
                  <div className="flex justify-between">
                    <Bone className="w-24 h-4 rounded-lg" />
                    <Bone className="w-24 h-4 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : loadError ? (
          <div className={`${GLASS_CARD} rounded-3xl p-8 text-center space-y-3`}>
            <div className="w-14 h-14 rounded-3xl bg-rose-50/90 text-rose-600 flex items-center justify-center mx-auto border border-rose-200/80 shadow-sm">
              <Icon name="error" size={28} />
            </div>
            <h2 className="font-headline text-[18px] font-bold text-deep-navy">Couldn't load pools</h2>
            <p className="font-body text-[13px] text-on-surface-variant max-w-xs mx-auto">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-2xl bg-[#006972] text-white font-label text-[13px] font-bold cursor-pointer border-none"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Top Stats Hero Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-[#006972] via-[#007a82] to-[#005f66] rounded-3xl p-4 sm:p-5 relative overflow-hidden border border-[#006972]/30 shadow-[0_12px_36px_rgba(0,105,114,0.25)]">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/15 rounded-full blur-2xl pointer-events-none" />
                <p className="font-label text-[10px] text-white/75 uppercase tracking-widest font-semibold flex items-center gap-1">
                  <Icon name="groups" size={13} className="text-emerald-300" /> Active Pools
                </p>
                <p className="font-headline text-[30px] sm:text-[34px] font-bold text-white leading-none tabular-nums mt-1">
                  {stats.totalActive}
                </p>
                <p className="font-label text-[10px] text-white/80 pt-1.5">Joined & Organized</p>
              </div>

              <div className={`${GLASS_CARD} rounded-3xl p-4 sm:p-5 relative overflow-hidden`}>
                <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold flex items-center gap-1">
                  <Icon name="savings" size={13} className="text-[#006972]" /> Monthly Contribution
                </p>
                <p className="font-headline text-[26px] sm:text-[30px] font-bold text-[#006972] leading-none tabular-nums mt-1">
                  Rs. {stats.totalContribution.toLocaleString('en-PK')}
                </p>
                <p className="font-label text-[10px] text-on-surface-variant pt-1.5">Across all active pools</p>
              </div>

              <div className={`${GLASS_CARD} rounded-3xl p-4 sm:p-5 relative overflow-hidden`}>
                <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold flex items-center gap-1">
                  <Icon name="account_balance" size={13} className="text-amber-600" /> Total Pool Value
                </p>
                <p className="font-headline text-[26px] sm:text-[30px] font-bold text-deep-navy leading-none tabular-nums mt-1">
                  Rs. {stats.totalPoolValue.toLocaleString('en-PK')}
                </p>
                <p className="font-label text-[10px] text-on-surface-variant pt-1.5">Combined cycle rotation</p>
              </div>
            </section>

            {/* Filter Tabs & Search Bar */}
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Role Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'ALL', label: 'All Pools', icon: 'apps' },
                    { id: 'ORGANIZER', label: 'Hosting (Organizer)', icon: 'workspace_premium' },
                    { id: 'MEMBER', label: 'Participating', icon: 'person' },
                    { id: 'COMPLETED', label: 'Completed', icon: 'task_alt' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-full font-label text-[12px] font-bold transition-all cursor-pointer border shrink-0 flex items-center gap-1.5 ${
                        activeTab === tab.id
                          ? 'bg-[#006972] text-white border-[#006972] shadow-md shadow-[#006972]/20'
                          : 'bg-white/60 hover:bg-white text-deep-navy/70 border-white/80'
                      }`}
                    >
                      <Icon name={tab.icon} size={14} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 rounded-full bg-white/70 border border-white/80 text-deep-navy font-label text-[11px] font-bold outline-none cursor-pointer"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="amount">Sort: Highest Contribution</option>
                    <option value="turn">Sort: Earliest Turn</option>
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#006972]">
                  <Icon name="search" size={18} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search committees by pool name or invite code..."
                  className="block w-full pl-11 pr-4 py-2.5 border border-white/80 rounded-2xl bg-white/70 backdrop-blur-xl focus:border-[#006972] focus:bg-white focus:ring-4 focus:ring-[#006972]/8 outline-none transition-all text-deep-navy font-body text-[13px] placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>
            </section>

            {/* Pools Grid */}
            <section className="space-y-4">
              {filteredPools.length === 0 ? (
                <div className={`${GLASS_CARD} rounded-3xl p-8 text-center space-y-3`}>
                  <div className="w-14 h-14 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center mx-auto border border-[#006972]/15">
                    <Icon name="group_add" size={28} />
                  </div>
                  <h3 className="font-headline text-[18px] font-bold text-deep-navy">
                    {searchQuery ? 'No matching pools found' : 'No committee pools yet'}
                  </h3>
                  <p className="font-body text-[13px] text-on-surface-variant max-w-sm mx-auto">
                    {searchQuery
                      ? 'Try adjusting your search query or tab filters.'
                      : 'You can create a new committee pool with custom rules, or join an existing pool with an invite code.'}
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => navigate('/committee/create')}
                      className="px-5 py-2.5 rounded-2xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[13px] font-bold cursor-pointer border-none shadow-md"
                    >
                      Create Pool
                    </button>
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className="px-5 py-2.5 rounded-2xl bg-white/80 hover:bg-white text-[#006972] font-label text-[13px] font-bold cursor-pointer border border-white/80 shadow-sm"
                    >
                      Join Pool
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPools.map((c) => {
                    const role = c.userRole || c.my_role || 'Member';
                    const isOrganizer = role === 'Organizer' || role === 'organizer';
                    const isCoOrganizer = role === 'Co-Organizer' || role === 'co_organizer';

                    const contrib = parseFloat(c.contributionAmount || c.contribution_amount) || 0;
                    const capacity = parseInt(c.capacity, 10) || 0;
                    const memberCount = parseInt(c.memberCount || c.member_count, 10) || 1;
                    const totalPool = contrib * capacity;
                    const filledPct = capacity > 0 ? Math.min(100, Math.round((memberCount / capacity) * 100)) : 0;

                    return (
                      <div
                        key={c.id}
                        className={`${GLASS_CARD} rounded-3xl p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between gap-4 transition-all hover:shadow-[0_12px_40px_rgba(0,105,114,0.18)] hover:-translate-y-0.5 border border-white/90`}
                      >
                        {/* Top Accent Strip */}
                        <div className={`h-1.5 absolute top-0 inset-x-0 ${
                          isOrganizer
                            ? 'bg-[#006972]'
                            : isCoOrganizer
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                        }`} />

                        <div className="space-y-3 pt-1">
                          {/* Title & Badges */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-headline text-[18px] sm:text-[20px] font-bold text-deep-navy truncate">
                                {c.name}
                              </h3>
                              <p className="font-body text-[12px] text-on-surface-variant mt-0.5 flex items-center gap-1.5">
                                <Icon name="event" size={13} className="text-[#006972]" />
                                {c.intervalType === '15_days' ? 'Bi-weekly Rotation' : 'Monthly Rotation'}
                              </p>
                            </div>

                            {/* Role Badge */}
                            <span className={`px-2.5 py-1 rounded-full font-label text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                              isOrganizer
                                ? 'bg-[#006972]/10 text-[#006972] border-[#006972]/20'
                                : isCoOrganizer
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {role}
                            </span>
                          </div>

                          {/* Pool Metrics Grid */}
                          <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-white/60 border border-white/80 shadow-sm">
                            <div>
                              <p className="font-label text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Per Member</p>
                              <p className="font-headline text-[15px] font-bold text-deep-navy">Rs. {contrib.toLocaleString('en-PK')}</p>
                            </div>
                            <div>
                              <p className="font-label text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Total Pool</p>
                              <p className="font-headline text-[15px] font-bold text-[#006972]">Rs. {totalPool.toLocaleString('en-PK')}</p>
                            </div>
                          </div>

                          {/* Member Progress Bar */}
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between font-label text-[11px]">
                              <span className="text-on-surface-variant font-semibold">Pool Slots ({memberCount}/{capacity})</span>
                              <span className="text-[#006972] font-bold">{filledPct}% Filled</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#006972] to-[#007a82] rounded-full transition-all duration-500"
                                style={{ width: `${filledPct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons Footer */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => navigate(`/committee/${c.id}`)}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#006972] to-[#007a82] hover:from-[#00575f] hover:to-[#006972] text-white font-label text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer border-none"
                          >
                            <span>Manage Pool</span>
                            <Icon name="arrow_forward" size={14} />
                          </button>

                          <button
                            onClick={() => navigate(`/payments/pay/${c.id}`)}
                            title="Pay Cycle Dues"
                            className="w-9 h-9 rounded-xl bg-[#006972]/10 hover:bg-[#006972] hover:text-white text-[#006972] flex items-center justify-center transition-all cursor-pointer border border-[#006972]/20 shrink-0"
                          >
                            <Icon name="payments" size={16} />
                          </button>

                          {isOrganizer && (
                            <button
                              onClick={() => navigate(`/committee/${c.id}/settings`)}
                              title="Committee Settings"
                              className="w-9 h-9 rounded-xl bg-white/70 hover:bg-white text-deep-navy flex items-center justify-center transition-all cursor-pointer border border-white/90 shadow-sm shrink-0"
                            >
                              <Icon name="settings" size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* Modal: Join Pool with Invite Code */}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/40 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/80 space-y-5 relative">
              <button
                onClick={() => setShowJoinModal(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center border-none cursor-pointer"
              >
                <Icon name="close" size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0">
                  <Icon name="vpn_key" size={24} />
                </div>
                <div>
                  <h3 className="font-headline text-[18px] font-bold text-deep-navy">Join Committee Pool</h3>
                  <p className="font-label text-[11px] text-on-surface-variant">Enter the 6-character invite code from host</p>
                </div>
              </div>

              {joinError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-label text-[12px] font-bold flex items-center gap-2">
                  <Icon name="error" size={16} />
                  <span>{joinError}</span>
                </div>
              )}

              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div>
                  <label htmlFor="inviteCode" className="block font-label text-[11px] font-bold uppercase text-deep-navy tracking-wider mb-1.5">
                    Invite Code
                  </label>
                  <input
                    id="inviteCode"
                    type="text"
                    required
                    maxLength={10}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SNJ89K"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-[18px] font-bold text-center text-[#006972] tracking-widest outline-none focus:border-[#006972] uppercase"
                  />
                </div>

                <button
                  type="submit"
                  disabled={joining}
                  className="w-full py-3.5 rounded-2xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[14px] font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer border-none disabled:opacity-60"
                >
                  {joining && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                  <Icon name="arrow_forward" size={18} />
                  Join Pool
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-24 right-4 left-4 sm:left-auto sm:right-5 sm:w-80 z-50 px-4 py-3 rounded-2xl shadow-2xl font-label text-[13px] font-bold flex items-center gap-2.5 border border-white/20 bg-[#006972] text-white">
            <Icon name="check_circle" size={18} className="shrink-0 text-emerald-300" />
            <span className="flex-1">{toastMessage}</span>
          </div>
        )}

      </div>
    </AuthAmbientBackground>
  );
}
