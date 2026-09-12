import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/Icon';
import CnicVerificationModal from '../../components/CnicVerificationModal';
import { useNavDrawer } from '../../context/NavDrawerContext';
import { useCountUp } from '../../hooks/useCountUp';
import { resolvePhotoUrl, getBackendUrl } from '../../utils/backendUrl';
import logo from '../../assets/screen.png';
import aiLogo from '../../assets/sanjhi-ai-logo.png';
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  getNotificationPrefs,
  updateNotificationPrefs,
  logout,
  sendContactOTP,
  verifyContactOTP,
  getCnicStatus,
} from '../../services/authService';
import { getTrustScoreBreakdown } from '../../services/dashboardService';

/* ── Trust score tier (0–1000 model) ── */
function scoreTier(score) {
  if (score >= 900) return { badge: 'Top Tier Participant', tier: 'Diamond Tier', color: 'text-emerald-200 bg-emerald-500/20 border-emerald-300/30' };
  if (score >= 750) return { badge: 'Trusted Member', tier: 'Gold Tier', color: 'text-amber-200 bg-amber-400/20 border-amber-300/30' };
  if (score >= 600) return { badge: 'Building Trust', tier: 'Silver Tier', color: 'text-sky-200 bg-sky-400/20 border-sky-300/30' };
  return { badge: 'Needs Attention', tier: 'Bronze Tier', color: 'text-orange-200 bg-orange-400/20 border-orange-300/30' };
}

/** Formats UUID into user-friendly Sanjhi ID string, e.g. SNJ-C85E-41E8 */
function formatUserId(id) {
  if (!id) return 'SNJ-0000-0000';
  const clean = id.replace(/-/g, '').toUpperCase();
  return `SNJ-${clean.slice(0, 4)}-${clean.slice(4, 8)}`;
}

function Bone({ className = '' }) {
  return <span className={`skeleton-bone inline-block ${className}`} />;
}

const TICKER_ITEMS = [
  { icon: 'verified_user', text: 'Verified Community Profile — All transactions logged securely', color: 'text-[#006972]' },
  { icon: 'shield', text: 'Trust Score: Live ledger verification and reliability metrics', color: 'text-emerald-600' },
  { icon: 'auto_awesome', text: 'Ask Sanjhi AI anytime to manage your committee schedules & profile', color: 'text-amber-700' },
];

