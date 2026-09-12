import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import AdminMobileNav from '../../components/AdminMobileNav';
import { getAnnouncements, createAnnouncement } from '../../services/adminService';
import { logout } from '../../services/authService';

const GLASS_CARD = 'bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,105,114,0.12)]';

/* ── Skeleton Bone Helper ── */
function Bone({ className = '' }) {
  return <div className={`skeleton-bone ${className}`} />;
}

export default function AdminAnnouncements() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [announcements, setAnnouncements] = useState([]);

  /* New Announcement Form State */
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL'); // ALL, ORGANIZERS, MEMBERS
  const [priority, setPriority] = useState('NORMAL'); // NORMAL, HIGH, URGENT
  const [submitting, setSubmitting] = useState(false);
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

  async function loadAnnouncementsData() {
    try {
      setLoading(true);
      setLoadError('');
      const data = await getAnnouncements();
      const list = data?.announcements || data || [];

      setAnnouncements(list);
    } catch (err) {
      setLoadError(err.message || 'Failed to load broadcast history.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnnouncementsData();
  }, []);

  async function handleCreateAnnouncement(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim() || submitting) return;
    setSubmitting(true);
    try {
      const payload = { title, body, target_audience: targetAudience, priority };
      await createAnnouncement(payload);

      showToast('Broadcast notification sent to users!');
      setAnnouncements((prev) => [
        {
          id: `ANC-${Date.now().toString().slice(-4)}`,
          title,
          body,
          target_audience: targetAudience,
          priority,
          created_at: new Date().toISOString(),
          sent_count: 0,
        },
        ...prev,
      ]);

      setShowModal(false);
      setTitle('');
      setBody('');
      setTargetAudience('ALL');
      setPriority('NORMAL');
    } catch (err) {
      showToast(err.message || 'Failed to broadcast announcement.');
    } finally {
      setSubmitting(false);
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
              <p className="font-label text-[10px] text-[#006972] font-semibold">Broadcast Hub</p>
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
                System Broadcast & Announcements
              </h1>
              <p className="font-label text-[11px] text-on-surface-variant font-medium">
                Create platform notifications, push alerts, and operational policy updates for users
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#006972] to-[#007a82] hover:from-[#00575f] hover:to-[#006972] text-white font-label text-[13px] font-bold shadow-md shadow-[#006972]/20 flex items-center justify-center gap-2 transition-all cursor-pointer border-none active:scale-95 shrink-0"
            >
              <Icon name="add_alert" size={18} />
              New Broadcast Notification
            </button>
          </header>

          {loading ? (
            <div className="space-y-3 w-full">
              {[1, 2, 3].map((i) => (
                <Bone key={i} className="w-full h-32 rounded-3xl" />
              ))}
            </div>
          ) : loadError ? (
            <div className={`${GLASS_CARD} rounded-3xl p-8 text-center space-y-3`}>
              <div className="w-14 h-14 rounded-3xl bg-rose-50/90 text-rose-600 flex items-center justify-center mx-auto border border-rose-200/80 shadow-sm">
                <Icon name="error" size={28} />
              </div>
              <h2 className="font-headline text-[18px] font-bold text-deep-navy">Couldn't load announcements</h2>
              <p className="font-body text-[13px] text-on-surface-variant max-w-xs mx-auto">{loadError}</p>
              <button
                onClick={loadAnnouncementsData}
                className="px-6 py-2.5 rounded-2xl bg-[#006972] text-white font-label text-[13px] font-bold cursor-pointer border-none shadow-md"
              >
                Retry
              </button>
            </div>
          ) : (
            /* Broadcast History List */
            <section className="space-y-3">
              {announcements.length === 0 ? (
                <div className={`${GLASS_CARD} rounded-3xl p-8 text-center space-y-2`}>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Icon name="notifications_off" size={24} />
                  </div>
                  <h3 className="font-headline text-[16px] font-bold text-deep-navy">No broadcasts sent yet</h3>
                  <p className="font-body text-[12px] text-on-surface-variant">Click "+ New Broadcast Notification" to send your first message.</p>
                </div>
              ) : (
                announcements.map((anc) => (
                  <div
                    key={anc.id}
                    className={`${GLASS_CARD} rounded-3xl p-5 relative overflow-hidden flex flex-col gap-3 border border-white/90 shadow-sm transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#006972] bg-[#006972]/10 px-2.5 py-0.5 rounded-full border border-[#006972]/20">
                          {anc.id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full font-label text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                          Target: {anc.target_audience}
                        </span>
                      </div>
                      <span className="font-label text-[11px] text-slate-400 font-semibold">{anc.created_at}</span>
                    </div>

                    <div>
                      <h3 className="font-headline text-[17px] font-bold text-deep-navy">{anc.title}</h3>
                      <p className="font-body text-[13px] text-on-surface-variant mt-1 leading-relaxed">
                        {anc.body}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 font-label text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Icon name="send" size={14} className="text-[#006972]" /> Delivered to {anc.sent_count || 0} users
                      </span>
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <Icon name="check_circle" size={13} /> Active Broadcast
                      </span>
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

        </main>
      </div>

      {/* ── CREATE ANNOUNCEMENT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/80 space-y-5 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center border-none cursor-pointer"
            >
              <Icon name="close" size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0">
                <Icon name="campaign" size={24} />
              </div>
              <div>
                <h3 className="font-headline text-[18px] font-bold text-deep-navy">Create Broadcast Notification</h3>
                <p className="font-label text-[11px] text-on-surface-variant">Sends in-app notification to selected users</p>
              </div>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label htmlFor="titleInput" className="block font-label text-[11px] font-bold uppercase text-deep-navy tracking-wider mb-1.5">
                  Announcement Title
                </label>
                <input
                  id="titleInput"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Turn Schedule Update & Verification Tip"
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-deep-navy font-body text-[13px] outline-none focus:border-[#006972]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="targetAudienceSelect" className="block font-label text-[11px] font-bold uppercase text-deep-navy tracking-wider mb-1.5">
                    Target Audience
                  </label>
                  <select
                    id="targetAudienceSelect"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-deep-navy font-label text-[12px] font-bold outline-none focus:border-[#006972]"
                  >
                    <option value="ALL">All Users (1,240)</option>
                    <option value="ORGANIZERS">Organizers Only</option>
                    <option value="MEMBERS">Members Only</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="prioritySelect" className="block font-label text-[11px] font-bold uppercase text-deep-navy tracking-wider mb-1.5">
                    Priority Banner
                  </label>
                  <select
                    id="prioritySelect"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-deep-navy font-label text-[12px] font-bold outline-none focus:border-[#006972]"
                  >
                    <option value="NORMAL">Normal Info</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Warning</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="bodyTextarea" className="block font-label text-[11px] font-bold uppercase text-deep-navy tracking-wider mb-1.5">
                  Notification Message Body
                </label>
                <textarea
                  id="bodyTextarea"
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write clear instructions or announcements for your platform members..."
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-deep-navy font-body text-[13px] outline-none focus:border-[#006972]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[14px] font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer border-none disabled:opacity-60"
              >
                {submitting && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                <Icon name="send" size={18} />
                Send Broadcast Notification Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE NAVIGATION */}
      <AdminMobileNav />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-24 right-4 left-4 sm:left-auto sm:right-5 sm:w-80 z-50 px-4 py-3 rounded-2xl shadow-2xl font-label text-[13px] font-bold flex items-center gap-2.5 border border-white/20 bg-[#006972] text-white">
          <Icon name="check_circle" size={18} className="shrink-0 text-emerald-300" />
          <span className="flex-1">{toastMessage}</span>
        </div>
      )}
    </AuthAmbientBackground>
  );
}
