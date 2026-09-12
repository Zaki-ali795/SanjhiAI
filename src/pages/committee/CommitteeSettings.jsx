import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import logo from '../../assets/screen.png';
import { useNavDrawer } from '../../context/NavDrawerContext';
import {
  getCommitteeById,
  updateCommittee,
  updateCommitteeStatus,
  linkCollectionAccount,
  regenerateInviteCode,
} from '../../services/committeeService';
import { memberService, authService } from '../../services';

const INTERVAL_OPTIONS = [
  { value: '15_days', label: '15 Days', icon: 'schedule' },
  { value: '1_month', label: '1 Month', icon: 'calendar_month' },
  { value: '2_months', label: '2 Months', icon: 'date_range' },
];

function intervalLabel(value) {
  return INTERVAL_OPTIONS.find((o) => o.value === value)?.label || 'Monthly';
}

/* ── Skeleton bone helper ── */
function Bone({ className = '' }) {
  return <span className={`skeleton-bone inline-block ${className}`} />;
}

/* ── Toggle Switch ── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-all duration-200 cursor-pointer ${
        checked ? 'bg-[#006972] border-[#006972]' : 'bg-slate-200 border-slate-300'
      }`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`} />
    </button>
  );
}

/* ── Role avatar color ── */
function roleColor(role) {
  if (role === 'Organizer') return 'bg-[#006972] text-white';
  if (role === 'Co-Organizer') return 'bg-amber-500 text-white';
  return 'bg-slate-200 text-slate-700';
}

