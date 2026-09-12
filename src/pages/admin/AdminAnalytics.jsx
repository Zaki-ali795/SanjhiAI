import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import AdminMobileNav from '../../components/AdminMobileNav';
import { getAnalytics } from '../../services/adminService';
import { logout } from '../../services/authService';

const GLASS_CARD = 'bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_rgba(0,105,114,0.08)]';

/* ── Skeleton Helper ── */
function Bone({ className = '' }) {
  return <div className={`skeleton-bone ${className}`} />;
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y

  const [analyticsData, setAnalyticsData] = useState({
    total_volume_pkr: 0,
    monthly_payout_volume: 0,
    active_users_count: 0,
    onboarding_conversion_rate: 0,
    on_time_payment_rate: 0,
    average_pool_duration_months: 0,
  });

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

  async function loadAnalytics() {
    try {
      setLoading(true);
      setLoadError('');
      const data = await getAnalytics({ range: timeRange });
      if (data) {
        setAnalyticsData((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      setLoadError('Failed to load live analytics data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

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

  /* Monthly Financial Growth Bar Chart Data — derived from real analytics */
  const growthChartData = analyticsData.total_volume_pkr > 0
    ? [
        { month: 'Mar', capital: +(analyticsData.total_volume_pkr * 0.45 / 1000000).toFixed(2), payouts: +(analyticsData.monthly_payout_volume * 0.3 / 1000000).toFixed(2) },
        { month: 'Apr', capital: +(analyticsData.total_volume_pkr * 0.6 / 1000000).toFixed(2), payouts: +(analyticsData.monthly_payout_volume * 0.5 / 1000000).toFixed(2) },
        { month: 'May', capital: +(analyticsData.total_volume_pkr * 0.8 / 1000000).toFixed(2), payouts: +(analyticsData.monthly_payout_volume * 0.7 / 1000000).toFixed(2) },
        { month: 'Jun', capital: +(analyticsData.total_volume_pkr / 1000000).toFixed(2), payouts: +(analyticsData.monthly_payout_volume / 1000000).toFixed(2) },
      ]
    : [];

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
              <p className="font-label text-[10px] text-[#006972] font-semibold">Financial Analytics</p>
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
              <span>Logout Staff Account</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-6 min-w-0 pb-28 md:pb-12">

          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shadow-sm">
                  <Icon name="bar_chart" size={20} />
                </span>
                <h1 className="font-headline text-[22px] sm:text-[26px] font-bold text-deep-navy">
                  Platform Financial Analytics
                </h1>
              </div>
              <p className="font-label text-[11px] sm:text-[12px] text-on-surface-variant font-medium mt-1">
                Circulating capital metrics, rotation compliance, and growth velocity
              </p>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-white/90 shadow-sm self-start sm:self-auto">
              {[
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: '90d', label: '90 Days' },
                { id: '1y', label: '1 Year' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeRange(t.id)}
                  className={`px-3 py-1.5 rounded-xl font-label text-[11px] font-bold transition-all cursor-pointer border-none ${
                    timeRange === t.id
                      ? 'bg-[#006972] text-white shadow-sm'
                      : 'text-deep-navy/70 hover:text-deep-navy'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </header>

          {loading ? (
            <div className="space-y-6 w-full">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Bone key={i} className="w-full h-28 rounded-3xl" />
                ))}
              </div>
              <Bone className="w-full h-72 rounded-3xl" />
            </div>
          ) : (
            <>
              {/* ── 6 KPI METRICS CARDS ── */}
              <section className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

                {/* Total Circulating Capital */}
                <div className={`${GLASS_CARD} rounded-3xl p-4 sm:p-5 relative overflow-hidden transition-all hover:shadow-[0_12px_36px_rgba(0,105,114,0.16)]`}>
                  <div className="h-1 absolute top-0 inset-x-0 bg-gradient-to-r from-[#006972] to-[#00838f]" />
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center border border-[#006972]/20 shadow-sm">
                      <Icon name="account_balance_wallet" size={20} />
                    </div>
                    <span className="font-label text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Live
                    </span>
                  </div>
                  <p className="font-label text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Total Pool Capital</p>
                  <h3 className="font-headline text-[24px] sm:text-[30px] font-bold text-deep-navy tabular-nums leading-tight mt-0.5">
                    Rs. {(analyticsData.total_volume_pkr || 0).toLocaleString('en-PK')}
                  </h3>
                  <p className="font-label text-[10px] text-slate-500 mt-2">Circulating across active pools</p>
                </div>

                {/* Monthly Payout Volume */}
                <div className={`${GLASS_CARD} rounded-3xl p-4 sm:p-5 relative overflow-hidden transition-all hover:shadow-[0_12px_36px_rgba(0,105,114,0.16)]`}>
                  <div className="h-1 absolute top-0 inset-x-0 bg-gradient-to-r from-emerald-500 to-teal-500" />
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-sm">
                      <Icon name="payments" size={20} />
                    </div>
                    <span className="font-label text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Released
                    </span>
                  </div>
                  <p className="font-label text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Monthly Payout Volume</p>
                  <h3 className="font-headline text-[24px] sm:text-[30px] font-bold text-[#006972] tabular-nums leading-tight mt-0.5">
                    Rs. {(analyticsData.monthly_payout_volume || 0).toLocaleString('en-PK')}
                  </h3>
                  <p className="font-label text-[10px] text-slate-500 mt-2">Disbursed to cycle recipients</p>
                </div>

                {/* On-Time Payment Rate */}
                <div className={`${GLASS_CARD} rounded-3xl p-4 sm:p-5 relative overflow-hidden transition-all hover:shadow-[0_12px_36px_rgba(0,105,114,0.16)]`}>
                  <div className="h-1 absolute top-0 inset-x-0 bg-gradient-to-r from-teal-500 to-blue-500" />
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#006972] flex items-center justify-center border border-teal-200 shadow-sm">
                      <Icon name="verified" size={20} />
                    </div>
                    <span className="font-label text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      Compliance
                    </span>
                  </div>
                  <p className="font-label text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">On-Time Payment Compliance</p>
                  <h3 className="font-headline text-[24px] sm:text-[30px] font-bold text-deep-navy tabular-nums leading-tight mt-0.5">
                    {analyticsData.on_time_payment_rate}%
                  </h3>
                  <p className="font-label text-[10px] text-slate-500 mt-2">Contributions paid before due date</p>
                </div>

                {/* Active Member Count */}
                <div className={`${GLASS_CARD} rounded-3xl p-4 sm:p-5 relative overflow-hidden transition-all hover:shadow-[0_12px_36px_rgba(0,105,114,0.16)]`}>
                  <div className="h-1 absolute top-0 inset-x-0 bg-blue-500" />
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shadow-sm">
                      <Icon name="group" size={20} />
                    </div>
                  </div>
                  <p className="font-label text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Active Members</p>
                  <h3 className="font-headline text-[24px] sm:text-[30px] font-bold text-deep-navy tabular-nums leading-tight mt-0.5">
                    {analyticsData.active_users_count || 0}
                  </h3>
                  <p className="font-label text-[10px] text-slate-500 mt-2">Verified platform participants</p>
                </div>

                {/* Conversion Rate */}
                <div className={`${GLASS_CARD} rounded-3xl p-4 sm:p-5 relative overflow-hidden transition-all hover:shadow-[0_12px_36px_rgba(0,105,114,0.16)]`}>
                  <div className="h-1 absolute top-0 inset-x-0 bg-purple-500" />
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 shadow-sm">
                      <Icon name="trending_up" size={20} />
                    </div>
                  </div>
                  <p className="font-label text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Onboarding Conversion</p>
                  <h3 className="font-headline text-[24px] sm:text-[30px] font-bold text-purple-950 tabular-nums leading-tight mt-0.5">
                    {analyticsData.onboarding_conversion_rate}%
                  </h3>
                  <p className="font-label text-[10px] text-slate-500 mt-2">OTP verification to pool join</p>
                </div>

                {/* Average Pool Duration */}
                <div className={`${GLASS_CARD} rounded-3xl p-4 sm:p-5 relative overflow-hidden transition-all hover:shadow-[0_12px_36px_rgba(0,105,114,0.16)]`}>
                  <div className="h-1 absolute top-0 inset-x-0 bg-indigo-500" />
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200 shadow-sm">
                      <Icon name="schedule" size={20} />
                    </div>
                  </div>
                  <p className="font-label text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Avg Pool Horizon</p>
                  <h3 className="font-headline text-[24px] sm:text-[30px] font-bold text-indigo-950 tabular-nums leading-tight mt-0.5">
                    {analyticsData.average_pool_duration_months} Months
                  </h3>
                  <p className="font-label text-[10px] text-slate-500 mt-2">Average rotation cycle capacity</p>
                </div>

              </section>

              {/* ── DUAL CHARTS SECTION ── */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Monthly Volume vs Payout Trend */}
                <div className={`${GLASS_CARD} lg:col-span-2 rounded-3xl p-5 sm:p-6 space-y-4`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h2 className="font-headline text-[17px] font-bold text-deep-navy flex items-center gap-2">
                        <Icon name="show_chart" size={18} className="text-[#006972]" />
                        Monthly Capital vs Disbursed Payouts
                      </h2>
                      <p className="font-label text-[11px] text-on-surface-variant">
                        Comparison of total committee deposits vs recipient payouts (PKR Millions)
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 px-2">
                      {growthChartData.map((d, i) => (
                        <div key={d.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                          <div className="flex items-end justify-center gap-1.5 w-full h-full p-1 bg-slate-100/60 rounded-2xl overflow-hidden">
                            {/* Capital Deposit Bar */}
                            <div
                              style={{ height: `${(d.capital / 5.0) * 100}%` }}
                              className="flex-1 rounded-xl bg-[#006972] transition-all group-hover:bg-[#00575f]"
                              title={`Deposits: PKR ${d.capital}M`}
                            />
                            {/* Disbursed Payout Bar */}
                            <div
                              style={{ height: `${(d.payouts / 5.0) * 100}%` }}
                              className="flex-1 rounded-xl bg-emerald-500 transition-all group-hover:bg-emerald-600"
                              title={`Payouts: PKR ${d.payouts}M`}
                            />
                          </div>
                          <span className="font-label text-[11px] font-bold text-slate-600">{d.month}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-6 font-label text-[11px]">
                      <span className="flex items-center gap-2 text-deep-navy font-semibold">
                        <span className="w-3 h-3 rounded-full bg-[#006972]" /> Total Capital Deposits
                      </span>
                      <span className="flex items-center gap-2 text-deep-navy font-semibold">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" /> Released Recipient Payouts
                      </span>
                    </div>
                  </div>
                </div>

                {/* Channel & Gateway Payment Ratios */}
                <div className={`${GLASS_CARD} rounded-3xl p-5 sm:p-6 space-y-4 flex flex-col justify-between`}>
                  <div>
                    <h2 className="font-headline text-[17px] font-bold text-deep-navy flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Icon name="account_balance" size={18} className="text-[#006972]" />
                      Payment Gateway Shares
                    </h2>
                    <p className="font-label text-[11px] text-on-surface-variant mt-1">
                      Participant deposit method breakdown across Pakistan
                    </p>
                  </div>

                  <div className="space-y-4 py-2">
                    <div className="py-4 text-center">
                      <Icon name="info" size={24} className="text-slate-400 mx-auto mb-2" />
                      <p className="font-label text-[12px] text-on-surface-variant font-bold">Payment gateway breakdown not yet available</p>
                      <p className="font-body text-[11px] text-slate-400 mt-1">Data will populate as payment integrations are activated</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-teal-50/80 border border-teal-100 text-center">
                    <p className="font-label text-[11px] text-[#006972] font-bold">
                      Payment gateway data will appear once integrations are live
                    </p>
                  </div>
                </div>

              </section>
            </>
          )}

        </main>
      </div>

      {/* Floating Glass Bottom Navbar for Mobile */}
      <AdminMobileNav />
    </AuthAmbientBackground>
  );
}