const PARTICLES = [
  { x: 10, y: 15, size: 5, delay: 0, dur: 6 },
  { x: 30, y: 60, size: 3, delay: 1.2, dur: 8 },
  { x: 50, y: 25, size: 4, delay: 2.5, dur: 7 },
  { x: 70, y: 75, size: 6, delay: 0.7, dur: 5 },
  { x: 85, y: 40, size: 3, delay: 3.1, dur: 9 },
];

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openDrawer } = useNavDrawer();

  // Initialize from local phone cache for instant 0ms load
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('sanjhi_cached_profile');
      return cached ? JSON.parse(cached) : null;
    } catch (_) {
      return null;
    }
  });

  const [targetTrustScore, setTargetTrustScore] = useState(() => {
    const cached = localStorage.getItem('sanjhi_cached_trust');
    return cached ? Number(cached) : 0;
  });

  const [reliabilityRate, setReliabilityRate] = useState(() => {
    const cached = localStorage.getItem('sanjhi_cached_rel');
    return cached ? Number(cached) : 90;
  });

  const [loading, setLoading] = useState(() => !user);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [errorMessage, setErrorMessage] = useState('');

  const [fullName, setFullName] = useState(() => user?.full_name || '');
  const [age, setAge] = useState(() => user?.age ? user.age.toString() : '');
  const [sex, setSex] = useState(() => user?.sex || '');

  // Add contact modal state with 2-step OTP flow
  const [showAddContact, setShowAddContact] = useState(false);
  const [addContactType, setAddContactType] = useState(''); // 'phone' | 'email'
  const [addContactValue, setAddContactValue] = useState('');
  const [contactStep, setContactStep] = useState('input'); // 'input' | 'otp'
  const [contactCode, setContactCode] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [modalError, setModalError] = useState('');

  const [showCnicModal, setShowCnicModal] = useState(false);
  const [cnicData, setCnicData] = useState(null);

  const [notifPrefs, setNotifPrefs] = useState({
    push_enabled: true,
    sms_enabled: true,
    whatsapp_enabled: true,
  });

  const [language, setLanguage] = useState(() => localStorage.getItem('sanjhi_lang') || 'en');

  const [photoPreview, setPhotoPreview] = useState(() => {
    return user?.profile_photo_url ? resolvePhotoUrl(user.profile_photo_url) : null;
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const trustScore = useCountUp(targetTrustScore, 1400, true);

  useEffect(() => {
    const saved = localStorage.getItem('sanjhi_lang') || 'en';
    document.documentElement.dir = saved === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = saved;
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        if (!user) setLoading(true);
        const [profileData, trustData] = await Promise.allSettled([
          getProfile(),
          getTrustScoreBreakdown(),
        ]);

        if (profileData.status === 'fulfilled' && profileData.value) {
          const data = profileData.value;
          setUser(data);
          setFullName(data.full_name || '');
          setAge(data.age ? data.age.toString() : '');
          setSex(data.sex || '');
          if (data.profile_photo_url) {
            setPhotoPreview(resolvePhotoUrl(data.profile_photo_url));
          }
          localStorage.setItem('sanjhi_cached_profile', JSON.stringify(data));
        }

        if (trustData.status === 'fulfilled' && trustData.value) {
          const tData = trustData.value;
          if (typeof tData.score === 'number') {
            setTargetTrustScore(tData.score);
            localStorage.setItem('sanjhi_cached_trust', tData.score.toString());
          }
          if (typeof tData.components?.reliability?.rate === 'number') {
            const rate = Math.round(tData.components.reliability.rate * 100);
            setReliabilityRate(rate);
            localStorage.setItem('sanjhi_cached_rel', rate.toString());
          }
        }

        try {
          const prefs = await getNotificationPrefs();
          if (prefs) setNotifPrefs(prefs);
        } catch (_) {}
        try {
          const cnicRes = await getCnicStatus();
          setCnicData(cnicRes?.cnic || cnicRes);
        } catch (_) {}
      } catch (err) {
        if (!user) setErrorMessage('Could not load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function reloadCnic() {
    try {
      const cnicRes = await getCnicStatus();
      setCnicData(cnicRes?.cnic || cnicRes);
      const profileData = await getProfile();
      setUser(profileData);
    } catch (_) {}
  }

  function showToast(msg, type = 'success') {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 3500);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage('');
      const updatedRes = await updateProfile({
        full_name: fullName.trim(),
        ...(age && { age: parseInt(age, 10) }),
        ...(sex && { sex }),
      });
      setUser((prev) => ({
        ...prev,
        full_name: fullName.trim(),
        age: age ? parseInt(age, 10) : prev?.age,
        sex: sex || prev?.sex,
      }));
      setEditing(false);
      showToast('Profile updated successfully! ✓');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
    try {
      setUploadingPhoto(true);
      const res = await uploadProfilePhoto(file);
      if (res?.profile_photo_url) {
        setPhotoPreview(resolvePhotoUrl(res.profile_photo_url));
        setUser((prev) => ({ ...prev, profile_photo_url: res.profile_photo_url }));
      }
      showToast('Profile photo updated!');
    } catch (err) {
      showToast('Photo saved for this session', 'success');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleToggleNotif(key) {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    try {
      await updateNotificationPrefs(updated);
      showToast('Notification preference saved');
    } catch (_) {}
  }

  async function handleConfirmLogout() {
    try { await logout(); } catch (_) {}
    localStorage.clear();
    navigate('/login');
  }

  // Open modal for adding phone or email
  function openAddContactModal(type) {
    setAddContactType(type);
    setAddContactValue('');
    setContactStep('input');
    setContactCode('');
    setModalError('');
    setShowAddContact(true);
  }

  // Step 1: Send OTP to new contact
  async function handleRequestContactOTP(e) {
    e.preventDefault();
    if (!addContactValue.trim()) return;

    try {
      setSendingOTP(true);
      setModalError('');
      await sendContactOTP({ target: addContactValue.trim() });
      setContactStep('otp');
      showToast(`Verification OTP sent to ${addContactValue.trim()}`);
    } catch (err) {
      setModalError(err.message || 'Failed to send verification OTP.');
    } finally {
      setSendingOTP(false);
    }
  }

  // Step 2: Verify OTP and link contact to account
  async function handleVerifyContactOTP(e) {
    e.preventDefault();
    if (!contactCode.trim()) return;

    try {
      setVerifyingOTP(true);
      setModalError('');
      const res = await verifyContactOTP({
        target: addContactValue.trim(),
        code: contactCode.trim(),
      });

      if (res?.user) {
        setUser(res.user);
      }
      setShowAddContact(false);
      showToast(`${addContactType === 'phone' ? 'Phone number' : 'Email address'} verified and linked successfully! ✓`);
    } catch (err) {
      setModalError(err.message || 'Incorrect verification code. Please check and try again.');
    } finally {
      setVerifyingOTP(false);
    }
  }

  const navTabs = [
    { label: 'Home', icon: 'dashboard', path: '/dashboard' },
    { label: 'Pools', icon: 'groups', path: '/pools' },
    { label: 'Payments', icon: 'account_balance_wallet', path: '/payments' },
    { label: 'Support', icon: 'support_agent', path: '/support' },
    { label: 'Profile', icon: 'person', path: '/profile' },
  ];

  const hasPhone = Boolean(user?.phone_number);
  const hasEmail = Boolean(user?.email);

  return (
    <div className="min-h-screen bg-white text-deep-navy font-body antialiased relative overflow-x-hidden pb-28 md:pb-12">

      {/* ── BACKGROUND LAYER ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.3]"
          style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #006972 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute w-[520px] h-[520px] rounded-full bg-[#006972]/5 blur-3xl top-[-120px] left-[-120px] animate-float-y-slow" />
        <div className="absolute w-[380px] h-[380px] rounded-full bg-amber-400/5 blur-3xl bottom-[10%] right-[-80px]"
          style={{ animation: 'float-y 9s ease-in-out infinite 2s' }} />
        {PARTICLES.map((p, i) => (
          <div key={i} className="absolute rounded-full bg-[#006972] particle"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: 0.15, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }} />
        ))}
        <img src={logo} alt="" aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] md:w-[720px] opacity-[0.035] select-none pointer-events-none"
          style={{ filter: 'brightness(0) saturate(100%) invert(26%) sepia(85%) saturate(1450%) hue-rotate(152deg)' }} />
      </div>

      {/* ── LIVE TICKER ── */}
      <div className="relative z-30 bg-[#006972]/8 border-b border-[#006972]/12 overflow-hidden h-9 flex items-center">
        <div className="absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="flex whitespace-nowrap animate-ticker gap-0">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-6 font-label text-[11px] font-semibold">
              <Icon name={item.icon} size={13} className={item.color} />
              <span className="text-deep-navy/65">{item.text}</span>
              <span className="mx-3 text-[#006972]/25">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#006972]/10 shadow-sm">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-14 sm:h-18 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 border border-[#006972]/12 text-[#006972] transition-colors cursor-pointer active:scale-95"
            >
              <Icon name="arrow_back" size={17} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-label font-medium text-on-surface-variant truncate">Account Settings</p>
              <h1 className="font-headline text-[16px] sm:text-[20px] font-bold text-[#006972] leading-tight">My Profile</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => navigate('/assistant')}
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#006972]/10 hover:bg-[#006972]/18 text-[#006972] font-label text-[11px] sm:text-[13px] font-bold border border-[#006972]/20 transition-all active:scale-95 cursor-pointer shadow-sm shadow-[#006972]/5"
            >
              <img src={aiLogo} alt="AI" className="w-4 h-4 sm:w-5 sm:h-5 rounded-md object-cover animate-float-y-fast shrink-0" />
              <span className="hidden sm:inline">Sanjhi AI</span>
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-2 sm:p-2.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-all active:scale-95 cursor-pointer"
              title="Log Out"
            >
              <Icon name="logout" size={16} />
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

      {/* ── TOAST ── */}
      {toastMessage && (
        <div className={`fixed top-16 sm:top-20 right-3 left-3 sm:left-auto sm:right-4 sm:w-auto z-50 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-xl font-label text-[12px] sm:text-[13px] font-bold flex items-center gap-2 border border-white/20 ${
          toastType === 'error' ? 'bg-rose-600 text-white' : 'bg-[#006972] text-white'
        }`}>
          <Icon name={toastType === 'error' ? 'error' : 'check_circle'} size={15} className="shrink-0 text-white/80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-4 space-y-3.5 sm:space-y-6 relative z-10">

        {/* ERROR ALERT */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-[12px] sm:text-[13px] font-body flex items-start gap-2">
            <Icon name="error" size={15} className="shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ════════════════════════════════════════════
            PROFILE HERO CARD (RESPONSIVE & COMPACT)
        ════════════════════════════════════════════ */}
        <section className="bg-gradient-to-br from-[#006972] via-[#007a82] to-[#005f66] rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-7 shadow-lg shadow-[#006972]/20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 sm:border-3 border-white/30 shadow-md bg-white/10">
                <img
                  alt={user?.full_name || 'Profile'}
                  src={photoPreview || '/avatar.svg'}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-xl bg-white text-[#006972] flex items-center justify-center shadow-md hover:bg-emerald-50 active:scale-90 transition-all cursor-pointer border border-[#006972]/10"
                title="Change Photo"
              >
                {uploadingPhoto
                  ? <span className="w-3 h-3 rounded-full border-2 border-[#006972] border-t-transparent animate-spin" />
                  : <Icon name="photo_camera" size={13} className="sm:text-base" />
                }
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </div>

            {/* Name & meta */}
            <div className="flex-1 text-center sm:text-left min-w-0 space-y-1.5">
              {loading ? (
                <Bone className="w-36 h-6 rounded-xl bg-white/20 mx-auto sm:mx-0" />
              ) : (
                <h2 className="font-headline text-[18px] sm:text-[22px] md:text-[25px] font-bold text-white tracking-tight leading-tight">
                  {user?.full_name || 'Anonymous User'}
                </h2>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-white font-label text-[10px] sm:text-[11px] font-bold border border-white/20">
                  <Icon name="verified" size={12} /> {scoreTier(targetTrustScore).badge}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label text-[10px] sm:text-[11px] font-bold border ${scoreTier(targetTrustScore).color}`}>
                  <Icon name="star" size={12} /> {scoreTier(targetTrustScore).tier}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                <p className="font-body text-[11px] sm:text-[12px] text-white/75 flex items-center justify-center sm:justify-start gap-1">
                  <Icon name="event" size={13} className="text-white/60" />
                  Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                </p>
                {user?.id && (
                  <span className="font-mono text-[10px] sm:text-[11px] font-bold text-emerald-200 bg-black/20 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/20 flex items-center gap-1">
                    <Icon name="fingerprint" size={12} className="text-emerald-300" />
                    {formatUserId(user.id)}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formatUserId(user.id));
                        showToast('User ID copied to clipboard!');
                      }}
                      className="p-0.5 hover:bg-white/20 rounded text-white transition-colors cursor-pointer border-none bg-transparent flex items-center ml-0.5"
                      title="Copy Formatted User ID"
                    >
                      <Icon name="content_copy" size={11} />
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Edit button */}
            <div className="shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setEditing(!editing)}
                className={`w-full sm:w-auto px-3.5 py-1.5 sm:py-2 rounded-xl font-label text-[12px] sm:text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${ editing ? 'bg-white/15 text-white border-white/25 hover:bg-white/25' : 'bg-white text-[#006972] border-white/40 hover:bg-white/90 shadow-sm'}`}
              >
                <Icon name={editing ? 'close' : 'edit'} size={14} />
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Trust Score bar at bottom */}
          <div className="relative z-10 mt-3 pt-2.5 sm:mt-5 sm:pt-4 border-t border-white/15">
            <div className="flex items-center justify-between mb-1 sm:mb-1.5">
              <div className="flex items-center gap-1.5">
                <Icon name="shield_with_heart" size={14} className="text-white/80" />
                <span className="font-label text-[10px] sm:text-[11px] font-bold text-white/80 uppercase tracking-wider">Community Trust Score</span>
              </div>
              <span className="font-headline text-[16px] sm:text-[20px] font-extrabold text-white tabular-nums">
                {trustScore.toLocaleString()} <span className="font-label text-[11px] sm:text-[12px] font-normal text-white/60">/ 1000</span>
              </span>
            </div>
            <div className="w-full h-1.5 sm:h-2.5 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-[1800ms] ease-out"
                style={{ width: `${Math.min(100, Math.max(0, targetTrustScore / 10))}%`, background: 'linear-gradient(90deg, #fcd34d, #6ee7b7, #ffffff)' }} />
            </div>
            <div className="flex justify-between mt-0.5 sm:mt-1">
              <span className="font-label text-[9px] sm:text-[10px] text-white/80">{reliabilityRate}% On-time Rate</span>
              <span className="font-label text-[9px] sm:text-[10px] font-bold text-emerald-300">{scoreTier(targetTrustScore).badge}</span>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            MAIN GRID
        ════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">

            {/* CONTACT & IDENTITY CARD */}
            <div className="bg-white rounded-3xl border-2 border-[#006972]/12 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#006972]/8 flex items-center justify-between">
                <h3 className="font-headline text-[16px] font-bold text-[#006972] flex items-center gap-2">
                  <Icon name="contact_page" size={20} />
                  Contact & Identity
                </h3>
              </div>

              <div className="p-4 space-y-3">
                {/* Phone row */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0">
                    <Icon name="smartphone" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Phone</p>
                    {loading ? <Bone className="w-32 h-4 rounded-lg mt-0.5" /> : (
                      <p className="font-headline text-[14px] font-bold text-deep-navy truncate">
                        {user?.phone_number || <span className="text-on-surface-variant font-normal text-[13px]">Not added</span>}
                      </p>
                    )}
                  </div>
                  {hasPhone ? (
                    <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Icon name="check_circle" size={12} /> Verified
                    </span>
                  ) : !loading && (
                    <button
                      onClick={() => openAddContactModal('phone')}
                      className="shrink-0 text-[12px] font-bold text-[#006972] bg-[#006972]/8 hover:bg-[#006972]/15 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border-none flex items-center gap-1"
                    >
                      <Icon name="add" size={14} /> Add Phone
                    </button>
                  )}
                </div>

                {/* Email row */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0">
                    <Icon name="mail" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Email</p>
                    {loading ? <Bone className="w-36 h-4 rounded-lg mt-0.5" /> : (
                      <p className="font-headline text-[14px] font-bold text-deep-navy truncate">
                        {user?.email || <span className="text-on-surface-variant font-normal text-[13px]">Not added</span>}
                      </p>
                    )}
                  </div>
                  {hasEmail ? (
                    <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Icon name="check_circle" size={12} /> Verified
                    </span>
                  ) : !loading && (
                    <button
                      onClick={() => openAddContactModal('email')}
                      className="shrink-0 text-[12px] font-bold text-[#006972] bg-[#006972]/8 hover:bg-[#006972]/15 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border-none flex items-center gap-1"
                    >
                      <Icon name="add" size={14} /> Add Email
                    </button>
                  )}
                </div>

                {/* CNIC Identity Verification row */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50/70 to-slate-50 border border-[#006972]/15 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0">
                        <Icon name="badge" size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-label text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">CNIC Identity</p>
                        {loading ? <Bone className="w-32 h-4 rounded-lg mt-0.5" /> : (
                          <p className="font-headline text-[13px] font-bold text-deep-navy truncate">
                            {cnicData?.cnic_number || user?.cnic_number || <span className="text-on-surface-variant font-normal text-[12px]">Not added</span>}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {cnicData?.cnic_status === 'verified' || user?.cnic_status === 'verified' ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Icon name="verified" size={12} /> Verified
                        </span>
                      ) : cnicData?.cnic_status === 'pending' || user?.cnic_status === 'pending' ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Icon name="schedule" size={12} /> Pending Review
                        </span>
                      ) : cnicData?.cnic_status === 'rejected' || user?.cnic_status === 'rejected' ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Icon name="error" size={12} /> Rejected
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Icon name="help" size={12} /> Unverified
                        </span>
                      )}
                    </div>
                  </div>

                  {cnicData?.cnic_rejection_reason && (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-body flex items-start gap-1">
                      <Icon name="info" size={14} className="shrink-0 mt-0.5" />
                      <span><strong>Reason:</strong> {cnicData.cnic_rejection_reason}</span>
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCnicModal(true)}
                      className="w-full py-2 px-3 rounded-xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[12px] font-bold transition-all cursor-pointer border-none shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Icon name="badge" size={15} />
                      {cnicData?.cnic_status === 'verified' || user?.cnic_status === 'verified'
                        ? 'View / Update CNIC Details'
                        : cnicData?.cnic_status === 'pending' || user?.cnic_status === 'pending'
                        ? 'Update / Resubmit CNIC'
                        : 'Submit CNIC for Verification'}
                    </button>
                  </div>
                </div>

                {/* Member since */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                    <Icon name="calendar_today" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Member Since</p>
                    <p className="font-headline text-[14px] font-bold text-deep-navy">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'long' }) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* NOTIFICATION PREFERENCES CARD */}
            <div className="bg-white rounded-3xl border-2 border-[#006972]/12 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#006972]/8">
                <h3 className="font-headline text-[16px] font-bold text-[#006972] flex items-center gap-2">
                  <Icon name="notifications_active" size={20} />
                  Notifications
                </h3>
              </div>
              <div className="p-4 space-y-1">
                {[
                  { key: 'push_enabled', label: 'Push Notifications', sub: 'Payout & committee alerts', icon: 'notifications' },
                  { key: 'sms_enabled', label: 'SMS Security Alerts', sub: 'Verification codes via SMS', icon: 'sms' },
                  { key: 'whatsapp_enabled', label: 'WhatsApp OTPs', sub: '6-digit codes via WhatsApp', icon: 'forum' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#006972]/4 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#006972]/8 text-[#006972] flex items-center justify-center shrink-0">
                        <Icon name={item.icon} size={16} />
                      </div>
                      <div>
                        <p className="font-headline text-[13px] font-bold text-deep-navy">{item.label}</p>
                        <p className="font-body text-[11px] text-on-surface-variant">{item.sub}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleNotif(item.key)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer border-none shrink-0 ml-2 ${notifPrefs[item.key] ? 'bg-[#006972]' : 'bg-slate-200'}`}
                    >
                      <span className={`absolute top-0.5 block w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${notifPrefs[item.key] ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">

            {/* PERSONAL INFORMATION CARD */}
            <div className="bg-white rounded-3xl border-2 border-[#006972]/12 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#006972]/8 flex items-center justify-between">
                <h3 className="font-headline text-[16px] font-bold text-[#006972] flex items-center gap-2">
                  <Icon name="person_outline" size={20} />
                  Personal Information
                </h3>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="font-label text-[12px] font-bold text-[#006972] hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer"
                  >
                    <Icon name="edit" size={15} /> Edit
                  </button>
                )}
              </div>

              <div className="p-4 sm:p-5">
                {editing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="block font-label text-[12px] font-bold text-deep-navy">Full Name *</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006972]">
                          <Icon name="person" size={17} />
                        </div>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full h-11 pl-10 pr-4 bg-white border-2 border-[#006972]/15 rounded-xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/8 font-body text-[14px] text-deep-navy outline-none transition-all"
                          placeholder="Your full name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block font-label text-[12px] font-bold text-deep-navy">Age</label>
                        <input
                          type="number"
                          min="13"
                          max="120"
                          value={age}
                          onChange={(e) => setAge(e.target.value.slice(0, 3))}
                          placeholder="e.g. 24"
                          className="w-full h-11 px-4 bg-white border-2 border-[#006972]/15 rounded-xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/8 font-body text-[14px] text-deep-navy outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block font-label text-[12px] font-bold text-deep-navy">Gender</label>
                        <select
                          value={sex}
                          onChange={(e) => setSex(e.target.value)}
                          className="w-full h-11 px-3 bg-white border-2 border-[#006972]/15 rounded-xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/8 font-body text-[14px] text-deep-navy outline-none transition-all cursor-pointer"
                        >
                          <option value="">Not Specified</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => { setEditing(false); setFullName(user?.full_name || ''); setAge(user?.age?.toString() || ''); setSex(user?.sex || ''); }}
                        className="px-4 py-2 rounded-xl font-label text-[13px] font-bold text-on-surface-variant hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2 rounded-xl font-label text-[13px] font-bold bg-[#006972] text-white hover:bg-[#00575f] transition-all active:scale-95 cursor-pointer border-none flex items-center gap-1.5 shadow-md"
                      >
                        {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'User ID', value: formatUserId(user?.id), icon: 'fingerprint', copyable: true },
                      { label: 'Full Name', value: user?.full_name, icon: 'badge' },
                      { label: 'Gender', value: user?.sex ? user.sex.replace('_', ' ') : null, icon: 'wc' },
                      { label: 'Age', value: user?.age ? `${user.age} yrs` : null, icon: 'cake' },
                      { label: 'Account Status', value: 'Active', icon: 'verified_user', highlight: true },
                    ].map((item) => (
                      <div key={item.label} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 relative group">
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <div className="flex items-center gap-1.5">
                            <Icon name={item.icon} size={13} className="text-[#006972]" />
                            <span className="font-label text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">{item.label}</span>
                          </div>
                          {item.copyable && user?.id && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(formatUserId(user.id));
                                showToast('User ID copied to clipboard!');
                              }}
                              className="p-1 hover:bg-[#006972]/10 rounded text-[#006972] transition-colors cursor-pointer border-none bg-transparent flex items-center"
                              title="Copy User ID"
                            >
                              <Icon name="content_copy" size={13} />
                            </button>
                          )}
                        </div>
                        <div className={`font-headline text-[14px] font-bold capitalize ${item.highlight ? 'text-emerald-700' : 'text-deep-navy'}`}>
                          {loading ? <Bone className="w-20 h-4 rounded-lg" /> : (item.value || <span className="font-normal text-[13px] text-on-surface-variant">Not set</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* APP PREFERENCES CARD */}
            <div className="bg-white rounded-3xl border-2 border-[#006972]/12 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#006972]/8">
                <h3 className="font-headline text-[16px] font-bold text-[#006972] flex items-center gap-2">
                  <Icon name="tune" size={20} />
                  App Preferences
                </h3>
              </div>

              <div className="p-4 space-y-3">
                {/* Language Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#006972]/8 text-[#006972] flex items-center justify-center shrink-0">
                      <Icon name="language" size={17} />
                    </div>
                    <div>
                      <p className="font-headline text-[14px] font-bold text-deep-navy">Interface Language</p>
                      <p className="font-body text-[11px] text-on-surface-variant">
                        {language === 'en' ? 'English selected' : 'اردو زبان منتخب ہے'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center bg-white rounded-xl border border-[#006972]/15 overflow-hidden shadow-sm shrink-0">
                    <button
                      onClick={() => { setLanguage('en'); localStorage.setItem('sanjhi_lang', 'en'); document.documentElement.dir = 'ltr'; document.documentElement.lang = 'en'; showToast('Switched to English'); }}
                      className={`px-3 py-1.5 text-[12px] font-label font-bold transition-all cursor-pointer border-none ${language === 'en' ? 'bg-[#006972] text-white' : 'bg-transparent text-[#006972] hover:bg-[#006972]/8'}`}
                    >EN</button>
                    <div className="w-px h-5 bg-[#006972]/15" />
                    <button
                      onClick={() => { setLanguage('ur'); localStorage.setItem('sanjhi_lang', 'ur'); document.documentElement.dir = 'rtl'; document.documentElement.lang = 'ur'; showToast('زبان اردو میں تبدیل ہو گئی'); }}
                      className={`px-3 py-1.5 text-[12px] font-label font-bold transition-all cursor-pointer border-none ${language === 'ur' ? 'bg-[#006972] text-white' : 'bg-transparent text-[#006972] hover:bg-[#006972]/8'}`}
                    >اردو</button>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full py-3 px-4 rounded-2xl font-label text-[14px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Icon name="logout" size={18} />
                  Log Out of Sanjhi
                </button>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* ════════════════════════════════════════════
          ADD CONTACT MODAL (2-Step OTP Flow)
      ════════════════════════════════════════════ */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl border border-[#006972]/15 my-auto animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-[18px] font-bold text-deep-navy flex items-center gap-2">
                <Icon name={addContactType === 'phone' ? 'smartphone' : 'mail'} size={20} className="text-[#006972]" />
                {contactStep === 'input'
                  ? (addContactType === 'phone' ? 'Add & Verify Phone' : 'Add & Verify Email')
                  : 'Enter 6-Digit OTP Code'
                }
              </h3>
              <button onClick={() => setShowAddContact(false)} className="p-2 rounded-full hover:bg-slate-100 text-on-surface-variant cursor-pointer border-none bg-transparent">
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Error inside modal */}
            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[12px] font-body flex items-start gap-1.5">
                <Icon name="error" size={15} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            {/* STEP 1: Enter Phone/Email */}
            {contactStep === 'input' && (
              <form onSubmit={handleRequestContactOTP} className="space-y-4">
                <p className="font-body text-[13px] text-on-surface-variant leading-relaxed">
                  {addContactType === 'phone'
                    ? 'Enter your phone number to receive a 6-digit WhatsApp/SMS OTP code for instant account verification.'
                    : 'Enter your email address to receive a 6-digit OTP code for instant account verification.'
                  }
                </p>

                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#006972]">
                    <Icon name={addContactType === 'phone' ? 'smartphone' : 'mail'} size={18} />
                  </div>
                  <input
                    type={addContactType === 'phone' ? 'tel' : 'email'}
                    required
                    value={addContactValue}
                    onChange={(e) => setAddContactValue(e.target.value)}
                    placeholder={addContactType === 'phone' ? '+923001234567' : 'you@example.com'}
                    className="w-full h-12 pl-11 pr-4 bg-slate-50 border-2 border-[#006972]/15 rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/8 font-body text-[14px] text-deep-navy outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddContact(false)}
                    className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-slate-100 hover:bg-slate-200 text-deep-navy transition-colors cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingOTP || !addContactValue.trim()}
                    className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-[#006972] hover:bg-[#00575f] text-white transition-all cursor-pointer border-none shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {sendingOTP ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      <>
                        Send OTP Code <Icon name="arrow_forward" size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Enter 6-Digit OTP */}
            {contactStep === 'otp' && (
              <form onSubmit={handleVerifyContactOTP} className="space-y-4">
                <p className="font-body text-[13px] text-on-surface-variant leading-relaxed">
                  We've sent a 6-digit verification code to <strong className="text-deep-navy">{addContactValue}</strong>. Enter the code below to complete linking.
                </p>

                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#006972]">
                    <Icon name="key" size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={contactCode}
                    onChange={(e) => setContactCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full h-12 pl-11 pr-4 bg-slate-50 border-2 border-[#006972]/20 rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/8 font-headline text-[20px] font-bold text-center tracking-[8px] text-[#006972] outline-none transition-all"
                  />
                </div>

                <div className="flex items-center justify-between text-[12px] font-label">
                  <button
                    type="button"
                    onClick={() => { setContactStep('input'); setModalError(''); }}
                    className="text-[#006972] hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
                  >
                    <Icon name="arrow_back" size={14} /> Change Number / Email
                  </button>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddContact(false)}
                    className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-slate-100 hover:bg-slate-200 text-deep-navy transition-colors cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifyingOTP || contactCode.length !== 6}
                    className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-[#006972] hover:bg-[#00575f] text-white transition-all cursor-pointer border-none shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {verifyingOTP ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Link <Icon name="check_circle" size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          LOGOUT MODAL
      ════════════════════════════════════════════ */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 text-center space-y-4 shadow-2xl border border-[#006972]/15">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Icon name="logout" size={24} />
            </div>
            <div>
              <h3 className="font-headline text-[18px] font-bold text-deep-navy">Log Out?</h3>
              <p className="font-body text-[13px] text-on-surface-variant mt-1">End your session on Sanjhi.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-slate-100 hover:bg-slate-200 text-deep-navy transition-colors cursor-pointer border-none"
              >Cancel</button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-3 rounded-2xl font-label text-[13px] font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer border-none shadow-md"
              >Log Out</button>
            </div>
          </div>
        </div>
      )}

      {/* CNIC Verification Modal */}
      <CnicVerificationModal
        isOpen={showCnicModal}
        onClose={() => setShowCnicModal(false)}
        onVerified={() => {
          showToast('CNIC submitted for verification! ✓');
          reloadCnic();
        }}
      />


    </div>
  );
}
