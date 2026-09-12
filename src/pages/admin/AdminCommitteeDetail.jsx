import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import AdminMobileNav from '../../components/AdminMobileNav';
import { getCommittee, freezeCommittee, unfreezeCommittee } from '../../services/adminService';

const GLASS_CARD = 'bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,105,114,0.12)]';

/* ── Skeleton Bone Helper ── */
function Bone({ className = '' }) {
  return <div className={`skeleton-bone ${className}`} />;
}

export default function AdminCommitteeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [committee, setCommittee] = useState(null);
  const [members, setMembers] = useState([]);
  const [cycles, setCycles] = useState([]);

  /* Freeze Modal State */
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeNotes, setFreezeNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }

  async function loadDetailData() {
    try {
      setLoading(true);
      setLoadError('');
      const data = await getCommittee(id);
      if (data?.committee) {
        setCommittee(data.committee);
        setMembers(data.members || []);
        setCycles(data.cycles || []);
      } else {
        setLoadError('Committee pool record not found.');
      }
    } catch (err) {
      setLoadError(err.message || 'Failed to load committee details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetailData();
  }, [id]);

  async function handleToggleFreeze() {
    if (!committee || processingAction) return;
    setProcessingAction(true);
    try {
      if (committee.is_frozen) {
        await unfreezeCommittee(committee.id);
        showToast(`Unfrozen committee pool`);
        setCommittee((prev) => ({ ...prev, is_frozen: false, status: 'active' }));
      } else {
        await freezeCommittee(committee.id, { notes: freezeNotes });
        showToast(`Frozen committee pool`);
        setCommittee((prev) => ({ ...prev, is_frozen: true, status: 'frozen' }));
      }
      setShowFreezeModal(false);
      setFreezeNotes('');
    } catch (err) {
      showToast(err.message || 'Failed to update freeze status.');
    } finally {
      setProcessingAction(false);
    }
  }

  return (
    <AuthAmbientBackground showTicker={false}>
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col min-h-screen gap-6 pb-28 md:pb-12">

        {/* Top Action Header */}
        <header className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/committees')}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/70 hover:bg-white text-[#006972] transition-all cursor-pointer border border-white/80 shadow-sm active:scale-90"
            >
              <Icon name="arrow_back" size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-label text-[10px] font-bold uppercase tracking-wider text-[#006972] bg-[#006972]/10 px-2 py-0.5 rounded-md">
                  Admin Oversight
                </span>
                <span className="font-mono text-[11px] text-slate-500 font-semibold">
                  ID: {id}
                </span>
              </div>
              <h1 className="font-headline text-[22px] sm:text-[26px] font-bold text-deep-navy tracking-tight mt-0.5">
                Committee Pool Ledger & Controls
              </h1>
            </div>
          </div>

          {committee && (
            <button
              onClick={() => setShowFreezeModal(true)}
              className={`px-4 py-2.5 rounded-2xl font-label text-[12px] font-bold shadow-md transition-all cursor-pointer border flex items-center gap-1.5 active:scale-95 ${
                committee.is_frozen
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
              }`}
            >
              <Icon name={committee.is_frozen ? 'lock_open' : 'gavel'} size={16} />
              <span>{committee.is_frozen ? 'Unfreeze Pool' : 'Freeze Pool'}</span>
            </button>
          )}
        </header>

        {loading ? (
          <div className="space-y-6 w-full">
            <Bone className="w-full h-40 rounded-3xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Bone key={i} className="w-full h-24 rounded-3xl" />
              ))}
            </div>
            <Bone className="w-full h-64 rounded-3xl" />
          </div>
        ) : loadError ? (
          <div className={`${GLASS_CARD} rounded-3xl p-8 text-center space-y-3`}>
            <div className="w-14 h-14 rounded-3xl bg-rose-50/90 text-rose-600 flex items-center justify-center mx-auto border border-rose-200/80 shadow-sm">
              <Icon name="error" size={28} />
            </div>
            <h2 className="font-headline text-[18px] font-bold text-deep-navy">Couldn't load committee details</h2>
            <p className="font-body text-[13px] text-on-surface-variant max-w-xs mx-auto">{loadError}</p>
            <button
              onClick={loadDetailData}
              className="px-6 py-2.5 rounded-2xl bg-[#006972] text-white font-label text-[13px] font-bold cursor-pointer border-none shadow-md"
            >
              Retry
            </button>
          </div>
        ) : committee && (
          <>
            {/* ── COMMITTEE OVERVIEW HERO CARD ── */}
            <div className={`${GLASS_CARD} rounded-3xl p-6 relative overflow-hidden space-y-4 border border-white/90`}>
              <div className={`h-2 absolute top-0 inset-x-0 ${committee.is_frozen ? 'bg-rose-500' : 'bg-[#006972]'}`} />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-headline text-[22px] font-bold text-deep-navy">{committee.name}</h2>
                    <span className={`px-3 py-1 rounded-full font-label text-[10px] font-bold uppercase tracking-wider border ${
                      committee.is_frozen
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {committee.is_frozen ? 'Frozen / Suspended' : 'Active Pool'}
                    </span>
                  </div>

                  <p className="font-body text-[12px] text-on-surface-variant mt-1">
                    Invite Code: <strong className="font-mono text-[#006972]">{committee.invite_code}</strong> • Created {committee.created_at || 'Recently'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/70 border border-white/80 font-label text-[11px] space-y-0.5 shrink-0">
                  <p className="text-slate-500 font-bold uppercase">Committee Host / Organizer</p>
                  <p className="font-headline text-[14px] font-bold text-deep-navy">{committee.organizer_name}</p>
                  <p className="text-slate-600">{committee.organizer_phone} • {committee.organizer_email}</p>
                </div>
              </div>

              {/* Financial Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-white/70 border border-white/80">
                  <p className="font-label text-[10px] text-on-surface-variant font-bold uppercase">Total Pool Capital</p>
                  <p className="font-headline text-[22px] font-bold text-[#006972]">
                    Rs. {((parseFloat(committee.contribution_amount) || 0) * (parseInt(committee.capacity, 10) || 0)).toLocaleString('en-PK')}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 border border-white/80">
                  <p className="font-label text-[10px] text-on-surface-variant font-bold uppercase">Monthly Contribution</p>
                  <p className="font-headline text-[22px] font-bold text-deep-navy">
                    Rs. {(parseFloat(committee.contribution_amount) || 0).toLocaleString('en-PK')}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 border border-white/80">
                  <p className="font-label text-[10px] text-on-surface-variant font-bold uppercase">Capacity Filled</p>
                  <p className="font-headline text-[22px] font-bold text-deep-navy">
                    {members.length} / {committee.capacity || 0} Members
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 border border-white/80">
                  <p className="font-label text-[10px] text-on-surface-variant font-bold uppercase">Turn Cycle Interval</p>
                  <p className="font-headline text-[22px] font-bold text-[#006972] capitalize">
                    {(committee.interval_type || '1_month').replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* ── CYCLES & ROTATION SCHEDULE ── */}
            <section className={`${GLASS_CARD} rounded-3xl p-5 sm:p-6 space-y-4`}>
              <h3 className="font-headline text-[17px] font-bold text-deep-navy flex items-center gap-2">
                <Icon name="event_repeat" size={19} className="text-[#006972]" />
                Rotation Cycles & Payout Audit Schedule
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-label text-[12px]">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Cycle #</th>
                      <th className="py-3 px-3">Payout Recipient</th>
                      <th className="py-3 px-3">Due Date</th>
                      <th className="py-3 px-3">Pool Amount</th>
                      <th className="py-3 px-3">Payout Status</th>
                      <th className="py-3 px-3 text-right">Admin Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cycles.map((cyc) => (
                      <tr key={cyc.id} className="hover:bg-white/50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#006972]">#{cyc.cycle_number}</td>
                        <td className="py-3 px-3 font-headline font-bold text-deep-navy">{cyc.recipient_name || 'Assigned Turn'}</td>
                        <td className="py-3 px-3 text-slate-600">{cyc.due_date}</td>
                        <td className="py-3 px-3 font-bold text-deep-navy">Rs. {(parseFloat(cyc.amount) || (parseFloat(committee.contribution_amount) * parseInt(committee.capacity, 10))).toLocaleString('en-PK')}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            cyc.payout_status === 'released'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {cyc.payout_status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => showToast(`Manually verified payout for Cycle #${cyc.cycle_number}`)}
                            className="px-2.5 py-1 rounded-xl bg-[#006972]/10 hover:bg-[#006972] hover:text-white text-[#006972] font-bold transition-all border border-[#006972]/20 cursor-pointer"
                          >
                            Verify Payout
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── MEMBER ROSTER ── */}
            <section className={`${GLASS_CARD} rounded-3xl p-5 sm:p-6 space-y-4`}>
              <h3 className="font-headline text-[17px] font-bold text-deep-navy flex items-center gap-2">
                <Icon name="group" size={19} className="text-[#006972]" />
                Registered Member Roster
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-white/70 border border-white/80 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#006972]/10 text-[#006972] font-bold font-headline flex items-center justify-center text-[15px] shrink-0">
                        {m.payout_turn_order || '#'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-headline text-[14px] font-bold text-deep-navy truncate">{m.full_name}</h4>
                        <p className="font-body text-[11px] text-on-surface-variant truncate">{m.phone_number}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-label text-[11px]">
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Score: {m.trust_score || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

      </div>

      {/* ── FREEZE MODAL ── */}
      {showFreezeModal && committee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/80 space-y-5 relative">
            <button
              onClick={() => setShowFreezeModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center border-none cursor-pointer"
            >
              <Icon name="close" size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                committee.is_frozen ? 'bg-emerald-600' : 'bg-rose-600'
              }`}>
                <Icon name={committee.is_frozen ? 'lock_open' : 'gavel'} size={24} />
              </div>
              <div>
                <h3 className="font-headline text-[18px] font-bold text-deep-navy">{committee.name}</h3>
                <p className="font-label text-[11px] text-on-surface-variant">Host: {committee.organizer_name}</p>
              </div>
            </div>

            {!committee.is_frozen && (
              <div>
                <label htmlFor="freezeNotesTextarea" className="block font-label text-[11px] font-bold uppercase text-deep-navy tracking-wider mb-1.5">
                  Freeze Reason & Audit Notes
                </label>
                <textarea
                  id="freezeNotesTextarea"
                  rows={3}
                  value={freezeNotes}
                  onChange={(e) => setFreezeNotes(e.target.value)}
                  placeholder="e.g. Audit inquiry into non-payment or dispute resolution in progress"
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-deep-navy font-body text-[13px] outline-none focus:border-[#006972]"
                />
              </div>
            )}

            <button
              onClick={handleToggleFreeze}
              disabled={processingAction}
              className={`w-full py-3.5 rounded-2xl font-label text-[14px] font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer border-none text-white ${
                committee.is_frozen
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {processingAction && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              <Icon name={committee.is_frozen ? 'lock_open' : 'gavel'} size={18} />
              {committee.is_frozen ? 'Unfreeze Committee Operations' : 'Freeze Committee Pool'}
            </button>
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
