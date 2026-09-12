import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import logo from '../../assets/screen.png';
import { useNavDrawer } from '../../context/NavDrawerContext';
import { getCommitteeById, requestPublicToggle, approvePublicToggle } from '../../services/committeeService';
import { getCyclePayments, confirmPayment } from '../../services/paymentService';
import { memberService } from '../../services';
import ReportUserModal from '../../components/ReportUserModal';
import AddToCalendarModal from '../../components/AddToCalendarModal';

import { resolvePhotoUrl, getBackendUrl } from '../../utils/backendUrl';

export default function CommitteeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { openDrawer } = useNavDrawer();

  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'members' | 'requests' | 'progress'
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTab, setInviteTab] = useState('link'); // 'link' | 'userid'
  const [manualUserId, setManualUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [paymentToVerify, setPaymentToVerify] = useState(null); // { member, payment }
  const [verifying, setVerifying] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Report User State
  const [reportTargetUser, setReportTargetUser] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Add to Calendar State
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const currentUserId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('sanjhi_user') || '{}');
      return u?.id || u?.userId;
    } catch {
      return null;
    }
  })();

  function openReportModal(target) {
    setReportTargetUser(target);
    setShowReportModal(true);
  }

  // Committee State
  const [committee, setCommittee] = useState({
    id: id || '1',
    name: 'Committee',
    contributionAmount: 5000,
    capacity: 10,
    intervalType: '1_month',
    myRole: null, // 'organizer' | 'co_organizer' | 'member' | 'viewer'
    userRole: 'Participant',
    inviteCode: '',
    inviteLink: '',
    accountTitle: '',
    accountNumber: '',
    provider: 'JazzCash',
  });

  // Members list
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [cyclePayments, setCyclePayments] = useState([]);

  // Toast helper — shows the message and auto-clears after 3.5s
  function showToast(message) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3500);
  }

  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true);
        const data = await getCommitteeById(id || '1');
        if (data?.committee) {
          const rawRole = data.committee.my_role || 'member';
          setCommittee((prev) => ({
            ...prev,
            ...data.committee,
            myRole: rawRole,
            userRole: rawRole === 'organizer'
              ? 'Organizer'
              : rawRole === 'co_organizer' ? 'Co-Organizer' : 'Participant',
            contributionAmount: parseFloat(data.committee.contribution_amount || data.committee.contributionAmount || 5000),
            capacity: parseInt(data.committee.capacity, 10) || 10,
            inviteCode: data.committee.invite_code || data.committee.inviteCode || '',
            inviteLink: data.committee.invite_link || data.committee.inviteLink || '',
          }));
        }
        if (data?.members && Array.isArray(data.members)) {
          const approved = data.members
            .filter(m => m.status === 'approved')
            .map(m => ({
              ...m,
              name: m.full_name,
              photo: m.profile_photo_url,
              turn: m.payout_turn_order,
              role: m.is_organizer ? 'Organizer' : m.is_co_organizer ? 'Co-Organizer' : 'Member',
            }));
          const pending = data.members.filter(m => m.status === 'pending');
          setMembers(approved);
          setPendingRequests(pending);
        }
        if (data?.cycles && Array.isArray(data.cycles)) {
          setCycles(data.cycles);
          const active = data.cycles.find((cy) => cy.status === 'collecting') || data.cycles[0];
          if (active) setSelectedCycleId(active.id);
        }
      } catch (err) {
        console.error('Failed to load committee:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function loadPayments() {
      if (!selectedCycleId) return;
      try {
        const data = await getCyclePayments(id || '1', selectedCycleId);
        if (!cancelled) setCyclePayments(data?.payments || []);
      } catch (err) {
        if (!cancelled) setCyclePayments([]);
      }
    }

    loadPayments();
    return () => { cancelled = true; };
  }, [id, selectedCycleId]);

  async function handleRequestAction(memberId, actionStatus) {
    try {
      const token = localStorage.getItem('sanjhi_token');
      const res = await fetch(`${BACKEND_URL}/api/committees/${id}/requests/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: actionStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update request');

      showToast(data.message || `Member request successfully ${actionStatus}!`);
      // Remove from pending list
      setPendingRequests(prev => prev.filter(r => r.id !== memberId));
      // Move to members list if approved (prefer the backend's returned member row)
      if (actionStatus === 'approved') {
        const updated = data.member || pendingRequests.find(r => r.id === memberId);
        if (updated) {
          setMembers(prev => [...prev, {
            ...updated,
            name: updated.full_name,
            photo: updated.profile_photo_url,
            turn: updated.payout_turn_order || prev.length + 1,
            role: 'Member',
            status: 'approved',
          }]);
        }
      }
    } catch (err) {
      showToast(err.message || 'Action failed.');
    }
  }

  async function handleManualAddUser(e) {
    e.preventDefault();
    if (!manualUserId.trim() || addingMember) return;
    const cleanId = manualUserId.trim();
    setAddMemberError('');
    setAddingMember(true);

    try {
      const res = await memberService.addMemberDirectly(id || '1', { identifier: cleanId });
      if (res?.member) {
        setMembers(prev => {
          // Prevent duplicates in state
          const filtered = prev.filter(m => m.user_id !== res.member.user_id && m.id !== res.member.id);
          return [...filtered, {
            ...res.member,
            turn: res.member.payout_turn_order || filtered.length + 1,
            status: 'approved',
          }];
        });
        showToast(res.message || `Participant ${res.member.full_name || cleanId} added to committee! ✓`);
        setManualUserId('');
        setShowInviteModal(false);
      }
    } catch (err) {
      console.error('Error adding member directly:', err);
      setAddMemberError(err.message || 'Failed to add participant.');
      showToast(err.message || 'Failed to add participant.');
    } finally {
      setAddingMember(false);
    }
  }

  function openVerifyModal(member, payment) {
    setPaymentToVerify({ member, payment });
    setShowVerifyModal(true);
  }

  async function handleConfirmVerification() {
    const target = paymentToVerify;
    if (!target || verifying || !selectedCycleId) return;
    setVerifying(true);
    try {
      await confirmPayment(id || '1', selectedCycleId, target.payment.id);
      setCyclePayments((prev) =>
        prev.map((p) => (p.id === target.payment.id ? { ...p, status: 'paid' } : p))
      );
      setShowVerifyModal(false);
      setPaymentToVerify(null);
      showToast(`Payment from ${target.member.name || target.payment.full_name} verified!`);
    } catch (err) {
      showToast(err.message || 'Failed to verify payment.');
    } finally {
      setVerifying(false);
    }
  }

  async function handlePublicToggle() {
    if (toggleLoading) return;
    setToggleLoading(true);
    try {
      const data = await requestPublicToggle(id || '1');
      setCommittee((prev) => ({ ...prev, ...data.committee }));
      showToast(data.message);
    } catch (err) {
      showToast(err.data?.error || err.message || 'Failed to toggle visibility.');
    } finally {
      setToggleLoading(false);
    }
  }

  async function handleApproveToggle() {
    if (toggleLoading) return;
    setToggleLoading(true);
    try {
      const data = await approvePublicToggle(id || '1');
      setCommittee((prev) => ({ ...prev, ...data.committee }));
      showToast(data.message);
    } catch (err) {
      showToast(err.data?.error || err.message || 'Failed to approve toggle.');
    } finally {
      setToggleLoading(false);
    }
  }

  const paidCount = cyclePayments.filter((p) => p.status === 'paid').length;
  const selectedCycle = cycles.find((cy) => cy.id === selectedCycleId) || null;
  const totalPoolAmount = committee.contributionAmount * committee.capacity;
  const collectedAmount = paidCount * committee.contributionAmount;
  const progressPct = Math.round((paidCount / committee.capacity) * 100);

  const isManagementRole = committee.myRole === 'organizer' || committee.myRole === 'co_organizer';
  const activeCycle = cycles.find((cy) => cy.status === 'collecting') || null;
  const tabs = [
    { id: 'ledger', label: 'Ledger', icon: 'receipt_long' },
    { id: 'members', label: `Members (${members.length})`, icon: 'groups' },
    ...(isManagementRole
      ? [{ id: 'requests', label: `Requests (${pendingRequests.length})`, icon: 'person_add' }]
      : []),
    { id: 'progress', label: 'Rotation', icon: 'timeline' },
  ];
  const visibleTab = activeTab === 'requests' && !isManagementRole ? 'ledger' : activeTab;

  return (
    <div className="min-h-screen bg-white text-deep-navy font-body antialiased relative overflow-x-hidden pb-28 md:pb-12">

      {/* ── AMBIENT BACKGROUND LAYER (GPU-OPTIMIZED) ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        style={{ contain: 'strict', transform: 'translateZ(0)' }}
      >
        <div className="absolute inset-0 opacity-[0.28]"
          style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #006972 1.2px, transparent 1.2px)', backgroundSize: '28px 28px' }} />
        <div
          className="absolute w-[500px] h-[500px] rounded-full top-[-150px] left-[-150px] pointer-events-none opacity-35"
          style={{ background: 'radial-gradient(circle, rgba(0,105,114,0.18) 0%, rgba(0,105,114,0.03) 50%, transparent 70%)' }}
        />
        <div
          className="absolute w-[450px] h-[450px] rounded-full bottom-[-100px] right-[-100px] pointer-events-none opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.03) 50%, transparent 70%)' }}
        />
        <img src={logo} alt="" aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[480px] md:w-[650px] opacity-[0.035] select-none pointer-events-none" />
      </div>

      {/* ── MODERN GLASS NAVBAR ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#006972]/12 shadow-sm">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-14 sm:h-18 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 border border-[#006972]/12 text-[#006972] transition-colors cursor-pointer active:scale-95"
              aria-label="Back to Dashboard"
            >
              <Icon name="arrow_back" size={17} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#006972]/10 text-[#006972] font-label text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                  {committee.userRole}
                </span>
                {committee.is_public ? (
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-label text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                    Public
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-label text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                    Private
                  </span>
                )}
                <span className="text-[10px] sm:text-[11px] font-label text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold hidden sm:inline">
                  Cycle {selectedCycle?.cycle_number ?? '—'} of {committee.capacity}
                </span>
              </div>
              <h1 className="font-headline text-[15px] sm:text-[19px] font-bold text-[#006972] leading-tight truncate">
                {committee.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-[#006972]/10 hover:bg-[#006972]/18 text-[#006972] font-label text-[11px] sm:text-[12px] font-bold border border-[#006972]/20 transition-all active:scale-95 cursor-pointer"
            >
              <Icon name="person_add" size={15} />
              <span className="hidden xs:inline">Invite</span>
            </button>

            <button
              onClick={() => setShowCalendarModal(true)}
              className="hidden sm:flex p-2 sm:p-2.5 rounded-full bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[#006972] transition-all active:scale-95 cursor-pointer"
              title="Add Payment Schedule to Google / Apple Calendar"
            >
              <Icon name="calendar_month" size={16} />
            </button>

            <button
              onClick={() => openReportModal({ id: committee.created_by || committee.organizer_id, name: committee.organizer_name || 'Committee Organizer' })}
              className="hidden sm:flex p-2 sm:p-2.5 rounded-full bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition-all active:scale-95 cursor-pointer"
              title="Report Organizer or Pool Issue"
            >
              <Icon name="flag" size={16} />
            </button>

            <button
              onClick={() => navigate(`/committee/${id || '1'}/settings`)}
              className="p-2 sm:p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-deep-navy transition-all active:scale-95 cursor-pointer"
              title="Committee Settings"
            >
              <Icon name="settings" size={17} />
            </button>

            {/* Mobile Menu Drawer Toggle */}
            <button
              onClick={openDrawer}
              className="md:hidden p-2 sm:p-2.5 rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 border border-[#006972]/20 text-[#006972] transition-all active:scale-95 cursor-pointer"
              aria-label="Open Navigation Menu"
              title="Open Menu"
            >
              <Icon name="menu" size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── TOAST MESSAGE ── */}
      {toastMessage && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:right-6 z-50 bg-[#006972] text-white px-5 py-3 rounded-2xl shadow-xl font-label text-[13px] font-bold flex items-center gap-2 border border-white/20 animate-bounce-short">
          <Icon name="check_circle" size={18} className="text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 pt-5 pb-4 space-y-5 relative z-10">

        {/* ════════════════════════════════════════════
            HERO OVERVIEW BANNER CARD
        ════════════════════════════════════════════ */}
        <section className="bg-gradient-to-br from-[#006972] via-[#007a82] to-[#005f66] rounded-3xl p-5 sm:p-7 shadow-xl shadow-[#006972]/25 relative overflow-hidden text-white">
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Financial Overview stats */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/15 text-white font-label text-[11px] font-bold border border-white/20 uppercase tracking-wider">
                  Cycle #{selectedCycle?.cycle_number ?? '—'} Active Pool
                </span>
                <span className="text-[11px] font-label text-emerald-300 font-bold bg-black/20 px-2.5 py-0.5 rounded-full">
                  Monthly Rotation
                </span>
              </div>

              <div>
                <p className="font-label text-[11px] uppercase tracking-widest text-white/70">Total Cycle Pool Payout</p>
                <h2 className="font-headline text-[32px] sm:text-[40px] font-extrabold text-white tracking-tight leading-none tabular-nums">
                  Rs. {totalPoolAmount.toLocaleString()}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[13px] font-body text-white/85">
                <span className="flex items-center gap-1">
                  <Icon name="payments" size={15} className="text-white/70" />
                  Rs. {committee.contributionAmount.toLocaleString()} / member
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="groups" size={15} className="text-white/70" />
                  {committee.capacity} Total Slots
                </span>
              </div>
            </div>

            {/* Collection Progress Box */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 shrink-0 w-full md:w-72 space-y-3">
              <div className="flex justify-between items-center text-[12px] font-label font-bold text-white/90">
                <span>Collection Progress</span>
                <span className="text-emerald-300">{paidCount} of {committee.capacity} Paid</span>
              </div>

              <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/20">
                <div className="h-full rounded-full transition-all duration-[1200ms] ease-out"
                  style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #fcd34d, #6ee7b7)' }} />
              </div>

              <div className="flex justify-between text-[11px] font-label text-white/75">
                <span>Rs. {collectedAmount.toLocaleString()} collected</span>
                <span>{progressPct}%</span>
              </div>

              {isManagementRole && (
                <button
                  disabled={paidCount < members.length}
                  onClick={() => navigate(`/payments/release/${id}/${selectedCycleId}`)}
                  className="w-full py-2.5 rounded-xl font-label text-[12px] font-bold bg-white text-[#006972] hover:bg-emerald-50 transition-all shadow-md active:scale-95 cursor-pointer border-none flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name={paidCount < members.length ? 'lock' : 'lock_open'} size={15} />
                  {paidCount < members.length ? 'Payout Locked (Pending Dues)' : 'Release Payout'}
                </button>
              )}
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════════════
            VISIBILITY MANAGEMENT CARD
        ════════════════════════════════════════════ */}
        {isManagementRole && (
          <div className="bg-white rounded-3xl border-2 border-[#006972]/12 shadow-sm p-5 sm:p-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0">
                  <Icon name={committee.is_public ? 'public' : 'lock'} size={22} />
                </div>
                <div>
                  <h3 className="font-headline text-[16px] font-bold text-deep-navy">
                    {committee.is_public ? 'Public Marketplace Listing' : 'Private Committee'}
                  </h3>
                  <p className="font-body text-[12px] text-on-surface-variant mt-0.5">
                    {committee.is_public
                      ? 'Anyone can discover and request to join. CNIC verification is required.'
                      : 'Only people with the invite code can join.'}
                  </p>
                  {committee.public_toggle_requested_by && (
                    <p className="font-body text-[12px] text-amber-700 mt-1.5 flex items-center gap-1">
                      <Icon name="schedule" size={14} />
                      Pending {committee.is_public ? 'private' : 'public'} toggle request
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {committee.public_toggle_requested_by && committee.myRole !== 'organizer' && (
                  <button
                    onClick={handleApproveToggle}
                    disabled={toggleLoading}
                    className="px-4 py-2 rounded-xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[12px] font-bold transition-all shadow-sm cursor-pointer border-none flex items-center gap-1"
                  >
                    <Icon name="check" size={16} /> Approve Toggle
                  </button>
                )}
                {(!committee.public_toggle_requested_by || committee.myRole === 'organizer') && (
                  <button
                    onClick={handlePublicToggle}
                    disabled={toggleLoading}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-deep-navy font-label text-[12px] font-bold transition-all cursor-pointer border border-slate-200 flex items-center gap-1"
                  >
                    {toggleLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-deep-navy border-t-transparent animate-spin" />
                        Updating…
                      </>
                    ) : (
                      <>
                        <Icon name={committee.is_public ? 'visibility_off' : 'public'} size={16} />
                        {committee.is_public ? 'Make Private' : 'Make Public'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            NAVIGATION TABS (Ledger | Members | Requests* | Rotation)
            * Requests visible to Organizer / Co-Organizer only
        ════════════════════════════════════════════ */}
        <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {tabs.map((tab) => {
            const active = visibleTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 px-3 rounded-xl font-label text-[13px] font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 relative ${
                  active ? 'bg-[#006972] text-white shadow-md' : 'bg-transparent text-deep-navy/70 hover:bg-slate-200'
                }`}
              >
                <Icon name={tab.icon} size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-[11px]">{tab.id === 'ledger' ? 'Ledger' : tab.id === 'members' ? 'Members' : tab.id === 'requests' ? 'Reqs' : 'Rotation'}</span>
                {tab.id === 'requests' && pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════
            TAB 1: LEDGER & PAYMENTS
        ════════════════════════════════════════════ */}
        {visibleTab === 'ledger' && (
          <div className="space-y-4 animate-fade-in">

            {/* Pay My Dues Banner */}
            {activeCycle && (
              <div className="bg-gradient-to-r from-[#006972] to-[#007a82] rounded-3xl p-4 sm:p-5 shadow-lg shadow-[#006972]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0">
                    <Icon name="payments" size={24} />
                  </div>
                  <div>
                    <p className="font-headline text-[15px] font-bold text-white">
                      Your Cycle {activeCycle.cycle_number} Contribution
                    </p>
                    <p className="font-body text-[12px] text-white/80">
                      Rs. {committee.contributionAmount.toLocaleString()} • Due {activeCycle.due_date ? new Date(activeCycle.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/payments/pay/${id || '1'}/${activeCycle.id}`)}
                  className="px-5 py-2.5 rounded-xl bg-white text-[#006972] font-label text-[13px] font-bold shadow-md hover:bg-emerald-50 transition-all active:scale-95 cursor-pointer border-none shrink-0"
                >
                  Pay Now
                </button>
              </div>
            )}

            {/* Cycle Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {cycles.length === 0 && (
                <span className="font-body text-[13px] text-on-surface-variant py-2">No cycles scheduled yet.</span>
              )}
              {cycles.map((cy) => (
                <button
                  key={cy.id}
                  onClick={() => setSelectedCycleId(cy.id)}
                  className={`px-4 py-2 rounded-xl text-[12px] font-label font-bold whitespace-nowrap transition-all cursor-pointer border-none shrink-0 ${
                    selectedCycleId === cy.id
                      ? 'bg-[#006972] text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-deep-navy/70'
                  }`}
                >
                  Cycle {cy.cycle_number} {cy.status === 'collecting' ? '(Active)' : ''}
                </button>
              ))}
            </div>

            {/* Member Payment Status Rows */}
            <div className="bg-white rounded-3xl border-2 border-[#006972]/12 shadow-sm overflow-hidden divide-y divide-slate-100">
              {members.map((member) => {
                const payment = cyclePayments.find((p) => p.user_id === member.user_id) || null;
                const isOverdue =
                  (!payment || payment.status !== 'paid') &&
                  selectedCycle &&
                  new Date(selectedCycle.due_date) < new Date();

                return (
                  <div key={member.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">

                    {/* Left info */}
                    <div className="flex items-center gap-3">
                      <img
                        src={member.photo ? resolvePhotoUrl(member.photo) : '/avatar.svg'}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#006972]/20"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-headline text-[14px] font-bold text-deep-navy">{member.name}</p>
                          {member.role !== 'Member' && (
                            <span className="px-2 py-0.5 rounded-full bg-[#006972]/10 text-[#006972] font-label text-[10px] font-bold">
                              {member.role}
                            </span>
                          )}
                          <span className="text-[11px] font-label text-on-surface-variant/70 font-semibold">Turn #{member.turn}</span>
                        </div>
                        <p className="font-body text-[12px] text-on-surface-variant">
                          Due: <strong className="text-deep-navy">Rs. {committee.contributionAmount.toLocaleString()}</strong>
                          {payment?.sender_account_details ? ` • Sent from: ${payment.sender_account_details}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Right Status Badges & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      {payment?.status === 'paid' && (
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-label text-[11px] font-bold flex items-center gap-1">
                          <Icon name="check_circle" size={14} /> Paid ✓
                        </span>
                      )}

                      {payment?.status === 'awaiting_confirmation' && (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-label text-[11px] font-bold flex items-center gap-1">
                            <Icon name="schedule" size={14} /> Verification Pending
                          </span>
                          {isManagementRole && (
                            <button
                              onClick={() => openVerifyModal(member, payment)}
                              className="px-3 py-1 rounded-xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[12px] font-bold transition-all shadow-sm cursor-pointer border-none"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      )}

                      {!payment && isOverdue && (
                        <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-label text-[11px] font-bold flex items-center gap-1">
                          <Icon name="warning" size={14} /> Overdue
                        </span>
                      )}

                      {!payment && !isOverdue && (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-on-surface-variant font-label text-[11px] font-medium border border-slate-200">
                          Upcoming
                        </span>
                      )}

                      {(member.user_id || member.id) !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => openReportModal(member)}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer shrink-0"
                          title={`Report ${member.name || member.full_name} to admin`}
                          aria-label={`Report ${member.name || member.full_name}`}
                        >
                          <Icon name="flag" size={15} />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════
            TAB 2: MEMBERS LIST
        ════════════════════════════════════════════ */}
        {visibleTab === 'members' && (
          <div className="bg-white rounded-3xl border-2 border-[#006972]/12 shadow-sm overflow-hidden p-5 sm:p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#006972]/10 pb-3">
              <h3 className="font-headline text-[17px] font-bold text-[#006972] flex items-center gap-2">
                <Icon name="groups" size={20} />
                Enrolled Committee Members ({members.length} / {committee.capacity})
              </h3>
              <button
                onClick={() => setShowInviteModal(true)}
                className="font-label text-[12px] font-bold text-[#006972] hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
              >
                <Icon name="person_add" size={15} /> Add Member
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((member) => {
                const memberUserId = member.user_id || member.id;
                const isSelf = memberUserId === currentUserId;
                return (
                  <div key={member.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={member.photo ? resolvePhotoUrl(member.photo) : '/avatar.svg'}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#006972]/20 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-headline text-[14px] font-bold text-deep-navy truncate">{member.name || member.full_name}</p>
                        <p className="font-body text-[12px] text-on-surface-variant truncate">{member.phone || member.phone_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="font-label text-[11px] font-bold text-[#006972] bg-[#006972]/10 px-2.5 py-0.5 rounded-full block mb-1">
                          Turn #{member.turn || member.payout_turn_order || 1}
                        </span>
                        <span className="font-label text-[10px] text-emerald-700 font-semibold">
                          Trust: {member.score || member.trust_score || 850} pts
                        </span>
                      </div>
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => openReportModal(member)}
                          className="w-8 h-8 rounded-full bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer"
                          title={`Report ${member.name || member.full_name} to admin`}
                          aria-label={`Report ${member.name || member.full_name}`}
                        >
                          <Icon name="flag" size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            TAB 3: JOIN REQUESTS (Organizer Approval)
        ════════════════════════════════════════════ */}
        {visibleTab === 'requests' && isManagementRole && (
          <div className="bg-white rounded-3xl border-2 border-[#006972]/12 shadow-sm overflow-hidden p-5 sm:p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#006972]/10 pb-3">
              <h3 className="font-headline text-[17px] font-bold text-[#006972] flex items-center gap-2">
                <Icon name="person_add" size={20} />
                Pending Join Requests ({pendingRequests.length})
              </h3>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant font-body text-[14px]">
                <Icon name="done_all" size={36} className="mx-auto mb-2 text-[#006972]/40" />
                No pending join requests at the moment. Share your invite code to get more members!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={req.profile_photo_url ? resolvePhotoUrl(req.profile_photo_url) : '/avatar.svg'}
                        alt={req.full_name}
                        className="w-12 h-12 rounded-full object-cover border border-[#006972]/20 bg-white"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-headline text-[15px] font-bold text-deep-navy">{req.full_name}</p>
                          {req.cnic_status === 'verified' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-label text-[10px] font-bold flex items-center gap-0.5">
                              <Icon name="verified" size={12} /> CNIC
                            </span>
                          ) : req.cnic_status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-label text-[10px] font-bold flex items-center gap-0.5">
                              <Icon name="schedule" size={12} /> CNIC Pending
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-label text-[10px] font-bold flex items-center gap-0.5">
                              <Icon name="error" size={12} /> CNIC Unverified
                            </span>
                          )}
                        </div>
                        <p className="font-body text-[12px] text-on-surface-variant">
                          {req.email || req.phone_number} • Trust Score: <strong className="text-emerald-700">{req.trust_score || 850} pts</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRequestAction(req.id, 'rejected')}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-rose-700 font-label text-[12px] font-bold transition-all cursor-pointer border border-slate-200 flex items-center gap-1"
                      >
                        <Icon name="close" size={16} /> Reject
                      </button>
                      <button
                        onClick={() => handleRequestAction(req.id, 'approved')}
                        className="px-4 py-2 rounded-xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[12px] font-bold transition-all shadow-sm cursor-pointer border-none flex items-center gap-1"
                      >
                        <Icon name="check" size={16} /> Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════
            TAB 3: SCHEDULE & ROTATION TIMELINE
        ════════════════════════════════════════════ */}
        {visibleTab === 'progress' && (
          <div className="bg-white rounded-3xl border-2 border-[#006972]/12 shadow-sm overflow-hidden p-5 sm:p-6 space-y-4 animate-fade-in">
            <h3 className="font-headline text-[17px] font-bold text-[#006972] flex items-center gap-2 border-b border-[#006972]/10 pb-3">
              <Icon name="timeline" size={20} />
              Payout Rotation Schedule (10 Cycles)
            </h3>

            <div className="relative border-l-2 border-[#006972]/20 ml-4 pl-6 space-y-6">
              {members.map((member, idx) => {
                const cycleNum = idx + 1;
                const isCurrent = cycleNum === 2;
                const isCompleted = cycleNum === 1;

                return (
                  <div key={member.id} className="relative text-left">
                    <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 ${
                      isCompleted ? 'bg-emerald-500 border-white' : isCurrent ? 'bg-[#006972] border-white animate-ping-slow' : 'bg-slate-300 border-white'
                    }`} />
                    
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-headline text-[14px] font-bold text-deep-navy">
                            Cycle #{cycleNum} Payout → {member.name}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 font-label text-[10px] font-bold uppercase">
                              Active Cycle
                            </span>
                          )}
                        </div>
                        <p className="font-body text-[12px] text-on-surface-variant mt-0.5">
                          Recipient Turn #{member.turn} • Total Payout: <strong className="text-deep-navy">Rs. {totalPoolAmount.toLocaleString()}</strong>
                        </p>
                      </div>

                      <span className="font-label text-[12px] font-bold text-on-surface-variant bg-white px-3 py-1 rounded-xl border border-slate-200 shrink-0 text-center">
                        {isCompleted ? 'Completed ✓' : isCurrent ? 'Collecting Dues' : 'Scheduled'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* ════════════════════════════════════════════
          MODAL 1: INVITE MEMBERS & SHARE CODE / ADD USER ID
      ════════════════════════════════════════════ */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-[#006972]/15 animate-scale-up text-left">
            <div className="flex items-center justify-between border-b border-[#006972]/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center">
                  <Icon name="person_add" size={22} />
                </div>
                <div>
                  <h3 className="font-headline text-[17px] font-bold text-deep-navy">Manage Committee Invites</h3>
                  <p className="font-body text-[11px] text-on-surface-variant">Share link/code or add directly by User ID</p>
                </div>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-on-surface-variant cursor-pointer border-none bg-transparent">
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex bg-[#006972]/5 p-1 rounded-2xl border border-[#006972]/15 gap-1">
              <button
                type="button"
                onClick={() => setInviteTab('link')}
                className={`flex-1 py-2 rounded-xl text-[12px] font-label font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                  inviteTab === 'link'
                    ? 'bg-[#006972] text-white shadow-sm'
                    : 'text-deep-navy hover:bg-[#006972]/10'
                }`}
              >
                <Icon name="link" size={15} /> Code & Link
              </button>
              <button
                type="button"
                onClick={() => setInviteTab('userid')}
                className={`flex-1 py-2 rounded-xl text-[12px] font-label font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                  inviteTab === 'userid'
                    ? 'bg-[#006972] text-white shadow-sm'
                    : 'text-deep-navy hover:bg-[#006972]/10'
                }`}
              >
                <Icon name="badge" size={15} /> Add by User ID
              </button>
            </div>

            {/* TAB CONTENT 1: INVITE CODE & LINK */}
            {inviteTab === 'link' ? (
              <div className="space-y-4 pt-1">
                {/* Invite Code Box */}
                <div className="space-y-1">
                  <label className="block font-label text-[11px] font-bold uppercase text-on-surface-variant">Unique Invite Code</label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span className="font-mono text-[15px] font-bold text-[#006972]">{committee.inviteCode}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(committee.inviteCode);
                        showToast('Invite code copied to clipboard!');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[12px] font-bold cursor-pointer border-none flex items-center gap-1"
                    >
                      <Icon name="content_copy" size={14} /> Copy Code
                    </button>
                  </div>
                </div>

                {/* Direct Share Link Box */}
                <div className="space-y-1">
                  <label className="block font-label text-[11px] font-bold uppercase text-on-surface-variant">Shareable Invite Link</label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <p className="font-mono text-[12px] text-slate-700 truncate bg-white p-2 rounded-xl border border-slate-200">
                      {committee.inviteLink || `${window.location.origin}/join/${committee.inviteCode}`}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const link = committee.inviteLink || `${window.location.origin}/join/${committee.inviteCode}`;
                          navigator.clipboard.writeText(link);
                          showToast('Invite link copied! Share with participants.');
                        }}
                        className="flex-1 py-2 rounded-xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[12px] font-bold cursor-pointer border-none flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Icon name="share" size={15} /> Copy Invite Link
                      </button>
                      <button
                        onClick={() => {
                          navigate(`/join/${committee.inviteCode}`);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-deep-navy font-label text-[12px] font-bold cursor-pointer border-none flex items-center gap-1"
                      >
                        <Icon name="open_in_new" size={15} /> Preview
                      </button>
                    </div>
                  </div>
                </div>

                <p className="font-body text-[12px] text-on-surface-variant text-center">
                  Members opening this link will be prompted to submit a join request to the committee.
                </p>
              </div>
            ) : (
              /* TAB CONTENT 2: MANUAL ADD BY USER ID */
              <form onSubmit={handleManualAddUser} className="space-y-4 pt-1">
                {addMemberError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-body flex items-center gap-2">
                    <Icon name="error" size={16} className="shrink-0" />
                    <span>{addMemberError}</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="block font-label text-[12px] font-bold text-deep-navy">User ID / Email / Phone Number</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#006972]">
                      <Icon name="person_search" size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 03001234567 or user@example.com"
                      value={manualUserId}
                      onChange={(e) => {
                        setManualUserId(e.target.value);
                        if (addMemberError) setAddMemberError('');
                      }}
                      className="w-full h-12 pl-11 pr-4 bg-slate-50 border-2 border-[#006972]/15 rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/8 font-body text-[14px] text-deep-navy outline-none"
                    />
                  </div>
                  <p className="font-body text-[11px] text-on-surface-variant">
                    Enter the registered phone number, email address, or user ID of the participant.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setAddMemberError('');
                    }}
                    className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-slate-100 hover:bg-slate-200 text-deep-navy cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingMember}
                    className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-[#006972] hover:bg-[#00575f] disabled:opacity-60 text-white cursor-pointer border-none shadow-md flex items-center justify-center gap-1.5"
                  >
                    {addingMember ? (
                      <>Adding...</>
                    ) : (
                      <>
                        <Icon name="person_add" size={16} /> Add to Committee
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-[#006972]/10 flex justify-end">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-5 py-2 rounded-xl font-label text-[12px] font-bold bg-slate-100 hover:bg-slate-200 text-deep-navy cursor-pointer border-none"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MODAL 2: VERIFY PAYMENT MODAL
      ════════════════════════════════════════════ */}
      {showVerifyModal && paymentToVerify && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-[#006972]/15 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto border border-amber-200">
              <Icon name="check_circle" size={24} />
            </div>

            <div>
              <h3 className="font-headline text-[18px] font-bold text-deep-navy">Verify Payment Receipt</h3>
              <p className="font-body text-[13px] text-on-surface-variant mt-1">
                Confirm receipt of <strong>Rs. {committee.contributionAmount.toLocaleString()}</strong> from{' '}
                <strong>{paymentToVerify.member.name || paymentToVerify.payment.full_name}</strong>.
              </p>
              {paymentToVerify.payment.sender_account_details && (
                <p className="font-body text-[12px] text-on-surface-variant mt-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Icon name="receipt" size={14} className="inline -mt-0.5 mr-1 text-[#006972]" />
                  {paymentToVerify.payment.sender_account_details}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setPaymentToVerify(null);
                }}
                className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-slate-100 hover:bg-slate-200 text-deep-navy cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVerification}
                disabled={verifying}
                className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-[#006972] hover:bg-[#00575f] text-white cursor-pointer border-none shadow-md disabled:opacity-60"
              >
                {verifying ? 'Verifying…' : 'Confirm Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REPORT USER MODAL ── */}
      <ReportUserModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetUser={reportTargetUser}
        committeeId={id}
        committeeName={committee.name}
        onSuccess={() => showToast('Report filed with platform administrators.')}
      />

      <AddToCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        committeeName={committee.name}
        amount={committee.contribution_amount}
        startDate={selectedCycle?.due_date || committee.created_at}
      />

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#006972]/15 px-1 py-2 flex justify-around items-center safe-area-inset-bottom shadow-[0_-4px_20px_rgba(0,105,114,0.10)]">
        {[
          { label: 'Home', icon: 'dashboard', path: '/dashboard' },
          { label: 'Pools', icon: 'groups', path: '/pools' },
          { label: 'Payments', icon: 'account_balance_wallet', path: '/payments' },
          { label: 'Support', icon: 'support_agent', path: '/support' },
          { label: 'Profile', icon: 'person', path: '/profile' },
        ].map((tab) => (
          <button key={tab.path} onClick={() => navigate(tab.path)}
            className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer border-none bg-transparent min-w-0">
            {tab.path === '/pools' && <span className="absolute inset-0 bg-[#006972]/10 rounded-2xl" />}
            <Icon name={tab.icon} size={22} className={`relative z-10 transition-all duration-200 ${tab.path === '/pools' ? 'text-[#006972] scale-110' : 'text-deep-navy/45'}`} />
            <span className={`font-label text-[9px] mt-0.5 font-semibold relative z-10 truncate max-w-[48px] ${tab.path === '/pools' ? 'text-[#006972]' : 'text-deep-navy/45'}`}>{tab.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}
