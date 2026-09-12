import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import AdminMobileNav from '../../components/AdminMobileNav';
import { getUsers, suspendUser, unsuspendUser } from '../../services/adminService';
import { logout } from '../../services/authService';

const GLASS_CARD = 'bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_rgba(0,105,114,0.08)]';

/* ── Skeleton Helper ── */
function Bone({ className = '' }) {
  return <span className={`skeleton-bone inline-block ${className}`} />;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [users, setUsers] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, ACTIVE, SUSPENDED
  const [searchQuery, setSearchQuery] = useState('');

  /* Selected User Modal State */
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
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

  async function loadUsersData() {
    try {
      setLoading(true);
      setLoadError('');
      const data = await getUsers({ search: searchQuery });
      const userList = data?.users || data || [];
      setUsers(userList);
    } catch (err) {
      setLoadError(err.message || 'Failed to load user records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsersData();
  }, []);

  /* Filter Users */
  const filteredUsers = users.filter((u) => {
    // Status tab filter
    if (activeFilter === 'ACTIVE') return !u.is_suspended;
    if (activeFilter === 'SUSPENDED') return u.is_suspended;
    if (activeFilter === 'CNIC_PENDING') return u.cnic_status === 'pending';
    if (activeFilter === 'CNIC_VERIFIED') return u.cnic_status === 'verified';
    if (activeFilter === 'REPORTED') return (u.reports_count || 0) > 0;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone_number || '').includes(q) ||
        (u.id || '').toLowerCase().includes(q) ||
        (u.cnic_number || '').includes(q)
      );
    }
    return true;
  });

  async function handleToggleSuspend() {
    if (!selectedUser || processingAction) return;
    setProcessingAction(true);
    try {
      if (selectedUser.is_suspended) {
        await unsuspendUser(selectedUser.id);
        showToast(`Reinstated user ${selectedUser.full_name}`);
      } else {
        await suspendUser(selectedUser.id, { notes: actionNotes });
        showToast(`Suspended user ${selectedUser.full_name}`);
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, is_suspended: !u.is_suspended } : u))
      );
      setSelectedUser(null);
      setActionNotes('');
    } catch (err) {
      showToast(err.message || 'Failed to update user status.');
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
              <p className="font-label text-[10px] text-[#006972] font-semibold">User Directory</p>
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
              <span>Logout Staff</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 p-4 sm:p-6 my-2 sm:my-4 space-y-6 pb-28 md:pb-8 max-w-full overflow-x-hidden">

          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shadow-sm">
                  <Icon name="group" size={20} />
                </span>
                <h1 className="font-headline text-[22px] sm:text-[26px] font-bold text-deep-navy">
                  User Management
                </h1>
              </div>
              <p className="font-label text-[11px] sm:text-[12px] text-on-surface-variant font-medium mt-1">
                Directory of registered members, trust health, and access controls
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
                placeholder="Search name, email, phone..."
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
              { id: 'ALL', label: 'All Users', count: users.length, icon: 'group' },
              { id: 'ACTIVE', label: 'Active Users', count: users.filter((u) => !u.is_suspended).length, icon: 'check_circle' },
              { id: 'SUSPENDED', label: 'Suspended', count: users.filter((u) => u.is_suspended).length, icon: 'block' },
              { id: 'REPORTED', label: 'Reported Users', count: users.filter((u) => (u.reports_count || 0) > 0).length, icon: 'flag' },
              { id: 'CNIC_PENDING', label: 'CNIC Pending', count: users.filter((u) => u.cnic_status === 'pending').length, icon: 'schedule' },
              { id: 'CNIC_VERIFIED', label: 'CNIC Verified', count: users.filter((u) => u.cnic_status === 'verified').length, icon: 'verified' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2 rounded-full font-label text-[12px] font-bold transition-all cursor-pointer border shrink-0 flex items-center gap-1.5 ${
                  activeFilter === tab.id
                    ? 'bg-[#006972] text-white border-[#006972] shadow-md shadow-[#006972]/20'
                    : 'bg-white/60 hover:bg-white text-deep-navy/70 border-white/80'
                }`}
              >
                <Icon name={tab.icon} size={14} />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </section>

          {loading ? (
            <div className="space-y-3 w-full">
              {[1, 2, 3, 4, 5].map((i) => (
                <Bone key={i} className="w-full h-20 rounded-2xl" />
              ))}
            </div>
          ) : loadError ? (
            <div className={`${GLASS_CARD} rounded-3xl p-8 text-center space-y-3`}>
              <div className="w-14 h-14 rounded-3xl bg-rose-50/90 text-rose-600 flex items-center justify-center mx-auto border border-rose-200/80 shadow-sm">
                <Icon name="error" size={28} />
              </div>
              <h2 className="font-headline text-[18px] font-bold text-deep-navy">Couldn't load users</h2>
              <p className="font-body text-[13px] text-on-surface-variant max-w-xs mx-auto">{loadError}</p>
              <button
                onClick={loadUsersData}
                className="px-6 py-2.5 rounded-2xl bg-[#006972] text-white font-label text-[13px] font-bold cursor-pointer border-none shadow-md"
              >
                Retry
              </button>
            </div>
          ) : (
            /* Users List Cards */
            <section className="space-y-3">
              {filteredUsers.length === 0 ? (
                <div className={`${GLASS_CARD} rounded-3xl py-12 text-center space-y-2`}>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Icon name="group_off" size={24} />
                  </div>
                  <p className="font-headline text-[16px] font-bold text-deep-navy">No users found</p>
                  <p className="font-body text-[12px] text-on-surface-variant">Try selecting a different filter or clearing search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredUsers.map((u) => {
                    const isSuspended = u.is_suspended;
                    const trustScore = u.trust_score ?? 0;

                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className={`${GLASS_CARD} rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-[0_12px_30px_rgba(0,105,114,0.14)] hover:-translate-y-0.5 cursor-pointer border border-white/90 ${
                          isSuspended ? 'border-rose-300 bg-rose-50/20' : ''
                        }`}
                      >
                        {/* Member Identity & Details */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white font-headline text-[18px] shrink-0 shadow-md ${
                            isSuspended ? 'bg-gradient-to-br from-rose-500 to-rose-700' : 'bg-gradient-to-br from-[#006972] to-[#004f56]'
                          }`}>
                            {(u.full_name || 'U').charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-headline text-[16px] font-bold text-deep-navy truncate">{u.full_name || 'Anonymous User'}</h3>
                              <span className={`px-2.5 py-0.5 rounded-full font-label text-[10px] font-bold uppercase tracking-wider border ${
                                isSuspended
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {isSuspended ? 'Suspended' : 'Active'}
                              </span>
                              {u.cnic_status === 'verified' ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-label text-[10px] font-bold flex items-center gap-0.5">
                                  <Icon name="verified" size={12} /> CNIC
                                </span>
                              ) : u.cnic_status === 'pending' ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-label text-[10px] font-bold flex items-center gap-0.5">
                                  <Icon name="schedule" size={12} /> CNIC Pending
                                </span>
                              ) : u.cnic_status === 'rejected' ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-label text-[10px] font-bold flex items-center gap-0.5">
                                  <Icon name="error" size={12} /> CNIC Rejected
                                </span>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[12px] text-on-surface-variant">
                              {u.email && (
                                <span className="flex items-center gap-1">
                                  <Icon name="mail" size={13} className="text-[#006972]" /> {u.email}
                                </span>
                              )}
                              {u.phone_number && (
                                <span className="flex items-center gap-1">
                                  <Icon name="phone" size={13} className="text-[#006972]" /> {u.phone_number}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Metrics & Quick Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-xl bg-teal-50 text-[#006972] font-label text-[11px] font-bold border border-teal-100 flex items-center gap-1">
                              <Icon name="shield" size={13} /> Score {trustScore}
                            </span>
                            <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-label text-[11px] font-bold flex items-center gap-1">
                              <Icon name="groups" size={13} /> {u.committees_count || 0} Pools
                            </span>
                            {(u.reports_count || 0) > 0 && (
                              <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 font-label text-[11px] font-bold border border-rose-100 flex items-center gap-1">
                                <Icon name="flag" size={13} /> {u.reports_count} Reports
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(u);
                            }}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-[#006972] hover:text-white text-slate-600 transition-all border-none cursor-pointer"
                          >
                            <Icon name="chevron_right" size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* ── USER INSPECT & ACCESS CONTROL MODAL ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-deep-navy/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className={`${GLASS_CARD} rounded-3xl p-6 max-w-md w-full space-y-5 relative`}>
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center border-none cursor-pointer"
            >
              <Icon name="close" size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white font-headline text-[22px] shadow-md ${
                selectedUser.is_suspended ? 'bg-rose-600' : 'bg-[#006972]'
              }`}>
                {(selectedUser.full_name || 'U').charAt(0).toUpperCase()}
              </div>

              <div>
                <h3 className="font-headline text-[18px] font-bold text-deep-navy">{selectedUser.full_name}</h3>
                <p className="font-body text-[12px] text-on-surface-variant">{selectedUser.email || selectedUser.phone_number}</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full font-label text-[10px] font-bold uppercase border ${
                  selectedUser.is_suspended ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {selectedUser.is_suspended ? 'Suspended Account' : 'Active Account'}
                </span>
              </div>
            </div>

            {/* User Details Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/80 border border-white/90">
              <div>
                <p className="font-label text-[9px] uppercase font-bold text-on-surface-variant">Phone Number</p>
                <p className="font-body text-[13px] font-semibold text-deep-navy">{selectedUser.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="font-label text-[9px] uppercase font-bold text-on-surface-variant">Trust Score</p>
                <p className="font-body text-[13px] font-semibold text-[#006972]">{selectedUser.trust_score ?? 0} / 100</p>
              </div>
              <div>
                <p className="font-label text-[9px] uppercase font-bold text-on-surface-variant">Committees Joined</p>
                <p className="font-body text-[13px] font-semibold text-deep-navy">{selectedUser.committees_count || 0} Pools</p>
              </div>
              <div>
                <p className="font-label text-[9px] uppercase font-bold text-on-surface-variant">Member Since</p>
                <p className="font-body text-[13px] font-semibold text-deep-navy">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'Recently'}</p>
              </div>
              <div>
                <p className="font-label text-[9px] uppercase font-bold text-on-surface-variant">CNIC Status</p>
                <p className={`font-body text-[13px] font-semibold capitalize ${
                  selectedUser.cnic_status === 'verified' ? 'text-emerald-700' :
                  selectedUser.cnic_status === 'pending' ? 'text-amber-700' :
                  selectedUser.cnic_status === 'rejected' ? 'text-rose-700' : 'text-slate-600'
                }`}>
                  {selectedUser.cnic_status || 'Unverified'}
                </p>
              </div>
              <div>
                <p className="font-label text-[9px] uppercase font-bold text-on-surface-variant">Reports Filed Against</p>
                <p className={`font-body text-[13px] font-semibold ${
                  (selectedUser.reports_count || 0) > 0 ? 'text-rose-700' : 'text-slate-600'
                }`}>
                  {selectedUser.reports_count || 0} report{selectedUser.reports_count !== 1 ? 's' : ''}
                </p>
              </div>
              {selectedUser.cnic_number && (
                <div className="col-span-2">
                  <p className="font-label text-[9px] uppercase font-bold text-on-surface-variant">CNIC Number</p>
                  <p className="font-body text-[13px] font-semibold text-deep-navy">{selectedUser.cnic_number}</p>
                </div>
              )}
            </div>

            {/* Action Section */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block font-label text-[11px] font-bold text-deep-navy">
                Staff Audit Action Notes
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Reason for account status change..."
                rows={2}
                className="w-full p-3 rounded-2xl bg-white/80 border border-slate-200 font-body text-[13px] text-deep-navy outline-none focus:border-[#006972]"
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-label text-[13px] font-bold border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleSuspend}
                  disabled={processingAction}
                  className={`flex-1 py-3 rounded-2xl font-label text-[13px] font-bold text-white transition-all cursor-pointer border-none shadow-md ${
                    selectedUser.is_suspended
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {processingAction
                    ? 'Processing...'
                    : selectedUser.is_suspended
                    ? 'Reinstate Account'
                    : 'Suspend Account'}
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
