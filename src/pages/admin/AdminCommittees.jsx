import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import AdminMobileNav from '../../components/AdminMobileNav';
import { getCommittees, freezeCommittee, unfreezeCommittee } from '../../services/adminService';
import { logout } from '../../services/authService';

const GLASS_CARD = 'bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_rgba(0,105,114,0.08)]';

/* ── Skeleton Helper ── */
function Bone({ className = '' }) {
  return <div className={`skeleton-bone ${className}`} />;
}

export default function AdminCommittees() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [committees, setCommittees] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, FROZEN, COMPLETED
  const [searchQuery, setSearchQuery] = useState('');

  /* Freeze Modal State */
  const [selectedCommittee, setSelectedCommittee] = useState(null);
  const [freezeNotes, setFreezeNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      // ignore
    } finally {
      navigate('/login');
    }
  }

  async function loadCommitteesData() {
    try {
      setLoading(true);
      setLoadError('');
      const data = await getCommittees({ search: searchQuery });
      const list = data?.committees || data || [];

      setCommittees(list);
    } catch (err) {
      setLoadError(err.message || 'Failed to load committees list.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommitteesData();
  }, []);

  /* Filter Committees */
  const filteredCommittees = committees.filter((c) => {
    if (activeTab === 'ACTIVE') return !c.is_frozen && c.status !== 'completed';
    if (activeTab === 'FROZEN') return c.is_frozen;
    if (activeTab === 'COMPLETED') return c.status === 'completed';

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.organizer_name || '').toLowerCase().includes(q) ||
        (c.invite_code || '').toLowerCase().includes(q) ||
        (c.id || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleToggleFreeze() {
    if (!selectedCommittee || processingAction) return;
    setProcessingAction(true);
    try {
      if (selectedCommittee.is_frozen) {
        await unfreezeCommittee(selectedCommittee.id);
        showToast(`Unfrozen committee pool ${selectedCommittee.name}`);
      } else {
        await freezeCommittee(selectedCommittee.id, { notes: freezeNotes });
        showToast(`Frozen committee pool ${selectedCommittee.name}`);
      }

      setCommittees((prev) =>
        prev.map((c) =>
          c.id === selectedCommittee.id
            ? { ...c, is_frozen: !c.is_frozen, status: !c.is_frozen ? 'frozen' : 'active' }
            : c
        )
      );
      setSelectedCommittee(null);
      setFreezeNotes('');
    } catch (err) {
      showToast(err.message || 'Failed to update committee status.');
    } finally {
      setProcessingAction(false);
    }
  }

  const adminNavItems = [
    { label: 'Overview', icon: 'dashboard', path: '/admin' },
    { label: 'Analytics', icon: 'bar_chart', path: '/admin/analytics' },
    { label: 'Users', icon: 'group', path: '/admin/users' },
    { label: 'Committees', icon: 'groups', path: '/admin/committees' },
    { label: 'Disputes', icon: 'gavel', path: '/admin/disputes' },
    { label: 'CNIC Verification', icon: 'badge', path: '/admin/cnic-verification' },
    { label: 'Broadcasts', icon: 'campaign', path: '/admin/announcements' },
    { label: 'Audit Log', icon: 'history', path: '/admin/activity' },
    { label: 'Settings', icon: 'settings', path: '/admin/settings' },
  ];

  return (
    <AuthAmbientBackground showTicker={false}>
      <div className="min-h-screen flex flex-col md:flex-row w-full max-w-7xl mx-auto">

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col gap-6 p-5 my-6 ml-4 bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(0,105,114,0.12)]">
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#006972] to-[#004f56] text-white flex items-center justify-center font-bold font-headline text-[16px] shadow-md">
              SA
            </div>
            <div>
              <h2 className="font-headline text-[15px] font-bold text-deep-navy leading-tight">Sanjhi Admin</h2>
              <p className="font-label text-[10px] text-[#006972] font-semibold">Pools Oversight</p>
            </div>
          </div>

          <hr className="border-slate-200/60" />

          <nav className="flex flex-col gap-1">
            {adminNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-label text-[13px] font-bold transition-all cursor-pointer border-none text-left ${
                    isActive
                      ? 'bg-[#006972] text-white shadow-md shadow-[#006972]/20'
                      : 'text-deep-navy/70 hover:bg-white/80 hover:text-deep-navy'
                  }`}
                >
                  <Icon name={item.icon} size={20} className={isActive ? 'text-white' : 'text-[#006972]'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-slate-200/60">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-label text-[12px] font-bold transition-all cursor-pointer border border-rose-200/80 shadow-sm"
            >
              <Icon name="logout" size={16} />
              <span>Logout Staff Account</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-6 min-w-0 pb-28 md:pb-12">

          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shadow-sm">
                  <Icon name="groups" size={20} />
                </span>
                <h1 className="font-headline text-[22px] sm:text-[26px] font-bold text-deep-navy">
                  Committee Pool Oversight
                </h1>
              </div>
              <p className="font-label text-[11px] sm:text-[12px] text-on-surface-variant font-medium mt-1">
                Monitor circulating ROSCA pools, turn ledgers, and governance actions
              </p>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#006972]">
                <Icon name="search" size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pool name, organizer, code..."
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 text-deep-navy font-body text-[13px] placeholder:text-slate-400 outline-none focus:border-[#006972] focus:bg-white transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
          </header>

          {/* Filter Chips */}
          <section className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Pools', count: committees.length, icon: 'apps' },
              { id: 'ACTIVE', label: 'Active & Rotating', count: committees.filter((c) => !c.is_frozen && c.status !== 'completed').length, icon: 'check_circle' },
              { id: 'FROZEN', label: 'Frozen / Flagged', count: committees.filter((c) => c.is_frozen).length, icon: 'lock' },
              { id: 'COMPLETED', label: 'Completed', count: committees.filter((c) => c.status === 'completed').length, icon: 'task_alt' },
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
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </section>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {[1, 2, 3, 4].map((i) => (
                <Bone key={i} className="w-full h-48 rounded-3xl" />
              ))}
            </div>
          ) : loadError ? (
            <div className={`${GLASS_CARD} rounded-3xl p-8 text-center space-y-3`}>
              <div className="w-14 h-14 rounded-3xl bg-rose-50/90 text-rose-600 flex items-center justify-center mx-auto border border-rose-200/80 shadow-sm">
                <Icon name="error" size={28} />
              </div>
              <h2 className="font-headline text-[18px] font-bold text-deep-navy">Couldn't load committees</h2>
              <p className="font-body text-[13px] text-on-surface-variant max-w-xs mx-auto">{loadError}</p>
              <button
                onClick={loadCommitteesData}
                className="px-6 py-2.5 rounded-2xl bg-[#006972] text-white font-label text-[13px] font-bold cursor-pointer border-none shadow-md"
              >
                Retry
              </button>
            </div>
          ) : (
            /* Committees Grid Cards */
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCommittees.length === 0 ? (
                <div className="col-span-1 md:col-span-2 py-12 text-center space-y-2 bg-white/50 rounded-3xl border border-white/80">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Icon name="groups_off" size={24} />
                  </div>
                  <p className="font-headline text-[16px] font-bold text-deep-navy">No committee pools found</p>
                  <p className="font-body text-[12px] text-on-surface-variant">Try selecting a different filter tab or clearing search.</p>
                </div>
              ) : (
                filteredCommittees.map((c) => {
                  const isFrozen = c.is_frozen;
                  const contrib = parseFloat(c.contribution_amount || c.contributionAmount) || 0;
                  const capacity = parseInt(c.capacity, 10) || 0;
                  const memberCount = parseInt(c.member_count || c.memberCount, 10) || 1;
                  const totalPool = contrib * capacity;

                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/admin/committees/${c.id}`)}
                      className={`${GLASS_CARD} rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between gap-4 transition-all hover:shadow-[0_12px_40px_rgba(0,105,114,0.18)] hover:-translate-y-0.5 cursor-pointer border border-white/90 ${
                        isFrozen ? 'border-rose-300 bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Top Bar Accent */}
                      <div className={`h-1.5 absolute top-0 inset-x-0 ${isFrozen ? 'bg-rose-500' : 'bg-[#006972]'}`} />

                      <div className="space-y-3 pt-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-headline text-[18px] font-bold text-deep-navy truncate">{c.name}</h3>
                            <p className="font-body text-[12px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                              <Icon name="person" size={14} className="text-[#006972]" /> Host: <strong>{c.organizer_name || 'Organizer'}</strong>
                            </p>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full font-label text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                            isFrozen
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {isFrozen ? 'Frozen' : 'Active'}
                          </span>
                        </div>

                        {/* Financial Metrics Box */}
                        <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-white/70 border border-white/90 shadow-sm">
                          <div>
                            <p className="font-label text-[9px] uppercase font-bold text-on-surface-variant">Monthly Contribution</p>
                            <p className="font-headline text-[15px] font-bold text-deep-navy">Rs. {contrib.toLocaleString('en-PK')}</p>
                          </div>
                          <div>
                            <p className="font-label text-[9px] uppercase font-bold text-on-surface-variant">Total Pool Value</p>
                            <p className="font-headline text-[15px] font-bold text-[#006972]">Rs. {totalPool.toLocaleString('en-PK')}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between font-label text-[11px] text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <Icon name="group" size={14} className="text-[#006972]" /> Capacity: <strong>{memberCount} / {capacity} Members</strong>
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {c.invite_code || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/committees/${c.id}`); }}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#006972] to-[#007a82] hover:from-[#00575f] hover:to-[#006972] text-white font-label text-[12px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border-none shadow-sm"
                        >
                          <span>Inspect Ledger</span>
                          <Icon name="arrow_forward" size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCommittee(c);
                          }}
                          className={`py-2.5 px-3 rounded-xl font-label text-[12px] font-bold flex items-center gap-1 transition-all cursor-pointer border shadow-sm ${
                            isFrozen
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          }`}
                        >
                          <Icon name={isFrozen ? 'lock_open' : 'lock'} size={14} />
                          <span>{isFrozen ? 'Unfreeze' : 'Freeze'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          )}
        </main>
      </div>

      {/* ── FREEZE / UNFREEZE POOL MODAL ── */}
      {selectedCommittee && (
        <div className="fixed inset-0 z-50 bg-deep-navy/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className={`${GLASS_CARD} rounded-3xl p-6 max-w-md w-full space-y-5 relative`}>
            <button
              onClick={() => setSelectedCommittee(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center border-none cursor-pointer"
            >
              <Icon name="close" size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                selectedCommittee.is_frozen ? 'bg-emerald-600' : 'bg-rose-600'
              }`}>
                <Icon name={selectedCommittee.is_frozen ? 'lock_open' : 'lock'} size={24} />
              </div>

              <div>
                <h3 className="font-headline text-[17px] font-bold text-deep-navy">{selectedCommittee.name}</h3>
                <p className="font-body text-[12px] text-on-surface-variant">Host: {selectedCommittee.organizer_name || 'Organizer'}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block font-label text-[11px] font-bold text-deep-navy">
                Staff Governance Notes
              </label>
              <textarea
                value={freezeNotes}
                onChange={(e) => setFreezeNotes(e.target.value)}
                placeholder="Reason for freezing or unfreezing this committee pool..."
                rows={2}
                className="w-full p-3 rounded-2xl bg-white/80 border border-slate-200 font-body text-[13px] text-deep-navy outline-none focus:border-[#006972]"
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setSelectedCommittee(null)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-label text-[13px] font-bold border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleFreeze}
                  disabled={processingAction}
                  className={`flex-1 py-3 rounded-2xl font-label text-[13px] font-bold text-white transition-all cursor-pointer border-none shadow-md ${
                    selectedCommittee.is_frozen
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {processingAction
                    ? 'Processing...'
                    : selectedCommittee.is_frozen
                    ? 'Unfreeze Pool'
                    : 'Freeze Pool'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-4 left-4 sm:left-auto sm:right-5 sm:w-80 z-50 px-4 py-3 rounded-2xl shadow-2xl font-label text-[13px] font-bold flex items-center gap-2.5 border border-white/20 bg-[#006972] text-white">
          <Icon name="check_circle" size={18} className="shrink-0 text-emerald-300" />
          <span className="flex-1">{toastMessage}</span>
        </div>
      )}

      {/* Floating Glass Bottom Navbar for Mobile */}
      <AdminMobileNav />
    </AuthAmbientBackground>
  );
}
