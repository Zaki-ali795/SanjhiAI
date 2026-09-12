import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import logo from '../../assets/screen.png';

/**
 * Returns icon, badge color, and label based on notification type.
 */
function getNotificationMeta(type = '') {
  const t = (type || '').toLowerCase();

  if (t.includes('payment') || t.includes('payout') || t.includes('cycle')) {
    return {
      icon: 'payments',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-700',
      category: 'payments',
      badge: 'Payment & Payout',
    };
  }
  if (t.includes('member') || t.includes('join') || t.includes('committee') || t.includes('public')) {
    return {
      icon: 'groups',
      color: 'text-teal-700 bg-teal-50 border-teal-200',
      iconBg: 'bg-teal-100 text-[#006972]',
      category: 'committees',
      badge: 'Committee Activity',
    };
  }
  if (t.includes('cnic') || t.includes('auth') || t.includes('login') || t.includes('security')) {
    return {
      icon: 'verified_user',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      iconBg: 'bg-blue-100 text-blue-700',
      category: 'security',
      badge: 'Identity & Security',
    };
  }
  if (t.includes('complaint') || t.includes('dispute') || t.includes('ai') || t.includes('system')) {
    return {
      icon: 'gavel',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-800',
      category: 'system',
      badge: 'System & Safety',
    };
  }

  return {
    icon: 'notifications',
    color: 'text-[#006972] bg-[#006972]/10 border-[#006972]/20',
    iconBg: 'bg-[#006972]/10 text-[#006972]',
    category: 'system',
    badge: 'Notification',
  };
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [markingAll, setMarkingAll] = useState(false);

  const [selectedNotif, setSelectedNotif] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data?.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id, e) {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      if (selectedNotif && selectedNotif.id === id) {
        setSelectedNotif((prev) => ({ ...prev, read_at: new Date().toISOString() }));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      setMarkingAll(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      if (selectedNotif) {
        setSelectedNotif((prev) => ({ ...prev, read_at: prev.read_at || new Date().toISOString() }));
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  }

  // Filter notifications by category
  const filteredNotifications = useMemo(() => {
    if (activeCategory === 'ALL') return notifications;
    return notifications.filter((n) => {
      const meta = getNotificationMeta(n.type);
      return meta.category === activeCategory.toLowerCase();
    });
  }, [notifications, activeCategory]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read_at).length;
  }, [notifications]);

  function handleNotificationClick(notif) {
    if (!notif.read_at) {
      handleMarkAsRead(notif.id);
    }
    setSelectedNotif(notif);
  }

  function handleCopyDetails(text) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AuthAmbientBackground showTicker={false}>
      <div className="w-full max-w-4xl mx-auto flex flex-col min-h-screen pb-28 md:pb-12 pt-2 sm:pt-4">

        {/* ── MODERN GLASSMOPRHIC NAVBAR ── */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#006972]/10 shadow-sm px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate('/dashboard')}
                aria-label="Go to Dashboard"
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 border border-[#006972]/12 text-[#006972] transition-colors cursor-pointer active:scale-95"
              >
                <Icon name="arrow_back" size={18} />
              </button>

              <div className="flex items-center gap-2.5 min-w-0">
                <img src={logo} alt="Sanjhi" className="h-8 sm:h-9 object-contain shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-label font-bold uppercase text-on-surface-variant tracking-wider truncate">Alert Center</p>
                  <h1 className="font-headline text-[18px] sm:text-[22px] font-bold text-[#006972] leading-tight flex items-center gap-2">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-label text-[11px] font-bold animate-pulse">
                        {unreadCount} New
                      </span>
                    )}
                  </h1>
                </div>
              </div>
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="px-3 py-1.5 rounded-xl bg-[#006972]/10 hover:bg-[#006972]/18 text-[#006972] font-label text-[12px] font-bold border border-[#006972]/20 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50"
              >
                <Icon name="done_all" size={16} />
                <span className="hidden sm:inline">Mark All as Read</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 w-full space-y-4 px-3 sm:px-6 pt-4 relative z-10">

          {/* ── CATEGORY FILTER CHIPS ── */}
          <section className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Notifications', count: notifications.length, icon: 'notifications' },
              { id: 'PAYMENTS', label: 'Payments & Payouts', count: notifications.filter(n => getNotificationMeta(n.type).category === 'payments').length, icon: 'payments' },
              { id: 'COMMITTEES', label: 'Committees', count: notifications.filter(n => getNotificationMeta(n.type).category === 'committees').length, icon: 'groups' },
              { id: 'SECURITY', label: 'Identity & CNIC', count: notifications.filter(n => getNotificationMeta(n.type).category === 'security').length, icon: 'verified_user' },
              { id: 'SYSTEM', label: 'System & Safety', count: notifications.filter(n => getNotificationMeta(n.type).category === 'system').length, icon: 'gavel' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-2 rounded-full font-label text-[12px] font-bold transition-all cursor-pointer border shrink-0 flex items-center gap-1.5 ${
                  activeCategory === tab.id
                    ? 'bg-[#006972] text-white border-[#006972] shadow-md shadow-[#006972]/20'
                    : 'bg-white/70 hover:bg-white text-deep-navy/75 border-slate-200'
                }`}
              >
                <Icon name={tab.icon} size={14} />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeCategory === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </section>

          {/* ── NOTIFICATIONS LIST ── */}
          {loading ? (
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/70 border border-white/80 animate-pulse flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-40 h-4 bg-slate-200 rounded" />
                    <div className="w-full h-3 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 sm:p-12 text-center space-y-3 border border-white/90 shadow-sm mt-4">
              <div className="w-16 h-16 bg-[#006972]/10 text-[#006972] rounded-2xl flex items-center justify-center mx-auto border border-[#006972]/15">
                <Icon name="notifications_off" size={32} />
              </div>
              <h3 className="font-headline text-[18px] font-bold text-deep-navy">No Notifications Found</h3>
              <p className="font-body text-[13px] text-on-surface-variant max-w-sm mx-auto">
                {activeCategory === 'ALL'
                  ? 'You are all caught up! Committee payout alerts, payment verification notices, and account security updates will appear here.'
                  : `No ${activeCategory.toLowerCase()} notifications at the moment.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => {
                const isUnread = !notif.read_at;
                const meta = getNotificationMeta(notif.type);
                const displayTitle = notif.title || (notif.type || 'NOTIFICATION').replace(/_/g, ' ').toUpperCase();
                const displayBody = notif.body || notif.content || 'Notification update.';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`relative overflow-hidden w-full rounded-2xl border transition-all cursor-pointer p-4 sm:p-5 flex gap-3.5 items-start ${
                      isUnread
                        ? 'bg-white border-[#006972]/30 shadow-md ring-2 ring-[#006972]/10'
                        : 'bg-white/75 border-slate-200/80 opacity-90 hover:bg-white hover:opacity-100'
                    }`}
                  >
                    {/* Unread Accent Bar & Dot */}
                    {isUnread && (
                      <>
                        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#006972]" />
                        <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      </>
                    )}

                    {/* Icon Container */}
                    <div className={`w-11 h-11 rounded-2xl ${meta.iconBg} flex items-center justify-center shrink-0 shadow-sm border border-black/5`}>
                      <Icon name={meta.icon} size={22} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-headline text-[15px] sm:text-[16px] font-bold text-deep-navy truncate">
                            {displayTitle}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full font-label text-[10px] font-bold ${meta.color} border shrink-0`}>
                            {meta.badge}
                          </span>
                        </div>

                        <span className="font-label text-[11px] text-on-surface-variant shrink-0">
                          {new Date(notif.created_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="font-body text-[13px] sm:text-[14px] text-slate-700 leading-snug">
                        {displayBody}
                      </p>

                      {/* Committee Tag if attached */}
                      {notif.committee_name && (
                        <p className="font-label text-[11px] text-[#006972] font-semibold mt-1.5 flex items-center gap-1">
                          <Icon name="groups" size={13} /> {notif.committee_name}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ── NOTIFICATION DETAILS MODAL ── */}
        {selectedNotif && (() => {
          const meta = getNotificationMeta(selectedNotif.type);
          const displayTitle = selectedNotif.title || (selectedNotif.type || 'NOTIFICATION').replace(/_/g, ' ').toUpperCase();
          const displayBody = selectedNotif.body || selectedNotif.content || 'No details provided.';
          const formattedDate = new Date(selectedNotif.created_at).toLocaleDateString('en-PK', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          const formattedTime = new Date(selectedNotif.created_at).toLocaleTimeString('en-PK', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
              onClick={() => setSelectedNotif(null)}
            >
              <div
                className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-3 bg-[#fbfaee]/70">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl ${meta.iconBg} flex items-center justify-center shrink-0 shadow-sm border border-black/5`}>
                      <Icon name={meta.icon} size={24} />
                    </div>
                    <div className="min-w-0">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-label text-[10px] font-bold ${meta.color} border mb-1`}>
                        {meta.badge}
                      </span>
                      <h2 className="font-headline text-[16px] sm:text-[18px] font-bold text-deep-navy leading-snug">
                        Notification Details
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedNotif(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
                    aria-label="Close dialog"
                  >
                    <Icon name="close" size={18} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <h3 className="font-headline text-[16px] sm:text-[18px] font-bold text-deep-navy mb-2">
                      {displayTitle}
                    </h3>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-slate-800 font-body text-[13px] sm:text-[14px] leading-relaxed whitespace-pre-wrap select-text">
                      {displayBody}
                    </div>
                  </div>

                  {/* Metadata Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-[#fbfaee] border border-deep-navy/5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0">
                        <Icon name="schedule" size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-label uppercase font-bold text-on-surface-variant">Time & Date</p>
                        <p className="text-[12px] font-bold text-deep-navy truncate">{formattedDate} • {formattedTime}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#fbfaee] border border-deep-navy/5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Icon name="done_all" size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-label uppercase font-bold text-on-surface-variant">Status</p>
                        <p className="text-[12px] font-bold text-emerald-700">Read & Acknowledged</p>
                      </div>
                    </div>
                  </div>

                  {/* Committee details if available */}
                  {(selectedNotif.committee_name || selectedNotif.related_committee_id) && (
                    <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon name="groups" size={18} className="text-teal-700 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-label uppercase font-bold text-teal-800">Related Committee</p>
                          <p className="text-[12px] font-bold text-teal-900 truncate">
                            {selectedNotif.committee_name || `Committee #${selectedNotif.related_committee_id}`}
                          </p>
                        </div>
                      </div>
                      {selectedNotif.related_committee_id && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedNotif(null);
                            navigate(`/committee/${selectedNotif.related_committee_id}`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-label text-[11px] font-bold transition-all cursor-pointer shrink-0"
                        >
                          View Pool
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleCopyDetails(`${displayTitle}\n\n${displayBody}`)}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-label text-[12px] font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Icon name={copied ? 'check' : 'content_copy'} size={15} className={copied ? 'text-emerald-600' : ''} />
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedNotif(null)}
                    className="px-4 py-2 rounded-xl bg-[#006972] hover:bg-[#005a62] text-white font-label text-[12px] font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </AuthAmbientBackground>
  );
}