export default function CommitteeSettings() {
  const navigate = useNavigate();
  const { id } = useParams();
  const committeeId = id || '1';
  const { openDrawer } = useNavDrawer();

  // Role from backend: 'organizer' | 'co_organizer' | 'member' | 'viewer'
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Settings State
  const [committeeName, setCommitteeName] = useState('');
  const [contribution, setContribution] = useState('');
  const [capacity, setCapacity] = useState('');
  const [interval, setIntervalVal] = useState('1_month');
  const [committeeStatus, setCommitteeStatus] = useState('active');
  const [saving, setSaving] = useState(false);

  // Account State
  const [accountType, setAccountType] = useState('jazzcash');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);

  // Invite Code State
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  // Organizer info (participant view)
  const [organizerName, setOrganizerName] = useState('');
  const [myMemberId, setMyMemberId] = useState(null);

  // Co-Organizer Modal State
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [membersList, setMembersList] = useState([]);

  // Member Removal Modal State
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  // Participant Settings State
  const [notifySMS, setNotifySMS] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifyReminders, setNotifyReminders] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Danger Zone Modal State
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closing, setClosing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        setLoading(true);
        setLoadError('');
        const data = await getCommitteeById(committeeId);
        if (cancelled) return;

        const c = data?.committee || {};
        setRole(c.my_role || 'member');
        setCommitteeName(c.name || '');
        setContribution(String(c.contribution_amount ?? ''));
        setCapacity(String(c.capacity ?? ''));
        setIntervalVal(c.interval_type || '1_month');
        setCommitteeStatus(c.status || 'active');
        setInviteCode(c.invite_code || '');
        setInviteLink(c.invite_link || '');
        setOrganizerName(c.organizer_name || '');
        setMyMemberId(data?.my_member_id || null);

        setAccountType(c.account_type || 'jazzcash');
        setAccountTitle(c.account_title || '');
        setAccountNumber(c.account_number || '');

        setMembersList(
          (data?.members || [])
            .filter((m) => m.status === 'approved')
            .map((m) => ({
              ...m,
              name: m.full_name,
              phone: m.phone_number,
              turn: m.payout_turn_order,
              role: m.is_organizer ? 'Organizer' : m.is_co_organizer ? 'Co-Organizer' : 'Participant',
            }))
        );
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Failed to load committee settings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();
    return () => { cancelled = true; };
  }, [committeeId]);

  // Notification preferences (user-level, participant view)
  useEffect(() => {
    let cancelled = false;
    authService.getNotificationPrefs()
      .then((prefs) => {
        if (cancelled) return;
        setNotifyWhatsApp(prefs?.whatsapp_enabled !== false);
        setNotifySMS(prefs?.sms_enabled !== false);
        setNotifyReminders(prefs?.push_enabled !== false);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const isManagementRole = role === 'organizer' || role === 'co_organizer';
  const roleLabel = role === 'organizer'
    ? 'Organizer'
    : role === 'co_organizer' ? 'Co-Organizer' : 'Participant';

  /* ── YouTube-style skeleton layout shown while loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-white text-deep-navy font-body antialiased relative overflow-x-hidden pb-24 md:pb-12">

        {/* Ambient background (same as real page) */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.3]"
            style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #006972 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[#006972]/5 blur-3xl top-[-100px] left-[-100px] animate-float-y-slow" />
          <div className="absolute w-[360px] h-[360px] rounded-full bg-amber-400/5 blur-3xl bottom-[15%] right-[-60px]"
            style={{ animation: 'float-y 8s ease-in-out infinite 2s' }} />
          <img src={logo} alt="" aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] opacity-[0.035] select-none pointer-events-none"
            style={{ filter: 'brightness(0) saturate(100%) invert(26%) sepia(85%) saturate(1450%) hue-rotate(152deg)' }} />
        </div>

        {/* Skeleton header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#006972]/10 shadow-sm">
          <div className="max-w-4xl mx-auto px-3.5 sm:px-6 h-14 sm:h-18 flex items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <Bone className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Bone className="w-24 h-2.5 rounded-full" />
                <Bone className="w-36 h-4 rounded-xl" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Bone className="w-16 h-5 rounded-full" />
              <Bone className="w-16 h-6 rounded-full" />
            </div>
          </div>
        </header>

        {/* Skeleton cards */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6 relative z-10">

          {/* Card 1: General Parameters skeleton */}
          <div className="bg-white rounded-3xl border-2 border-[#006972]/12 shadow-sm overflow-hidden p-5 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-[#006972]/10 pb-4">
              <Bone className="w-48 h-6 rounded-xl" />
              <Bone className="w-28 h-5 rounded-full" />
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Bone className="w-32 h-4 rounded-lg" />
                <Bone className="w-full h-12 rounded-2xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Bone className="w-40 h-4 rounded-lg" />
                  <Bone className="w-full h-12 rounded-2xl" />
                </div>
                <div className="space-y-1.5">
                  <Bone className="w-36 h-4 rounded-lg" />
                  <Bone className="w-full h-12 rounded-2xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Bone className="w-36 h-4 rounded-lg" />
                <Bone className="w-full h-11 rounded-2xl" />
              </div>
              <div className="flex justify-end pt-2">
                <Bone className="w-32 h-11 rounded-2xl" />
              </div>
            </div>
          </div>

          {/* Card 2: Collection Account skeleton */}
          <div className="bg-white rounded-3xl border-2 border-[#006972]/12 shadow-sm overflow-hidden p-5 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-[#006972]/10 pb-3">
              <Bone className="w-52 h-6 rounded-xl" />
              <Bone className="w-28 h-5 rounded-full" />
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <Bone className="w-11 h-11 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="w-36 h-4 rounded-lg" />
                <Bone className="w-52 h-3 rounded-lg" />
              </div>
              <Bone className="w-16 h-6 rounded-full shrink-0" />
            </div>
          </div>

          {/* Card 3: Access Control skeleton */}
          <div className="bg-white rounded-3xl border-2 border-[#006972]/12 shadow-sm overflow-hidden p-5 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-[#006972]/10 pb-3">
              <Bone className="w-64 h-6 rounded-xl" />
              <Bone className="w-36 h-5 rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Bone className="w-full h-28 rounded-2xl" />
              <Bone className="w-full h-28 rounded-2xl" />
            </div>
            <Bone className="w-full h-20 rounded-2xl" />
            <div className="space-y-2 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Bone className="w-10 h-10 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <Bone className="w-28 h-4 rounded-lg" />
                      <Bone className="w-40 h-3 rounded-lg" />
                    </div>
                  </div>
                  <Bone className="w-20 h-8 rounded-xl shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Danger Zone skeleton */}
          <div className="bg-rose-50/60 rounded-3xl border-2 border-rose-200 p-5 sm:p-7 space-y-4">
            <Bone className="w-40 h-6 rounded-xl" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <Bone className="w-48 h-5 rounded-lg" />
                <Bone className="w-full h-3 rounded-lg" />
              </div>
              <Bone className="w-36 h-11 rounded-2xl shrink-0" />
            </div>
          </div>

        </main>
      </div>
    );
  }

  async function handleSaveGeneralSettings(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await updateCommittee(committeeId, {
        name: committeeName,
        contribution_amount: parseFloat(contribution),
        capacity: parseInt(capacity, 10),
        interval_type: interval,
      });
      showToast('Committee settings updated successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerateInviteCode() {
    if (regenerating) return;
    setRegenerating(true);
    try {
      const res = await regenerateInviteCode(committeeId);
      setInviteCode(res?.invite_code || inviteCode);
      setInviteLink(res?.invite_link || inviteLink);
      showToast(`New invite code generated: ${res?.invite_code || ''}`);
    } catch (err) {
      showToast(err.message || 'Failed to regenerate invite code.');
    } finally {
      setRegenerating(false);
    }
  }

  async function handleSaveAccount(e) {
    e.preventDefault();
    if (savingAccount) return;
    setSavingAccount(true);
    try {
      await linkCollectionAccount(committeeId, {
        account_type: accountType,
        account_title: accountTitle,
        account_number: accountNumber,
      });
      setShowAccountModal(false);
      showToast('Collection account updated!');
    } catch (err) {
      showToast(err.message || 'Failed to save account.');
    } finally {
      setSavingAccount(false);
    }
  }

  async function handlePromoteCoOrganizer(e) {
    e.preventDefault();
    if (!selectedMember || promoting) return;
    setPromoting(true);
    try {
      const res = await memberService.promoteToCoOrganizer(committeeId, selectedMember);
      const memberObj = membersList.find((m) => m.id === selectedMember);
      setMembersList((prev) => prev.map((m) =>
        m.id === selectedMember
          ? { ...m, is_co_organizer: true, role: 'Co-Organizer', co_organizer_id: res?.coOrganizer?.id || m.co_organizer_id }
          : m
      ));
      setShowPromoteModal(false);
      setSelectedMember('');
      showToast(res?.message || `${memberObj?.name || 'Member'} promoted to Co-Organizer!`);
    } catch (err) {
      showToast(err.message || 'Failed to promote member.');
    } finally {
      setPromoting(false);
    }
  }

  async function handleDemoteCoOrganizer(member) {
    if (!member?.co_organizer_id) return;
    try {
      await memberService.demoteCoOrganizer(committeeId, member.co_organizer_id);
      setMembersList((prev) => prev.map((m) =>
        m.id === member.id ? { ...m, is_co_organizer: false, co_organizer_id: null, role: 'Participant' } : m
      ));
      showToast(`${member.name} demoted to Participant.`);
    } catch (err) {
      showToast(err.message || 'Failed to demote co-organizer.');
    }
  }

  async function handleConfirmRemoveMember() {
    if (!memberToRemove || removing) return;
    setRemoving(true);
    try {
      await memberService.removeMember(committeeId, memberToRemove.id);
      setMembersList((prev) => prev.filter((m) => m.id !== memberToRemove.id));
      showToast(`${memberToRemove.name} removed from committee.`);
      setShowRemoveModal(false);
      setMemberToRemove(null);
    } catch (err) {
      showToast(err.message || 'Failed to remove member.');
    } finally {
      setRemoving(false);
    }
  }

  async function handlePrefToggle(key, value) {
    if (key === 'whatsapp') setNotifyWhatsApp(value);
    if (key === 'sms') setNotifySMS(value);
    if (key === 'push') setNotifyReminders(value);

    try {
      await authService.updateNotificationPrefs({
        whatsapp_enabled: key === 'whatsapp' ? value : notifyWhatsApp,
        sms_enabled: key === 'sms' ? value : notifySMS,
        push_enabled: key === 'push' ? value : notifyReminders,
      });
      showToast('Notification preferences saved!');
    } catch (err) {
      showToast(err.message || 'Failed to save notification preferences.');
    }
  }

  async function handleConfirmLeave() {
    if (!myMemberId || leaving) return;
    setLeaving(true);
    try {
      await memberService.removeMember(committeeId, myMemberId);
      setShowLeaveModal(false);
      showToast('You have left the committee.');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Failed to leave committee.');
      setLeaving(false);
    }
  }

  async function handleConfirmCloseCommittee() {
    if (closing) return;
    setClosing(true);
    try {
      await updateCommitteeStatus(committeeId, { status: 'closed' });
      setShowCloseModal(false);
      showToast('Committee closed.');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Failed to close committee.');
      setClosing(false);
    }
  }

  function handleCopyInviteLink() {
    navigator.clipboard.writeText(inviteLink);
    showToast('Invite link copied to clipboard!');
  }

  const hasAccount = Boolean(accountNumber);



  if (loadError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <Icon name="error" size={28} />
          </div>
          <h1 className="font-headline text-[20px] font-bold text-deep-navy">Couldn't load settings</h1>
          <p className="font-body text-[13px] text-on-surface-variant">{loadError}</p>
          <button
            onClick={() => navigate(`/committee/${committeeId}`)}
            className="px-5 py-2.5 rounded-2xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[13px] font-bold cursor-pointer border-none shadow-md"
          >
            Back to Committee
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-deep-navy font-body antialiased relative overflow-x-hidden pb-24 md:pb-12">

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

      {/* ── HEADER BAR ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#006972]/10 shadow-sm">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 h-14 sm:h-18 flex items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate(`/committee/${committeeId}`)}
              className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 border border-[#006972]/12 text-[#006972] transition-colors cursor-pointer active:scale-95"
              aria-label="Back to Committee"
            >
              <Icon name="arrow_back" size={17} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-label font-medium text-on-surface-variant truncate">
                {isManagementRole ? 'Management Console' : 'Member Preferences'}
              </p>
              <h1 className="font-headline text-[15px] sm:text-[19px] font-bold text-[#006972] leading-tight truncate">
                Committee Settings
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="hidden xs:inline-block px-2 py-0.5 rounded-full bg-[#006972]/10 text-[#006972] font-label text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
              {roleLabel}
            </span>
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-label text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
              committeeStatus === 'active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : committeeStatus === 'frozen'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <Icon name={committeeStatus === 'active' ? 'verified' : 'pause_circle'} size={12} /> {committeeStatus}
            </span>

            {/* Mobile Drawer Toggle */}
            <button
              onClick={openDrawer}
              className="md:hidden p-2 rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 border border-[#006972]/20 text-[#006972] transition-all active:scale-95 cursor-pointer"
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
        <div className="fixed top-24 right-4 left-4 sm:left-auto sm:right-5 sm:w-80 z-50 px-4 py-3.5 rounded-2xl shadow-2xl font-label text-[13px] font-bold flex items-center gap-2.5 border border-white/20 bg-[#006972] text-white">
          <Icon name="check_circle" size={18} className="shrink-0 text-emerald-300" />
          <span className="flex-1">{toastMessage}</span>
        </div>
      )}

      {/* ── HERO STRIP ── */}
      <div className="relative z-10 bg-gradient-to-r from-[#006972] via-[#007d87] to-[#005f66] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div>
            <p className="font-label text-[11px] font-semibold text-white/50 uppercase tracking-widest mb-0.5">
              {isManagementRole ? '⚙ Management Console' : '👤 Participant View'}
            </p>
            <p className="font-headline text-[19px] sm:text-[22px] font-bold text-white leading-tight">
              {committeeName || 'Committee Settings'}
            </p>
            <p className="font-body text-[12px] text-white/55 mt-0.5">
              {isManagementRole
                ? `Managing as ${roleLabel} · ${membersList.length} members`
                : `Viewing as ${roleLabel} · Rs. ${parseInt(contribution || 0).toLocaleString()} / ${intervalLabel(interval)}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white font-label text-[11px] font-bold">
              <Icon name="groups" size={14} /> {capacity || '—'} slots
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white font-label text-[11px] font-bold">
              <Icon name="payments" size={14} /> Rs. {parseInt(contribution || 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white font-label text-[11px] font-bold">
              <Icon name="schedule" size={14} /> {intervalLabel(interval)}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-5 relative z-10">

        {/* =========================================================================
            ROLE 1 & 2: ORGANIZER AND CO-ORGANIZER VIEW (Identical capabilities)
        ========================================================================= */}
        {isManagementRole ? (
          <>
            {/* CARD 1: GENERAL COMMITTEE PARAMETERS */}
            <section className="bg-white rounded-3xl border border-[#006972]/12 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#006972] via-[#00a3b0] to-[#006972]" />
              <div className="p-5 sm:p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0">
                    <Icon name="tune" size={20} />
                  </div>
                  <div>
                    <h2 className="font-headline text-[17px] font-bold text-deep-navy">General Parameters</h2>
                    <p className="font-label text-[11px] text-on-surface-variant font-medium">Core committee configuration</p>
                  </div>
                </div>
                <span className="text-[11px] font-label bg-[#006972]/10 text-[#006972] px-2.5 py-1 rounded-full font-bold border border-[#006972]/15 hidden sm:block">
                  {roleLabel}
                </span>
              </div>

              <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
                {/* Committee Name */}
                <div className="space-y-1.5 text-left">
                  <label className="block font-label text-[13px] font-bold text-deep-navy">Committee Name</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#006972]">
                      <Icon name="label" size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={committeeName}
                      onChange={(e) => setCommitteeName(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 bg-slate-50 border-2 border-[#006972]/15 rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/8 font-body text-[14px] text-deep-navy outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Grid: Contribution & Capacity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="block font-label text-[13px] font-bold text-deep-navy">Contribution per Interval (PKR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#006972] font-bold font-label text-[13px]">Rs.</span>
                      <input
                        type="number"
                        required
                        min="500"
                        value={contribution}
                        onChange={(e) => setContribution(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-12 pl-12 pr-4 bg-slate-50 border-2 border-[#006972]/15 rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/8 font-body text-[14px] text-deep-navy outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-label text-[13px] font-bold text-deep-navy">Member Capacity (Slots)</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#006972]">
                        <Icon name="groups" size={18} />
                      </div>
                      <input
                        type="number"
                        required
                        min="2"
                        max="50"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-12 pl-11 pr-4 bg-slate-50 border-2 border-[#006972]/15 rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/8 font-body text-[14px] text-deep-navy outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Collection Interval Selection */}
                <div className="space-y-1.5 text-left">
                  <label className="block font-label text-[12px] font-bold text-deep-navy uppercase tracking-wider">Collection Interval</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
                    {INTERVAL_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setIntervalVal(opt.value)}
                        className={`py-2.5 px-2 rounded-xl text-[12px] font-label font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                          interval === opt.value
                            ? 'bg-[#006972] text-white shadow-md shadow-[#006972]/25'
                            : 'bg-transparent text-deep-navy/60 hover:bg-white hover:text-deep-navy hover:shadow-sm'
                        }`}
                      >
                        <Icon name={opt.icon} size={14} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-7 py-3 rounded-2xl font-label text-[13px] font-bold bg-gradient-to-r from-[#006972] to-[#007d87] hover:from-[#00575f] hover:to-[#006972] text-white transition-all shadow-lg shadow-[#006972]/25 active:scale-95 cursor-pointer border-none flex items-center gap-2 disabled:opacity-60"
                  >
                    {saving && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                    <Icon name="save" size={16} />
                    Save Changes
                  </button>
                </div>
              </form>
              </div>
            </section>

            {/* CARD 2: LINKED COLLECTION ACCOUNT */}
            <section className="bg-white rounded-3xl border border-[#006972]/12 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-400 via-[#006972] to-emerald-400" />
              <div className="p-5 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <Icon name="account_balance_wallet" size={20} />
                  </div>
                  <div>
                    <h2 className="font-headline text-[17px] font-bold text-deep-navy">Collection Account</h2>
                    <p className="font-label text-[11px] text-on-surface-variant font-medium">Where members send dues</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAccountModal(true)}
                  className="font-label text-[13px] font-bold text-[#006972] hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
                >
                  <Icon name="edit" size={15} />
                  {hasAccount ? 'Change Account' : 'Connect Account'}
                </button>
              </div>

              {hasAccount ? (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#fbfaee] border border-deep-navy/5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0">
                      <Icon name={accountType === 'bank' ? 'account_balance' : 'payments'} size={24} />
                    </div>
                    <div>
                      <p className="font-headline text-[15px] font-bold text-deep-navy capitalize">{accountType} Account</p>
                      <p className="font-body text-[12px] text-on-surface-variant">Title: <strong>{accountTitle}</strong> • No: <strong>{accountNumber}</strong></p>
                    </div>
                  </div>
                  <span className="text-[11px] font-label font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Icon name="check_circle" size={13} /> Active
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left flex items-center justify-between">
                  <div>
                    <p className="font-headline text-[14px] font-bold text-amber-900">No Collection Account Linked</p>
                    <p className="font-body text-[12px] text-amber-800/80">Connect your JazzCash or Bank details so members know where to send dues.</p>
                  </div>
                  <button
                    onClick={() => setShowAccountModal(true)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-label text-[12px] font-bold transition-all shadow-sm border-none cursor-pointer shrink-0 ml-3"
                  >
                    Connect Now
                  </button>
                </div>
              )}
              </div>
            </section>

            {/* CARD 3: ACCESS CONTROL */}
            <section className="bg-white rounded-3xl border border-[#006972]/12 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
              <div className="p-5 sm:p-7 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                      <Icon name="admin_panel_settings" size={20} />
                    </div>
                    <div>
                      <h2 className="font-headline text-[17px] font-bold text-deep-navy">Access Control</h2>
                      <p className="font-label text-[11px] text-on-surface-variant font-medium">Invites, codes & permissions</p>
                    </div>
                  </div>
                  <span className="font-label text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 hidden sm:block">
                    {roleLabel} Controls
                  </span>
                </div>

                {/* Invite Code + Link tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Invite Code */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 text-left group hover:border-[#006972]/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-label text-[10px] font-bold uppercase text-on-surface-variant tracking-widest flex items-center gap-1">
                        <Icon name="tag" size={12} /> Invite Code
                      </span>
                      <span className="font-mono text-[14px] font-bold text-[#006972] bg-[#006972]/10 px-3 py-1 rounded-xl border border-[#006972]/15 tracking-widest">
                        {inviteCode || '——'}
                      </span>
                    </div>
                    <p className="font-body text-[11px] text-on-surface-variant leading-relaxed">
                      Regenerate to invalidate existing requests and generate a new code.
                    </p>
                    <button
                      onClick={handleRegenerateInviteCode}
                      disabled={regenerating}
                      className="w-full py-2.5 rounded-xl bg-white border border-[#006972]/20 hover:bg-[#006972] hover:text-white hover:border-[#006972] text-[#006972] font-label text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 group"
                    >
                      {regenerating
                        ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        : <Icon name="refresh" size={15} />}
                      Regenerate Code
                    </button>
                  </div>

                  {/* Invite Link */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 text-left hover:border-[#006972]/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-label text-[10px] font-bold uppercase text-on-surface-variant tracking-widest flex items-center gap-1">
                        <Icon name="link" size={12} /> Invite Link
                      </span>
                      <span className="font-label text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Shareable
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200 truncate leading-relaxed">
                      {inviteLink || 'No link generated yet'}
                    </p>
                    <button
                      onClick={handleCopyInviteLink}
                      className="w-full py-2.5 rounded-xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none shadow-sm active:scale-95"
                    >
                      <Icon name="content_copy" size={15} /> Copy Link
                    </button>
                  </div>
                </div>

                {/* Co-Organizer Promotion */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#006972]/6 to-[#006972]/3 border border-[#006972]/12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon name="shield_person" size={20} />
                    </div>
                    <div>
                      <p className="font-headline text-[14px] font-bold text-deep-navy">Co-Organizer Delegation</p>
                      <p className="font-body text-[12px] text-on-surface-variant mt-0.5">
                        Grant full management access to a trusted member.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPromoteModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none shadow-sm active:scale-95 shrink-0"
                  >
                    <Icon name="person_add" size={15} /> Promote
                  </button>
                </div>

                {/* Member List */}
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline text-[15px] font-bold text-deep-navy flex items-center gap-2">
                      <Icon name="manage_accounts" size={18} className="text-[#006972]" />
                      Members
                      <span className="px-2 py-0.5 rounded-full bg-[#006972]/10 text-[#006972] font-label text-[11px] font-bold">
                        {membersList.length}
                      </span>
                    </h3>
                    <span className="text-[10px] font-label text-on-surface-variant font-medium uppercase tracking-wider">Manage & Remove</span>
                  </div>

                  <div className="space-y-2">
                    {membersList.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                          <Icon name="group_add" size={20} />
                        </div>
                        <p className="font-body text-[13px] text-on-surface-variant">
                          No approved members yet. Share your invite code!
                        </p>
                      </div>
                    ) : membersList.map((m) => (
                      <div key={m.id} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-[#006972]/20 hover:bg-white transition-all flex items-center justify-between gap-3 group">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar with initial */}
                          <div className={`w-10 h-10 rounded-full font-bold font-headline text-[15px] flex items-center justify-center shrink-0 shadow-sm ${roleColor(m.role)}`}>
                            {(m.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-headline text-[14px] font-bold text-deep-navy">{m.name}</span>
                              <span className={`px-2 py-0.5 rounded-full font-label text-[9px] font-bold uppercase tracking-wider ${
                                m.role === 'Co-Organizer' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                m.role === 'Organizer' ? 'bg-[#006972]/10 text-[#006972] border border-[#006972]/20' :
                                'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {m.role}
                              </span>
                            </div>
                            <p className="font-body text-[11px] text-on-surface-variant mt-0.5 truncate">
                              {m.phone || 'No phone'} · Turn #{m.turn || '—'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                          {m.is_co_organizer && m.co_organizer_id && (
                            <button
                              onClick={() => handleDemoteCoOrganizer(m)}
                              title="Demote to Participant"
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all cursor-pointer flex items-center gap-1 font-label text-[11px] font-bold"
                            >
                              <Icon name="remove_moderator" size={14} />
                              <span className="hidden sm:inline">Demote</span>
                            </button>
                          )}
                          {!m.is_organizer && (
                            <button
                              onClick={() => { setMemberToRemove(m); setShowRemoveModal(true); }}
                              title="Remove member"
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer flex items-center gap-1 font-label text-[11px] font-bold"
                            >
                              <Icon name="person_remove" size={14} />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* CARD 4: DANGER ZONE */}
            <section className="rounded-3xl border border-rose-200 overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fff5f5 100%)' }}>
              <div className="h-1 bg-gradient-to-r from-rose-400 via-rose-600 to-rose-400" />
              <div className="p-5 sm:p-7 space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                    <Icon name="warning" size={20} />
                  </div>
                  <div>
                    <h2 className="font-headline text-[17px] font-bold text-rose-800">Danger Zone</h2>
                    <p className="font-label text-[11px] text-rose-500 font-medium">Irreversible actions — proceed with caution</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-headline text-[15px] font-bold text-rose-900">Close Committee Pool</p>
                    <p className="font-body text-[12px] text-rose-700/80 mt-0.5">
                      Permanently close this committee. All member slots will be revoked.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCloseModal(true)}
                    className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-label text-[13px] font-bold transition-all shadow-md shadow-rose-200 active:scale-95 cursor-pointer border-none shrink-0 flex items-center gap-2"
                  >
                    <Icon name="delete_forever" size={16} />
                    Close Committee
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* =========================================================================
              ROLE 3: PARTICIPANT VIEW
          ========================================================================= */
          <>
            {/* PARTICIPANT CARD 1: OVERVIEW */}
            <section className="bg-white rounded-3xl border border-[#006972]/12 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#006972] via-[#00a3b0] to-[#006972]" />
              <div className="p-5 sm:p-7 space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0">
                    <Icon name="info" size={20} />
                  </div>
                  <div>
                    <h2 className="font-headline text-[17px] font-bold text-deep-navy">Committee Overview</h2>
                    <p className="font-label text-[11px] text-on-surface-variant font-medium">Your membership details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Contribution', value: `Rs. ${parseInt(contribution || 0).toLocaleString()}`, icon: 'payments', color: 'text-[#006972] bg-[#006972]/8' },
                    { label: 'Cycle', value: intervalLabel(interval), icon: 'calendar_month', color: 'text-amber-700 bg-amber-50' },
                    { label: 'Total Slots', value: `${capacity} Members`, icon: 'groups', color: 'text-indigo-600 bg-indigo-50' },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2 hover:border-[#006972]/20 transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.color}`}>
                        <Icon name={stat.icon} size={18} />
                      </div>
                      <p className="font-label text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">{stat.label}</p>
                      <p className="font-headline text-[17px] font-bold text-deep-navy">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#006972]/6 to-transparent border border-[#006972]/10 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#006972] text-white flex items-center justify-center font-bold font-headline text-[16px] shadow-md shrink-0">
                    {(organizerName || 'O').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-headline text-[14px] font-bold text-deep-navy">{organizerName || 'Unknown Organizer'}</p>
                    <p className="font-body text-[11px] text-on-surface-variant flex items-center gap-1">
                      <Icon name="verified" size={12} className="text-[#006972]" /> Committee Organizer
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* PARTICIPANT CARD 2: PAYMENT DESTINATION */}
            <section className="bg-white rounded-3xl border border-[#006972]/12 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-400 via-[#006972] to-emerald-400" />
              <div className="p-5 sm:p-7 space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <Icon name="payments" size={20} />
                  </div>
                  <div>
                    <h2 className="font-headline text-[17px] font-bold text-deep-navy">Payment Destination</h2>
                    <p className="font-label text-[11px] text-on-surface-variant font-medium">Where to send your dues</p>
                  </div>
                </div>

                <p className="font-body text-[13px] text-on-surface-variant bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2">
                  <Icon name="info" size={15} className="text-[#006972] shrink-0 mt-0.5" />
                  Send your dues to the account below and upload your receipt in the Committee Ledger.
                </p>

                {hasAccount ? (
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden">
                    {[
                      { label: 'Payment Method', value: accountType, mono: false },
                      { label: 'Account Title', value: accountTitle, mono: false },
                      { label: 'Account Number', value: accountNumber, mono: true },
                    ].map((row, i) => (
                      <div key={row.label} className={`flex justify-between items-center px-4 py-3 ${i < 2 ? 'border-b border-slate-200' : ''}`}>
                        <span className="font-label text-[12px] text-on-surface-variant font-bold">{row.label}</span>
                        <span className={`${row.mono ? 'font-mono text-[#006972]' : 'font-headline text-deep-navy'} text-[14px] font-bold capitalize`}>
                          {row.value || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                    <Icon name="info" size={18} className="text-amber-600 shrink-0" />
                    <p className="font-body text-[13px] text-amber-900">
                      The organizer hasn't linked a collection account yet. Contact them for payment details.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* PARTICIPANT CARD 3: SHARE */}
            <section className="bg-white rounded-3xl border border-[#006972]/12 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-400 via-[#006972] to-indigo-400" />
              <div className="p-5 sm:p-7 space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                    <Icon name="share" size={20} />
                  </div>
                  <div>
                    <h2 className="font-headline text-[17px] font-bold text-deep-navy">Share Committee</h2>
                    <p className="font-label text-[11px] text-on-surface-variant font-medium">Invite friends to join</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-[12px] text-[#006972] font-bold truncate">
                    {inviteLink || 'No invite link available'}
                  </div>
                  <button
                    onClick={handleCopyInviteLink}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-[#006972] to-[#007d87] hover:from-[#00575f] hover:to-[#006972] text-white font-label text-[13px] font-bold flex items-center justify-center gap-2 cursor-pointer border-none shadow-md active:scale-95 transition-all shrink-0"
                  >
                    <Icon name="content_copy" size={16} /> Copy Link
                  </button>
                </div>
              </div>
            </section>

            {/* PARTICIPANT CARD 4: NOTIFICATIONS */}
            <section className="bg-white rounded-3xl border border-[#006972]/12 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple-400 via-[#006972] to-purple-400" />
              <div className="p-5 sm:p-7 space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                    <Icon name="notifications_active" size={20} />
                  </div>
                  <div>
                    <h2 className="font-headline text-[17px] font-bold text-deep-navy">Notifications</h2>
                    <p className="font-label text-[11px] text-on-surface-variant font-medium">Choose your alert channels</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { key: 'whatsapp', icon: 'chat', label: 'WhatsApp Reminders', desc: 'Automated messages before due dates', value: notifyWhatsApp },
                    { key: 'sms', icon: 'sms', label: 'SMS Due Alerts', desc: 'Text alerts when payouts are disbursed', value: notifySMS },
                    { key: 'push', icon: 'notification_important', label: 'Turn Rotation Alerts', desc: 'Alerts when your payout cycle is near', value: notifyReminders },
                  ].map((pref) => (
                    <div key={pref.key} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-[#006972]/20 transition-colors cursor-pointer"
                      onClick={() => handlePrefToggle(pref.key, !pref.value)}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pref.value ? 'bg-[#006972]/10 text-[#006972]' : 'bg-slate-200 text-slate-400'}`}>
                          <Icon name={pref.icon} size={17} />
                        </div>
                        <div>
                          <p className="font-headline text-[14px] font-bold text-deep-navy">{pref.label}</p>
                          <p className="font-body text-[11px] text-on-surface-variant">{pref.desc}</p>
                        </div>
                      </div>
                      <Toggle checked={pref.value} onChange={(val) => handlePrefToggle(pref.key, val)} />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* PARTICIPANT CARD 5: LEAVE */}
            <section className="rounded-3xl border border-rose-200 overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fff5f5 100%)' }}>
              <div className="h-1 bg-gradient-to-r from-rose-400 via-rose-600 to-rose-400" />
              <div className="p-5 sm:p-7 space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                    <Icon name="exit_to_app" size={20} />
                  </div>
                  <div>
                    <h2 className="font-headline text-[17px] font-bold text-rose-800">Leave Committee</h2>
                    <p className="font-label text-[11px] text-rose-500 font-medium">Withdraw your membership</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-headline text-[15px] font-bold text-rose-900">Withdraw Participation</p>
                    <p className="font-body text-[12px] text-rose-700/80 mt-0.5">
                      Your turn slot will be freed and removed from the rotation.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    disabled={!myMemberId}
                    className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-label text-[13px] font-bold transition-all shadow-md shadow-rose-200 active:scale-95 cursor-pointer border-none shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="exit_to_app" size={16} />
                    Leave Committee
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════
          MODAL 1: ACCOUNT
      ══════════════════════════════════════════════════════ */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#006972]/15 overflow-hidden my-auto animate-scale-in">
            <div className="h-1 bg-gradient-to-r from-[#006972] via-emerald-400 to-[#006972]" />
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#006972]/10 text-[#006972] flex items-center justify-center">
                    <Icon name="account_balance_wallet" size={18} />
                  </div>
                  <h3 className="font-headline text-[17px] font-bold text-deep-navy">Collection Account</h3>
                </div>
                <button onClick={() => setShowAccountModal(false)} className="p-2 rounded-full hover:bg-slate-100 text-on-surface-variant cursor-pointer border-none bg-transparent transition-colors">
                  <Icon name="close" size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveAccount} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="block font-label text-[11px] font-bold text-deep-navy uppercase tracking-wider">Account Provider</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 hover:border-[#006972]/30 rounded-2xl font-body text-[14px] text-deep-navy outline-none cursor-pointer focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/8 transition-all"
                  >
                    <option value="jazzcash">JazzCash Mobile Wallet</option>
                    <option value="easypaisa">EasyPaisa Mobile Wallet</option>
                    <option value="bank">Bank Account (IBAN)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-label text-[11px] font-bold text-deep-navy uppercase tracking-wider">Account Title</label>
                  <input
                    type="text"
                    required
                    value={accountTitle}
                    onChange={(e) => setAccountTitle(e.target.value)}
                    placeholder="e.g. Ahmed Ali"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 hover:border-[#006972]/30 rounded-2xl font-body text-[14px] text-deep-navy outline-none focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/8 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-label text-[11px] font-bold text-deep-navy uppercase tracking-wider">Account Number / IBAN</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 03001234567"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 hover:border-[#006972]/30 rounded-2xl font-body text-[14px] text-deep-navy outline-none focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/8 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowAccountModal(false)}
                    className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-slate-100 hover:bg-slate-200 text-deep-navy border-none cursor-pointer transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={savingAccount}
                    className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-[#006972] hover:bg-[#00575f] text-white border-none cursor-pointer shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {savingAccount && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                    Save Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL 2: PROMOTE CO-ORGANIZER
      ══════════════════════════════════════════════════════ */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-[#006972]/15 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-400 via-[#006972] to-amber-400" />
            <div className="p-6 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <Icon name="shield_person" size={18} />
                  </div>
                  <h3 className="font-headline text-[17px] font-bold text-deep-navy">Promote Co-Organizer</h3>
                </div>
                <button onClick={() => setShowPromoteModal(false)} className="p-2 rounded-full hover:bg-slate-100 text-on-surface-variant cursor-pointer border-none bg-transparent transition-colors">
                  <Icon name="close" size={20} />
                </button>
              </div>

              <p className="font-body text-[13px] text-on-surface-variant bg-amber-50 border border-amber-100 rounded-xl p-3">
                Co-organizers can manage members, payments, and all committee settings.
              </p>

              <form onSubmit={handlePromoteCoOrganizer} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block font-label text-[11px] font-bold text-deep-navy uppercase tracking-wider">Select Member</label>
                  <select
                    required
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 hover:border-[#006972]/30 rounded-2xl font-body text-[14px] text-deep-navy outline-none cursor-pointer focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/8 transition-all"
                  >
                    <option value="">— Choose a member —</option>
                    {membersList.filter((m) => !m.is_organizer && !m.is_co_organizer).map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.phone || 'no phone'})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowPromoteModal(false)}
                    className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-slate-100 hover:bg-slate-200 text-deep-navy border-none cursor-pointer transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={!selectedMember || promoting}
                    className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-[#006972] hover:bg-[#00575f] text-white border-none cursor-pointer shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {promoting && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                    Promote
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL 3: REMOVE MEMBER
      ══════════════════════════════════════════════════════ */}
      {showRemoveModal && memberToRemove && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-rose-200 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-rose-400 via-rose-600 to-rose-400" />
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
                <Icon name="person_remove" size={26} />
              </div>
              <div>
                <h3 className="font-headline text-[18px] font-bold text-deep-navy">Remove Member?</h3>
                <p className="font-body text-[13px] text-on-surface-variant mt-1.5">
                  Remove <strong className="text-deep-navy">{memberToRemove.name}</strong> from this committee? This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowRemoveModal(false); setMemberToRemove(null); }}
                  className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-slate-100 hover:bg-slate-200 text-deep-navy cursor-pointer border-none transition-colors">
                  Cancel
                </button>
                <button onClick={handleConfirmRemoveMember} disabled={removing}
                  className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer border-none shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {removing && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL 4: LEAVE COMMITTEE
      ══════════════════════════════════════════════════════ */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-rose-200 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-rose-400 via-rose-600 to-rose-400" />
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
                <Icon name="exit_to_app" size={26} />
              </div>
              <div>
                <h3 className="font-headline text-[18px] font-bold text-deep-navy">Leave Committee?</h3>
                <p className="font-body text-[13px] text-on-surface-variant mt-1.5">
                  Your participation will be withdrawn and your turn slot freed. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-[#f1f5f9] hover:bg-[#e2e8f0] text-deep-navy cursor-pointer border-none transition-colors">
                  Cancel
                </button>
                <button onClick={handleConfirmLeave} disabled={leaving}
                  className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer border-none shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {leaving && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                  Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL 5: CLOSE COMMITTEE
      ══════════════════════════════════════════════════════ */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-rose-200 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-rose-500 via-red-600 to-rose-500" />
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
                <Icon name="warning" size={26} />
              </div>
              <div>
                <h3 className="font-headline text-[18px] font-bold text-deep-navy">Close Committee?</h3>
                <p className="font-body text-[13px] text-on-surface-variant mt-1.5">
                  This is <strong>permanent and irreversible.</strong> All member slots will be revoked and the committee will be closed forever.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCloseModal(false)}
                  className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-slate-100 hover:bg-slate-200 text-deep-navy cursor-pointer border-none transition-colors">
                  Cancel
                </button>
                <button onClick={handleConfirmCloseCommittee} disabled={closing}
                  className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer border-none shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {closing && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                  Close Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
