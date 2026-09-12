import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import AdminMobileNav from '../../components/AdminMobileNav';
import { getActivityLogs } from '../../services/adminService';
import { logout } from '../../services/authService';

const GLASS_CARD = 'bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,105,114,0.12)]';

/* ── Skeleton Bone Helper ── */
function Bone({ className = '' }) {
  return <div className={`skeleton-bone ${className}`} />;
}

export default function ActivityLog() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [logs, setLogs] = useState([]);
  const [activeFilter, setActiveTab] = useState('ALL'); // ALL, RESOLUTIONS, FREEZES, USERS
  const [searchQuery, setSearchQuery] = useState('');

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      // ignore
    } finally {
      navigate('/login');
    }
  }

  async function loadLogsData() {
    try {
      setLoading(true);
      setLoadError('');
      const data = await getActivityLogs({ search: searchQuery });
      const list = data?.logs || data || [];

      setLogs(list);
    } catch (err) {
      setLoadError(err.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogsData();
  }, []);

  /* Filtered Audit Logs */
  const filteredLogs = logs.filter((l) => {
    if (activeFilter === 'RESOLUTIONS') return l.action_type === 'RESOLVE_COMPLAINT' || l.action_type === 'DISMISS_COMPLAINT';
    if (activeFilter === 'FREEZES') return l.action_type === 'FREEZE_COMMITTEE' || l.action_type === 'UNFREEZE_COMMITTEE';
    if (activeFilter === 'USERS') return l.action_type === 'SUSPEND_USER' || l.action_type === 'UNSUSPEND_USER';

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (l.action_type || '').toLowerCase().includes(q) ||
        (l.admin_name || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

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
              <p className="font-label text-[10px] text-[#006972] font-semibold">Audit Stream</p>
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-label text-[13px] font-bold transition-all cursor-pointer border-none text-left ${
                    isActive
                      ? 'bg-[#006972] text-white shadow-md shadow-[#006972]/20'
                      : 'text-deep-navy/70 hover:bg-white/80 hover:text-deep-navy'
                  }`}
                >
                  <Icon name={item.icon} size={18} className={isActive ? 'text-white' : 'text-[#006972]'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Persistent Logout Button */}
          <div className="mt-auto pt-3 border-t border-slate-200/60">
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-label text-[12px] font-bold transition-all cursor-pointer border border-rose-200 flex items-center justify-center gap-2 shadow-sm"
            >
              <Icon name="logout" size={16} />
              Logout Staff Account
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 px-3 sm:px-6 py-4 sm:py-8 flex flex-col gap-5 min-w-0 pb-28 md:pb-12">

          {/* Header */}
          <header className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-headline text-[22px] sm:text-[26px] font-bold text-deep-navy tracking-tight">
                Platform Audit & Activity Log
              </h1>
              <p className="font-label text-[11px] text-on-surface-variant font-medium">
                Time-stamped audit record of administrative actions, compliance freezes, and dispute resolutions
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
                placeholder="Search audit action, admin name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/70 border border-white/80 text-deep-navy font-body text-[13px] placeholder:text-slate-400 outline-none focus:border-[#006972] focus:bg-white transition-all shadow-sm"
              />
            </div>
          </header>

          {/* Filter Chips */}
          <section className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Actions', icon: 'history' },
              { id: 'RESOLUTIONS', label: 'Dispute Resolutions', icon: 'gavel' },
              { id: 'FREEZES', label: 'Freezes & Blocks', icon: 'lock' },
              { id: 'USERS', label: 'User Audits', icon: 'manage_accounts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full font-label text-[12px] font-bold transition-all cursor-pointer border shrink-0 flex items-center gap-1.5 ${
                  activeFilter === tab.id
                    ? 'bg-[#006972] text-white border-[#006972] shadow-md shadow-[#006972]/20'
                    : 'bg-white/60 hover:bg-white text-deep-navy/70 border-white/80'
                }`}
              >
                <Icon name={tab.icon} size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </section>

          {loading ? (
            <div className="space-y-3 w-full">
              {[1, 2, 3, 4].map((i) => (
                <Bone key={i} className="w-full h-24 rounded-3xl" />
              ))}
            </div>
          ) : loadError ? (
            <div className={`${GLASS_CARD} rounded-3xl p-8 text-center space-y-3`}>
              <div className="w-14 h-14 rounded-3xl bg-rose-50/90 text-rose-600 flex items-center justify-center mx-auto border border-rose-200/80 shadow-sm">
                <Icon name="error" size={28} />
              </div>
              <h2 className="font-headline text-[18px] font-bold text-deep-navy">Couldn't load audit log</h2>
              <p className="font-body text-[13px] text-on-surface-variant max-w-xs mx-auto">{loadError}</p>
              <button
                onClick={loadLogsData}
                className="px-6 py-2.5 rounded-2xl bg-[#006972] text-white font-label text-[13px] font-bold cursor-pointer border-none shadow-md"
              >
                Retry
              </button>
            </div>
          ) : (
            /* Audit Stream Timeline */
            <section className="space-y-3">
              {filteredLogs.length === 0 ? (
                <div className={`${GLASS_CARD} rounded-3xl p-8 text-center space-y-2`}>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Icon name="history_toggle_off" size={24} />
                  </div>
                  <h3 className="font-headline text-[16px] font-bold text-deep-navy">No audit logs found</h3>
                  <p className="font-body text-[12px] text-on-surface-variant">Try selecting a different filter tab or clearing search.</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`${GLASS_CARD} rounded-3xl p-4 sm:p-5 flex items-start gap-4 border border-white/90 shadow-sm transition-all hover:shadow-md`}
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${log.color}`}>
                      <Icon name={log.icon} size={22} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-headline text-[15px] font-bold text-deep-navy truncate">{log.title}</h3>
                        <span className="font-label text-[10px] text-slate-400 shrink-0 font-semibold">{log.timestamp}</span>
                      </div>

                      <p className="font-body text-[12px] text-on-surface-variant mt-1 leading-relaxed">
                        {log.details}
                      </p>

                      <div className="flex items-center gap-1.5 pt-2 text-[#006972] font-label text-[10px] font-bold">
                        <Icon name="badge" size={13} />
                        <span>Action performed by: {log.admin_name}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <AdminMobileNav />
    </AuthAmbientBackground>
  );
}
