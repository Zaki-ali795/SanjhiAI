import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import AdminMobileNav from '../../components/AdminMobileNav';
import { getPlatformSettings, updatePlatformSettings } from '../../services/adminService';
import { logout } from '../../services/authService';

const GLASS_CARD = 'bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,105,114,0.12)]';

export default function AdminSettings() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [settings, setSettings] = useState({
    maintenance_mode: false,
    auto_verify_cnic: true,
    min_trust_score_for_organizer: 70,
    late_payment_penalty_points: 5,
    payout_release_grace_hours: 24,
    support_phone: '0300-1234567',
    support_email: 'support@sanjhi.pk',
  });

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

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await getPlatformSettings();
        if (res?.settings) {
          setSettings((prev) => ({ ...prev, ...res.settings }));
        }
      } catch (err) {
        // Fallback preview
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSaveSettings(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await updatePlatformSettings(settings);
      showToast('Global platform settings updated!');
    } catch (err) {
      showToast(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
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
              <p className="font-label text-[10px] text-[#006972] font-semibold">Global Controls</p>
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
                Platform Configuration & Rules
              </h1>
              <p className="font-label text-[11px] text-on-surface-variant font-medium">
                Global parameters, trust score thresholds, and system maintenance toggles
              </p>
            </div>
          </header>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            {/* System Status Controls */}
            <div className={`${GLASS_CARD} rounded-3xl p-5 sm:p-6 space-y-4`}>
              <h3 className="font-headline text-[16px] font-bold text-deep-navy flex items-center gap-2">
                <Icon name="shield" size={19} className="text-[#006972]" />
                System Maintenance & Compliance Controls
              </h3>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/70 border border-white/80">
                <div>
                  <h4 className="font-headline text-[14px] font-bold text-deep-navy">Platform Maintenance Mode</h4>
                  <p className="font-body text-[11px] text-on-surface-variant">Temporarily pauses new committee creations for maintenance</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, maintenance_mode: !s.maintenance_mode }))}
                  className={`w-12 h-7 rounded-full p-1 transition-all cursor-pointer border-none ${
                    settings.maintenance_mode ? 'bg-rose-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.maintenance_mode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/70 border border-white/80">
                <div>
                  <h4 className="font-headline text-[14px] font-bold text-deep-navy">Automated Member Identity Verification</h4>
                  <p className="font-body text-[11px] text-on-surface-variant font-medium">Auto-approve member verification requests matching identity criteria</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, auto_verify_cnic: !s.auto_verify_cnic }))}
                  className={`w-12 h-7 rounded-full p-1 transition-all cursor-pointer border-none ${
                    settings.auto_verify_cnic ? 'bg-[#006972]' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.auto_verify_cnic ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Threshold Controls */}
            <div className={`${GLASS_CARD} rounded-3xl p-5 sm:p-6 space-y-4`}>
              <h3 className="font-headline text-[16px] font-bold text-deep-navy flex items-center gap-2">
                <Icon name="tune" size={19} className="text-[#006972]" />
                Trust Score & Governance Thresholds
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minTrustInput" className="block font-label text-[11px] font-bold uppercase text-deep-navy mb-1.5">
                    Min Trust Score to Create Pool
                  </label>
                  <input
                    id="minTrustInput"
                    type="number"
                    value={settings.min_trust_score_for_organizer}
                    onChange={(e) => setSettings((s) => ({ ...s, min_trust_score_for_organizer: parseInt(e.target.value, 10) }))}
                    className="w-full p-3 rounded-2xl bg-white/70 border border-white text-deep-navy font-headline text-[14px] font-bold outline-none focus:border-[#006972]"
                  />
                </div>

                <div>
                  <label htmlFor="graceHoursInput" className="block font-label text-[11px] font-bold uppercase text-deep-navy mb-1.5">
                    Payout Grace Period (Hours)
                  </label>
                  <input
                    id="graceHoursInput"
                    type="number"
                    value={settings.payout_release_grace_hours}
                    onChange={(e) => setSettings((s) => ({ ...s, payout_release_grace_hours: parseInt(e.target.value, 10) }))}
                    className="w-full p-3 rounded-2xl bg-white/70 border border-white text-deep-navy font-headline text-[14px] font-bold outline-none focus:border-[#006972]"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[14px] font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer border-none disabled:opacity-60"
            >
              {saving && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              <Icon name="save" size={18} />
              Save Global Configuration
            </button>
          </form>

        </main>
      </div>

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
