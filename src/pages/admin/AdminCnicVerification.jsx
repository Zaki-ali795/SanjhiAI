import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import AdminMobileNav from '../../components/AdminMobileNav';
import Button from '../../components/Button';
import { getPendingCnics, approveCnic, rejectCnic } from '../../services/adminService';
import { logout } from '../../services/authService';

function getApiUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `${window.location.origin}/api`;
    }
  }
  return 'http://localhost:3000/api';
}
const API_URL = getApiUrl();

function Bone({ className = '' }) {
  return <div className={`skeleton-bone ${className}`} />;
}

export default function AdminCnicVerification() {
  const navigate = useNavigate();
  const location = useLocation();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState('');

  const adminNavItems = [
    { label: 'Overview', icon: 'dashboard', path: '/admin' },
    { label: 'Analytics', icon: 'bar_chart', path: '/admin/analytics' },
    { label: 'Users', icon: 'group', path: '/admin/users' },
    { label: 'Committees', icon: 'groups', path: '/admin/committees' },
    { label: 'Disputes', icon: 'gavel', path: '/admin/disputes' },
    { label: 'CNIC', icon: 'badge', path: '/admin/cnic-verification' },
    { label: 'Broadcasts', icon: 'campaign', path: '/admin/announcements' },
    { label: 'Audit Log', icon: 'history', path: '/admin/activity' },
    { label: 'Settings', icon: 'settings', path: '/admin/settings' },
  ];

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      navigate('/login');
    }
  }

  async function loadSubmissions() {
    try {
      setLoading(true);
      setLoadError('');
      const data = await getPendingCnics();
      setSubmissions(data.submissions || []);
    } catch (err) {
      setLoadError(err.message || 'Failed to load CNIC submissions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function handleApprove(userId) {
    setProcessing(true);
    try {
      await approveCnic(userId);
      setSubmissions((prev) => prev.filter((s) => s.id !== userId));
      setSelected((prev) => (prev?.id === userId ? null : prev));
      showToast('CNIC verified successfully.');
    } catch (err) {
      showToast(err.data?.error || err.message || 'Failed to verify CNIC.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject(userId) {
    if (!rejectReason.trim()) {
      showToast('Please provide a rejection reason.');
      return;
    }
    setProcessing(true);
    try {
      await rejectCnic(userId, { reason: rejectReason.trim() });
      setSubmissions((prev) => prev.filter((s) => s.id !== userId));
      setSelected((prev) => (prev?.id === userId ? null : prev));
      setRejectReason('');
      showToast('CNIC submission rejected.');
    } catch (err) {
      showToast(err.data?.error || err.message || 'Failed to reject CNIC.');
    } finally {
      setProcessing(false);
    }
  }

  function imageUrl(urlPath) {
    if (!urlPath) return null;
    if (urlPath.startsWith('http')) return urlPath;
    // Serve through authenticated endpoint instead of public /uploads static mount
    const filename = urlPath.split('/').pop();
    return `${API_URL}/uploads/cnic/${filename}`;
  }

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
              <p className="font-label text-[10px] text-[#006972] font-semibold">CNIC Verification</p>
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
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shadow-sm">
                  <Icon name="badge" size={20} />
                </span>
                <h1 className="font-headline text-[22px] sm:text-[26px] font-bold text-deep-navy">CNIC Verification</h1>
              </div>
              <p className="font-label text-[11px] sm:text-[12px] text-on-surface-variant font-medium mt-1">
                Review and approve national identity submissions for public committee access.
              </p>
            </div>
            <Button onClick={loadSubmissions} variant="secondary" icon="refresh">
              Refresh
            </Button>
          </header>

          {toast && (
            <div className="fixed top-4 right-4 z-50 bg-[#006972] text-white px-5 py-3 rounded-2xl shadow-lg font-label text-[13px] font-semibold flex items-center gap-2 animate-in slide-in-from-right-4">
              <Icon name="check_circle" size={18} />
              {toast}
            </div>
          )}

          {loading ? (
            <div className="space-y-3 w-full">
              {[1, 2, 3].map((i) => (
                <Bone key={i} className="w-full h-28 rounded-2xl" />
              ))}
            </div>
          ) : loadError ? (
            <div className={`${GLASS_CARD} rounded-3xl p-8 text-center space-y-3`}>
              <div className="w-14 h-14 rounded-3xl bg-rose-50/90 text-rose-600 flex items-center justify-center mx-auto border border-rose-200/80 shadow-sm">
                <Icon name="error" size={28} />
              </div>
              <h2 className="font-headline text-[18px] font-bold text-deep-navy">Couldn't load submissions</h2>
              <p className="font-body text-[13px] text-on-surface-variant max-w-xs mx-auto">{loadError}</p>
              <button
                onClick={loadSubmissions}
                className="px-6 py-2.5 rounded-2xl bg-[#006972] text-white font-label text-[13px] font-bold cursor-pointer border-none shadow-md"
              >
                Retry
              </button>
            </div>
          ) : submissions.length === 0 ? (
            <div className={`${GLASS_CARD} rounded-3xl py-12 text-center space-y-2`}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Icon name="check_circle" size={24} />
              </div>
              <p className="font-headline text-[16px] font-bold text-deep-navy">All caught up!</p>
              <p className="font-body text-[12px] text-on-surface-variant">There are no pending CNIC submissions to review.</p>
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-3">
              {submissions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className={`${GLASS_CARD} rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-[0_12px_30px_rgba(0,105,114,0.14)] hover:-translate-y-0.5 cursor-pointer border border-white/90`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white font-headline text-[18px] shrink-0 shadow-md bg-gradient-to-br from-[#006972] to-[#004f56]">
                      {(s.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-headline text-[16px] font-bold text-deep-navy truncate">{s.full_name || 'Anonymous User'}</h3>
                        <span className="px-2.5 py-0.5 rounded-full font-label text-[10px] font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200">
                          Pending
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[12px] text-on-surface-variant">
                        {s.email && (
                          <span className="flex items-center gap-1">
                            <Icon name="mail" size={13} className="text-[#006972]" /> {s.email}
                          </span>
                        )}
                        {s.phone_number && (
                          <span className="flex items-center gap-1">
                            <Icon name="phone" size={13} className="text-[#006972]" /> {s.phone_number}
                          </span>
                        )}
                        {s.cnic_number && (
                          <span className="flex items-center gap-1 font-label font-semibold text-deep-navy">
                            <Icon name="badge" size={13} className="text-[#006972]" /> {s.cnic_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(s);
                      }}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setSelected(null)} aria-hidden="true" />
          <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-6 my-auto animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading text-deep-navy">Review CNIC Submission</h2>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-full hover:bg-surface-container transition-colors"
                aria-label="Close"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-deep-navy/60 font-label font-semibold uppercase tracking-wider mb-1">Name</p>
                  <p className="text-deep-navy font-body">{selected.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-deep-navy/60 font-label font-semibold uppercase tracking-wider mb-1">CNIC Number</p>
                  <p className="text-deep-navy font-body font-semibold">{selected.cnic_number || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-deep-navy/60 font-label font-semibold uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-deep-navy font-body">{selected.phone_number || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-deep-navy/60 font-label font-semibold uppercase tracking-wider mb-1">Submitted</p>
                  <p className="text-deep-navy font-body">
                    {selected.cnic_submitted_at
                      ? new Date(selected.cnic_submitted_at).toLocaleString('en-PK')
                      : '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selected.cnic_front_url && (
                  <a
                    href={imageUrl(selected.cnic_front_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl overflow-hidden border border-deep-navy/10 hover:border-teal-emerald transition-colors"
                  >
                    <img
                      src={imageUrl(selected.cnic_front_url)}
                      alt="CNIC front"
                      className="w-full h-48 object-cover"
                    />
                    <p className="text-center text-xs font-label font-semibold text-deep-navy/70 py-2">Front side</p>
                  </a>
                )}
                {selected.cnic_back_url && (
                  <a
                    href={imageUrl(selected.cnic_back_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl overflow-hidden border border-deep-navy/10 hover:border-teal-emerald transition-colors"
                  >
                    <img
                      src={imageUrl(selected.cnic_back_url)}
                      alt="CNIC back"
                      className="w-full h-48 object-cover"
                    />
                    <p className="text-center text-xs font-label font-semibold text-deep-navy/70 py-2">Back side</p>
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason (required only if rejecting)"
                className="w-full px-4 py-3 rounded-2xl border border-deep-navy/15 bg-white text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 focus:ring-teal-emerald/30 min-h-[80px] resize-none"
              />
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => handleReject(selected.id)}
                  disabled={processing}
                  icon={processing ? 'progress_activity' : 'block'}
                >
                  {processing ? 'Processing…' : 'Reject'}
                </Button>
                <Button
                  fullWidth
                  onClick={() => handleApprove(selected.id)}
                  disabled={processing}
                  icon={processing ? 'progress_activity' : 'verified'}
                >
                  {processing ? 'Processing…' : 'Verify'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdminMobileNav />
    </AuthAmbientBackground>
  );
}
