import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import { getCommitteeById } from '../../services/committeeService';
import { getCyclePayments, releasePayout } from '../../services/paymentService';

const GLASS_CARD = 'bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,105,114,0.12)]';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Skeleton Bone Helper ── */
function Bone({ className = '' }) {
  return <span className={`skeleton-bone inline-block ${className}`} />;
}

export default function ReleasePayout() {
  const navigate = useNavigate();
  const { committeeId, cycleId } = useParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [committee, setCommittee] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);

  const [releasing, setReleasing] = useState(false);
  const [released, setReleased] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setLoadError('');
        const data = await getCommitteeById(committeeId);
        if (cancelled) return;

        const c = data?.committee || {};
        setCommittee(c);
        setMembers((data?.members || []).filter((m) => m.status === 'approved'));

        if (c.my_role !== 'organizer' && c.my_role !== 'co_organizer') {
          setLoadError('Only the organizer or co-organizer can release payouts.');
          return;
        }

        const cycles = data?.cycles || [];
        const target = cycleId
          ? cycles.find((cy) => cy.id === cycleId)
          : cycles.find((cy) => cy.status === 'collecting');
        setCycle(target || null);

        if (target) {
          setReleased(target.payout_status === 'sent' || target.payout_status === 'confirmed');
          const payData = await getCyclePayments(committeeId, target.id);
          if (!cancelled) setPayments(payData?.payments || []);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Failed to load payout details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (committeeId) {
      load();
    } else {
      setLoadError('No committee selected for this payout.');
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [committeeId, cycleId]);

  const poolAmount = committee ? (parseFloat(committee.contribution_amount) || 0) * (parseInt(committee.capacity, 10) || 0) : 0;
  const paidCount = payments.filter((p) => p.status === 'paid').length;
  const totalPayers = members.length;
  const allPaid = totalPayers > 0 && paidCount >= totalPayers;
  const progressPct = totalPayers > 0 ? Math.round((paidCount / totalPayers) * 100) : 0;
  const recipientName = cycle?.recipient_name || '—';

  async function handleRelease() {
    if (!cycle || releasing) return;
    setReleasing(true);
    try {
      await releasePayout(committeeId, cycle.id);
      setReleased(true);
      showToast('Payout released! The recipient has been notified.');
    } catch (err) {
      showToast(err.message || 'Failed to release payout.');
    } finally {
      setReleasing(false);
    }
  }

  /* ── Skeleton Loading Screen ── */
  if (loading) {
    return (
      <AuthAmbientBackground showTicker={false}>
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col min-h-[calc(100vh-36px)] gap-5">
          {/* Header Skeleton */}
          <header className="w-full flex items-center justify-between">
            <Bone className="w-11 h-11 rounded-full shrink-0" />
            <Bone className="w-44 h-6 rounded-xl" />
            <div className="w-11" />
          </header>

          {/* Banner Skeleton */}
          <div className="bg-white/60 rounded-3xl p-6 text-center space-y-3 border border-white/70 shadow-sm flex flex-col items-center">
            <Bone className="w-16 h-16 rounded-full" />
            <Bone className="w-48 h-6 rounded-xl" />
            <Bone className="w-64 h-4 rounded-lg" />
          </div>

          {/* Recipient Skeleton */}
          <div className={`${GLASS_CARD} rounded-3xl p-5 flex items-center gap-4`}>
            <Bone className="w-14 h-14 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1"><Bone className="w-36 h-5 rounded-lg" /><Bone className="w-28 h-3 rounded-lg" /></div>
          </div>

          {/* Progress Skeleton */}
          <div className={`${GLASS_CARD} rounded-3xl p-5 space-y-3`}>
            <div className="flex justify-between items-center"><Bone className="w-32 h-3 rounded-lg" /><Bone className="w-24 h-5 rounded-full" /></div>
            <Bone className="w-full h-3 rounded-full" />
            <div className="flex gap-2"><Bone className="w-20 h-6 rounded-full" /><Bone className="w-24 h-6 rounded-full" /><Bone className="w-18 h-6 rounded-full" /></div>
          </div>

          {/* Amount Skeleton */}
          <div className={`${GLASS_CARD} rounded-3xl p-5 flex justify-between items-end`}>
            <div className="space-y-2"><Bone className="w-28 h-3 rounded-lg" /><Bone className="w-36 h-8 rounded-xl" /></div>
            <div className="space-y-2 text-right"><Bone className="w-24 h-3 rounded-lg ml-auto" /><Bone className="w-28 h-4 rounded-lg ml-auto" /></div>
          </div>

          <Bone className="w-full h-14 rounded-2xl" />
        </div>
      </AuthAmbientBackground>
    );
  }

  if (loadError) {
    return (
      <AuthAmbientBackground showTicker={false}>
        <div className="w-full max-w-2xl mx-auto px-6 py-16 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50/80 text-rose-600 flex items-center justify-center border border-rose-200/70">
            <Icon name="error" size={28} />
          </div>
          <h1 className="font-headline text-[20px] font-bold text-deep-navy">Couldn't load payout</h1>
          <p className="font-body text-[13px] text-on-surface-variant">{loadError}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-2xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[13px] font-bold cursor-pointer border-none shadow-md"
          >
            Go Back
          </button>
        </div>
      </AuthAmbientBackground>
    );
  }

  return (
    <AuthAmbientBackground showTicker={false}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col min-h-[calc(100vh-36px)] gap-5 pb-28 md:pb-12">

        {/* Header */}
        <header className="w-full flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/70 text-[#006972] transition-colors cursor-pointer active:scale-95 backdrop-blur-xl border border-white/70 shadow-[0_4px_20px_rgba(0,105,114,0.12)]"
          >
            <Icon name="arrow_back" size={20} />
          </button>
          <h1 className="font-headline text-[22px] sm:text-[24px] font-bold text-deep-navy tracking-tight">
            Release Payout
          </h1>
          <div className="w-11" />
        </header>

        {/* Ready / Released Banner */}
        <section className={`rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden border shadow-[0_16px_48px_rgba(0,105,114,0.35)] ${
          released
            ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 border-emerald-700/40'
            : 'bg-gradient-to-br from-[#006972] via-[#007a82] to-[#005f66] border-[#006972]/30'
        }`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-md border-2 border-white/30 flex items-center justify-center mb-4 relative z-10 shadow-md">
            <Icon name={released ? 'task_alt' : 'celebration'} size={32} className="text-white" />
          </div>
          <h2 className="font-headline text-[22px] font-bold text-white mb-2 relative z-10">
            {released ? 'Payout Released' : allPaid ? 'Ready for Release' : 'Awaiting Payments'}
          </h2>
          <p className="font-body text-[14px] text-white/85 max-w-xs leading-relaxed relative z-10">
            {released
              ? `The pool of Rs. ${poolAmount.toLocaleString('en-PK')} was sent to ${recipientName}.`
              : allPaid
                ? <>All members have paid for this cycle. You can now release the pool to <strong className="text-white">{recipientName}</strong>.</>
                : <>Cycle {cycle?.cycle_number ?? '—'} still has unpaid members. The release unlocks once every contribution is verified.</>}
          </p>
        </section>

        {/* Recipient Details */}
        <section className={`${GLASS_CARD} rounded-3xl p-5 sm:p-6 relative overflow-hidden`}>
          <div className="absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-[#006972]/40 to-transparent" />
          <h3 className="font-label text-[11px] text-on-surface-variant uppercase tracking-widest mb-4">Recipient Details</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#006972] to-[#007a82] text-white flex items-center justify-center font-headline text-[20px] font-bold shadow-md shrink-0">
              {recipientName !== '—' ? recipientName.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="min-w-0">
              <h4 className="font-headline text-[18px] font-bold text-deep-navy truncate">{recipientName}</h4>
              <p className="font-label text-[12px] text-[#006972] flex items-center gap-1 mt-1">
                <Icon name="verified_user" size={14} /> Cycle {cycle?.cycle_number ?? '—'} Recipient
              </p>
            </div>
          </div>
        </section>

        {/* Collection Progress */}
        <section className={`${GLASS_CARD} rounded-3xl p-5 sm:p-6 space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="font-label text-[11px] text-on-surface-variant uppercase tracking-widest">Collection Status</h3>
            <span className="font-label text-[11px] font-bold text-[#006972] bg-[#006972]/10 px-2.5 py-0.5 rounded-full border border-[#006972]/20">
              {paidCount} / {totalPayers} verified
            </span>
          </div>

          <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden border border-white/70">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #006972, #34d399)' }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const paid = payments.some((p) => p.user_id === m.user_id && p.status === 'paid');
              return (
                <span
                  key={m.id}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label text-[11px] font-bold border ${
                    paid
                      ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/70'
                      : 'bg-amber-50/80 text-amber-700 border-amber-200/70'
                  }`}
                >
                  <Icon name={paid ? 'check_circle' : 'hourglass_top'} size={13} />
                  {m.full_name}
                </span>
              );
            })}
          </div>
        </section>

        {/* Payout Amount */}
        <section className={`${GLASS_CARD} rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-end gap-2`}>
          <div>
            <p className="font-label text-[11px] text-on-surface-variant uppercase tracking-wider mb-1.5">Payout Amount</p>
            <p className="font-headline text-[36px] sm:text-[42px] font-bold text-[#006972] leading-none tabular-nums">
              Rs. {poolAmount.toLocaleString('en-PK')}
            </p>
          </div>
          <div className="sm:text-right pb-1">
            <p className="font-label text-[11px] text-on-surface-variant mb-1">Cycle Due Date</p>
            <p className="font-body text-[15px] text-deep-navy font-semibold">{formatDate(cycle?.due_date)}</p>
          </div>
        </section>

        {/* Action */}
        <div className="flex flex-col items-center gap-3">
          {released ? (
            <button
              onClick={() => navigate(`/committee/${committeeId}`)}
              className="w-full bg-gradient-to-r from-[#006972] to-[#007a82] hover:from-[#00575f] hover:to-[#006972] text-white font-label text-[15px] py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_12px_36px_rgba(0,105,114,0.35)] cursor-pointer border-none"
            >
              <Icon name="arrow_back" size={18} />
              Back to Committee
            </button>
          ) : (
            <button
              onClick={handleRelease}
              disabled={!allPaid || releasing}
              className="w-full bg-gradient-to-r from-[#006972] to-[#007a82] hover:from-[#00575f] hover:to-[#006972] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-white font-label text-[15px] py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_12px_36px_rgba(0,105,114,0.35)] hover:shadow-xl transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer border-none"
            >
              {releasing ? (
                <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Icon name="send_money" size={22} />
              )}
              {releasing ? 'Releasing…' : 'Release Payout'}
            </button>
          )}
          <p className="font-label text-[12px] text-on-surface-variant flex items-center gap-1.5 opacity-80">
            <Icon name="lock" size={14} /> This action notifies the recipient and closes the cycle.
          </p>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-[#006972] text-white px-5 py-3 rounded-2xl shadow-xl font-label text-[13px] font-bold flex items-center gap-2 border border-white/20 backdrop-blur-xl">
            <Icon name="check_circle" size={18} className="text-emerald-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </AuthAmbientBackground>
  );
}
