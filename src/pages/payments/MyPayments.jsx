import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import { useNavDrawer } from '../../context/NavDrawerContext';
import { getMyPayments } from '../../services/paymentService';
import AddToCalendarModal from '../../components/AddToCalendarModal';

function formatMoney(n) {
  return `Rs. ${Number(n || 0).toLocaleString('en-PK')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isPastDue(dueDate) {
  if (!dueDate) return false;
  const endOfDay = new Date(`${dueDate}T23:59:59`);
  return endOfDay < new Date();
}

const GLASS_CARD = 'bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,105,114,0.12)]';

/* ── Skeleton Bone Helper ── */
function Bone({ className = '' }) {
  return <span className={`skeleton-bone inline-block ${className}`} />;
}

export default function MyPayments() {
  const navigate = useNavigate();
  const { openDrawer } = useNavDrawer();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [history, setHistory] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [stats, setStats] = useState({ trust_score: null, total_paid: 0, on_time: 0, on_time_rate: null });

  const [activeCommitteeTab, setActiveCommitteeTab] = useState('ALL');
  const [showFutureCycles, setShowFutureCycles] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setLoadError('');
        const data = await getMyPayments();
        if (cancelled) return;
        setHistory(data?.history || []);
        setUpcoming(data?.upcoming || []);
        setStats((prev) => ({ ...prev, ...(data?.stats || {}) }));
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Failed to load payments.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Extract unique committees from upcoming & history ── */
  const committeesList = useMemo(() => {
    const map = new Map();
    upcoming.forEach((u) => {
      if (u.committee_id && !map.has(u.committee_id)) {
        map.set(u.committee_id, u.committee_name || 'Committee');
      }
    });
    history.forEach((h) => {
      if (h.committee_id && !map.has(h.committee_id)) {
        map.set(h.committee_id, h.committee_name || 'Committee');
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [upcoming, history]);

  /* ── Filter upcoming items by active committee tab ── */
  const filteredUpcoming = useMemo(() => {
    if (activeCommitteeTab === 'ALL') return upcoming;
    return upcoming.filter((u) => String(u.committee_id) === String(activeCommitteeTab));
  }, [upcoming, activeCommitteeTab]);

  /* ── Latest active due cycle (the single most important payment) ── */
  const latestActiveDue = useMemo(() => {
    if (!filteredUpcoming.length) return null;
    // Pick overdue or first collecting item
    return filteredUpcoming[0];
  }, [filteredUpcoming]);

  /* ── Remaining future cycles ── */
  const remainingFutureCycles = useMemo(() => {
    if (!filteredUpcoming.length) return [];
    return filteredUpcoming.slice(1);
  }, [filteredUpcoming]);

  /* ── Filter history items ── */
  const filteredHistory = useMemo(() => {
    let items = history;
    if (activeCommitteeTab !== 'ALL') {
      items = items.filter((h) => String(h.committee_id) === String(activeCommitteeTab));
    }
    if (historyFilter === 'paid') return items.filter((h) => h.status === 'paid');
    if (historyFilter === 'pending') return items.filter((h) => h.status === 'awaiting_confirmation');
    return items;
  }, [history, activeCommitteeTab, historyFilter]);

  return (
    <AuthAmbientBackground showTicker={false}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col min-h-[calc(100vh-36px)] gap-5">

        {/* Header */}
        <header className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/60 hover:bg-white/80 text-[#006972] transition-all cursor-pointer active:scale-90 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgba(0,105,114,0.12)]"
            >
              <Icon name="arrow_back" size={20} />
            </button>
            <h1 className="font-headline text-[20px] sm:text-[23px] font-bold text-deep-navy tracking-tight">
              Payments Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              title="Dashboard"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/60 hover:bg-white/80 text-[#006972] transition-all cursor-pointer active:scale-90 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgba(0,105,114,0.12)]"
            >
              <Icon name="home" size={20} />
            </button>
            <button
              onClick={openDrawer}
              aria-label="Open Menu"
              title="Open Navigation Drawer"
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-full bg-white/60 hover:bg-white/80 text-[#006972] transition-all cursor-pointer active:scale-90 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgba(0,105,114,0.12)]"
            >
              <Icon name="menu" size={20} />
            </button>
          </div>
        </header>

        {loading ? (
          /* Skeleton Loader */
          <div className="flex flex-col gap-5 w-full">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Bone className="w-full h-28 rounded-3xl" />
              <Bone className="w-full h-28 rounded-3xl" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Bone className="w-24 h-9 rounded-full shrink-0" />
              <Bone className="w-36 h-9 rounded-full shrink-0" />
              <Bone className="w-32 h-9 rounded-full shrink-0" />
            </div>
            <div className="space-y-3">
              <Bone className="w-40 h-5 rounded-lg" />
              <Bone className="w-full h-44 rounded-3xl" />
            </div>
            <div className="space-y-3 pt-2">
              <Bone className="w-36 h-5 rounded-lg" />
              {[1, 2].map((i) => (
                <div key={i} className={`${GLASS_CARD} rounded-3xl p-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <Bone className="w-11 h-11 rounded-2xl shrink-0" />
                    <div className="space-y-2"><Bone className="w-36 h-4 rounded-lg" /><Bone className="w-28 h-3 rounded-lg" /></div>
                  </div>
                  <Bone className="w-16 h-4 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ) : loadError ? (
          /* Error State */
          <div className={`${GLASS_CARD} rounded-3xl p-6 text-center space-y-3`}>
            <div className="w-14 h-14 rounded-3xl bg-rose-50/90 text-rose-600 flex items-center justify-center mx-auto border border-rose-200/80 shadow-sm">
              <Icon name="error" size={28} />
            </div>
            <h2 className="font-headline text-[18px] font-bold text-deep-navy">Couldn't load payments</h2>
            <p className="font-body text-[13px] text-on-surface-variant max-w-xs mx-auto">{loadError}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-2xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[13px] font-bold cursor-pointer border-none shadow-md"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Top Summary Metrics */}
            <section className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Trust Score Banner */}
              <div className="bg-gradient-to-br from-[#006972] via-[#007a82] to-[#005f66] rounded-3xl p-4 sm:p-5 relative overflow-hidden border border-[#006972]/30 shadow-[0_12px_36px_rgba(0,105,114,0.3)]">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/15 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 space-y-1">
                  <p className="font-label text-[10px] text-white/75 uppercase tracking-widest font-semibold flex items-center gap-1">
                    <Icon name="shield" size={13} className="text-emerald-300" /> Trust Score
                  </p>
                  <p className="font-headline text-[32px] sm:text-[38px] font-bold text-white leading-none tabular-nums">
                    {stats.trust_score ?? '—'}
                  </p>
                  <p className="font-label text-[10px] text-white/80 pt-1 flex items-center gap-1">
                    <Icon name="verified_user" size={12} /> {stats.trust_score ? 'Verified Payer' : 'Builds with on-time dues'}
                  </p>
                </div>
              </div>

              {/* On-Time Rate Card */}
              <div className={`${GLASS_CARD} rounded-3xl p-4 sm:p-5 relative overflow-hidden`}>
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 space-y-1">
                  <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold flex items-center gap-1">
                    <Icon name="history" size={13} className="text-[#006972]" /> On-Time Rate
                  </p>
                  <p className="font-headline text-[32px] sm:text-[38px] font-bold text-emerald-600 leading-none tabular-nums">
                    {stats.on_time_rate !== null && stats.on_time_rate !== undefined ? `${stats.on_time_rate}%` : '100%'}
                  </p>
                  <p className="font-label text-[10px] text-on-surface-variant pt-1 flex items-center gap-1">
                    <Icon name="check_circle" size={12} className="text-emerald-600" /> {stats.on_time || 0} / {stats.total_paid || 0} paid on time
                  </p>
                </div>
              </div>
            </section>

            {/* Committee Tabs Bar (If Multiple Committees exist) */}
            {committeesList.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="font-label text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Filter by Committee ({committeesList.length})
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setActiveCommitteeTab('ALL')}
                    className={`px-4 py-2 rounded-full font-label text-[12px] font-bold transition-all cursor-pointer border shrink-0 flex items-center gap-1.5 ${
                      activeCommitteeTab === 'ALL'
                        ? 'bg-[#006972] text-white border-[#006972] shadow-md shadow-[#006972]/20'
                        : 'bg-white/60 hover:bg-white text-deep-navy/70 border-white/80'
                    }`}
                  >
                    <Icon name="apps" size={14} />
                    All Committees
                  </button>
                  {committeesList.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCommitteeTab(c.id)}
                      className={`px-4 py-2 rounded-full font-label text-[12px] font-bold transition-all cursor-pointer border shrink-0 flex items-center gap-1.5 ${
                        String(activeCommitteeTab) === String(c.id)
                          ? 'bg-[#006972] text-white border-[#006972] shadow-md shadow-[#006972]/20'
                          : 'bg-white/60 hover:bg-white text-deep-navy/70 border-white/80'
                      }`}
                    >
                      <Icon name="groups" size={14} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* SPOTLIGHT: LATEST ACTIVE DUE CYCLE */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-headline text-[17px] font-bold text-deep-navy flex items-center gap-2">
                  <Icon name="schedule_send" size={19} className="text-[#006972]" />
                  Latest Active Due
                </h3>
                {filteredUpcoming.length > 0 && (
                  <span className="font-label text-[10px] font-bold text-[#006972] bg-[#006972]/10 px-2.5 py-0.5 rounded-full border border-[#006972]/15">
                    1 Pending Action
                  </span>
                )}
              </div>

              {!latestActiveDue ? (
                /* Empty dues state */
                <div className={`${GLASS_CARD} rounded-3xl p-6 text-center space-y-2`}>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200/70 shadow-sm">
                    <Icon name="task_alt" size={24} />
                  </div>
                  <h4 className="font-headline text-[16px] font-bold text-deep-navy">No Dues Pending!</h4>
                  <p className="font-body text-[12px] text-on-surface-variant max-w-xs mx-auto">
                    You are all caught up for this committee. Checked verified receipts in payment history below.
                  </p>
                </div>
              ) : (
                /* Active Due Spotlight Card */
                (() => {
                  const overdue = isPastDue(latestActiveDue.due_date);
                  return (
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border-2 border-[#006972]/20 shadow-[0_12px_36px_rgba(0,105,114,0.14)] relative overflow-hidden space-y-4">
                      <div className={`h-1.5 absolute top-0 inset-x-0 ${overdue ? 'bg-rose-500' : 'bg-gradient-to-r from-[#006972] via-[#00a3b0] to-[#006972]'}`} />

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label text-[10px] font-bold uppercase tracking-wider ${
                            overdue
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-[#006972]/10 text-[#006972] border border-[#006972]/20'
                          }`}>
                            <Icon name={overdue ? 'warning' : 'event_available'} size={12} />
                            {overdue ? 'Overdue Action' : `Cycle ${latestActiveDue.cycle_number} Due`}
                          </span>
                          <h4 className="font-headline text-[19px] sm:text-[21px] font-bold text-deep-navy mt-1">
                            {latestActiveDue.committee_name}
                          </h4>
                          <p className="font-body text-[12px] text-on-surface-variant mt-0.5 flex items-center gap-2">
                            <span>Due Date: <strong>{formatDate(latestActiveDue.due_date)}</strong></span>
                            {latestActiveDue.payout_turn_order && (
                              <span className="text-[#006972] font-semibold flex items-center gap-0.5">
                                • Turn #{latestActiveDue.payout_turn_order}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Amount display */}
                        <div className="sm:text-right">
                          <p className="font-label text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Amount Due</p>
                          <p className="font-headline text-[24px] sm:text-[28px] font-bold text-[#006972] tabular-nums">
                            {formatMoney(latestActiveDue.contribution_amount)}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons: Pay Now + Add to Calendar */}
                      <div className="flex flex-col sm:flex-row items-center gap-2.5">
                        <button
                          onClick={() => navigate(`/payments/pay/${latestActiveDue.committee_id}/${latestActiveDue.cycle_id}`)}
                          className={`flex-1 w-full py-3.5 rounded-2xl font-label text-[14px] font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer border-none ${
                            overdue
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                              : 'bg-gradient-to-r from-[#006972] to-[#007a82] hover:from-[#00575f] hover:to-[#006972] text-white shadow-[#006972]/25'
                          }`}
                        >
                          <Icon name="payment" size={18} />
                          Pay Now — {formatMoney(latestActiveDue.contribution_amount)}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCalendarTarget(latestActiveDue);
                            setShowCalendarModal(true);
                          }}
                          className="w-full sm:w-auto px-4 py-3.5 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[#006972] font-label text-[13px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
                          title="Add to Google / Apple Calendar"
                        >
                          <Icon name="calendar_month" size={18} />
                          <span>Sync Calendar</span>
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </section>

            {/* EXPANDABLE: FUTURE CYCLES & PAYOUT SCHEDULE */}
            {remainingFutureCycles.length > 0 && (
              <section className="space-y-3">
                <button
                  onClick={() => setShowFutureCycles(!showFutureCycles)}
                  className="w-full p-4 rounded-2xl bg-white/60 hover:bg-white/80 border border-white/80 shadow-sm flex items-center justify-between transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#006972]/10 text-[#006972] flex items-center justify-center">
                      <Icon name="date_range" size={16} />
                    </div>
                    <div>
                      <p className="font-headline text-[14px] font-bold text-deep-navy">Future Cycles & Payout Schedule</p>
                      <p className="font-label text-[11px] text-on-surface-variant">{remainingFutureCycles.length} future cycles available</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[#006972] font-label text-[12px] font-bold">
                    <span>{showFutureCycles ? 'Hide' : 'View Future Cycles'}</span>
                    <Icon name={showFutureCycles ? 'expand_less' : 'expand_more'} size={18} />
                  </div>
                </button>

                {showFutureCycles && (
                  <div className="space-y-2.5 pl-1 animate-fadeIn">
                    {remainingFutureCycles.map((fc) => (
                      <div key={fc.cycle_id} className={`${GLASS_CARD} rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-[#006972]/30 transition-all`}>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-headline text-[14px] font-bold text-deep-navy">{fc.committee_name}</span>
                            <span className="px-2 py-0.5 rounded-full font-label text-[10px] font-bold bg-slate-100 text-slate-700">
                              Cycle {fc.cycle_number}
                            </span>
                          </div>
                          <p className="font-body text-[11px] text-on-surface-variant mt-0.5">
                            Due {formatDate(fc.due_date)} {fc.payout_turn_order ? `· Turn #${fc.payout_turn_order}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-headline text-[15px] font-bold text-[#006972]">{formatMoney(fc.contribution_amount)}</span>
                          <button
                            onClick={() => navigate(`/payments/pay/${fc.committee_id}/${fc.cycle_id}`)}
                            className="px-3 py-1.5 rounded-xl bg-[#006972]/10 hover:bg-[#006972] hover:text-white text-[#006972] font-label text-[11px] font-bold transition-all cursor-pointer border border-[#006972]/20"
                          >
                            Pay Early
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* PAYMENT HISTORY SECTION */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-headline text-[17px] font-bold text-deep-navy flex items-center gap-2">
                  <Icon name="history" size={19} className="text-[#006972]" />
                  Payment History
                </h3>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-white/50 p-1 rounded-xl border border-white/70">
                  {['all', 'paid', 'pending'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setHistoryFilter(f)}
                      className={`px-2.5 py-0.5 rounded-lg font-label text-[10px] font-bold uppercase transition-all cursor-pointer border-none ${
                        historyFilter === f ? 'bg-[#006972] text-white' : 'bg-transparent text-slate-600 hover:text-deep-navy'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className={`${GLASS_CARD} rounded-3xl p-6 text-center space-y-2`}>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100/80 text-on-surface-variant flex items-center justify-center mx-auto border border-slate-200/70">
                    <Icon name="receipt_long" size={24} />
                  </div>
                  <p className="font-body text-[12px] text-on-surface-variant">
                    No matching payment receipts found.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {filteredHistory.map((item) => {
                    const paid = item.status === 'paid';
                    const awaiting = item.status === 'awaiting_confirmation';
                    const late = paid && item.confirmed_at && item.due_date &&
                      new Date(item.confirmed_at) > new Date(`${item.due_date}T23:59:59`);

                    return (
                      <div
                        key={item.id}
                        className={`${GLASS_CARD} rounded-2xl p-4 flex items-center justify-between gap-3 hover:shadow-md transition-all`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                            paid
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : awaiting
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            <Icon name={paid ? 'check_circle' : awaiting ? 'hourglass_top' : 'receipt_long'} size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-headline text-[14px] font-bold text-deep-navy truncate">
                              {item.committee_name}
                            </p>
                            <p className={`font-label text-[11px] flex items-center gap-1 mt-0.5 ${
                              paid ? (late ? 'text-amber-600' : 'text-emerald-600') : awaiting ? 'text-amber-600' : 'text-on-surface-variant'
                            }`}>
                              Cycle {item.cycle_number} • {paid ? (late ? 'Paid late' : 'Paid on time') : awaiting ? 'Verification pending' : 'Submitted'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-label text-[10px] text-on-surface-variant uppercase font-semibold">
                            {formatDate(paid ? item.confirmed_at : item.submitted_at)}
                          </p>
                          <span className={`inline-block font-label text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                            paid ? 'bg-emerald-100 text-emerald-800' : awaiting ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {paid ? 'Confirmed' : awaiting ? 'Pending' : 'Submitted'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

      </div>
      {/* Add to Calendar Modal */}
      {calendarTarget && (
        <AddToCalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          committeeName={calendarTarget.committee_name}
          amount={calendarTarget.contribution_amount}
          startDate={calendarTarget.due_date}
        />
      )}

    </AuthAmbientBackground>
  );
}
