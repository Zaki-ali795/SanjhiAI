import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { logout } from '../services/authService';

export default function AdminMobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const primaryTabs = [
    { label: 'Overview', icon: 'dashboard', path: '/admin' },
    { label: 'Users', icon: 'group', path: '/admin/users' },
    { label: 'Committees', icon: 'groups', path: '/admin/committees' },
    { label: 'Disputes', icon: 'gavel', path: '/admin/disputes' },
  ];

  const secondaryItems = [
    { label: 'CNIC Verification', icon: 'badge', path: '/admin/cnic-verification', color: 'text-amber-600 bg-amber-50' },
    { label: 'Platform Analytics', icon: 'bar_chart', path: '/admin/analytics', color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Broadcast Alerts', icon: 'campaign', path: '/admin/announcements', color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Audit Log & History', icon: 'history', path: '/admin/activity', color: 'text-[#006972] bg-[#006972]/10' },
    { label: 'Platform Settings', icon: 'settings', path: '/admin/settings', color: 'text-slate-700 bg-slate-100' },
  ];

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      // ignore
    } finally {
      navigate('/login');
    }
  }

  return (
    <>
      {/* ── FLOATING GLASS BOTTOM BAR ── */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-50">
        <nav className="w-full max-w-lg mx-auto bg-white/80 backdrop-blur-2xl border border-white/90 rounded-3xl p-1.5 flex items-center justify-around shadow-[0_12px_40px_rgba(0,105,114,0.22)]">
          {primaryTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => {
                  setShowMoreMenu(false);
                  navigate(tab.path);
                }}
                className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer border-none bg-transparent"
              >
                {isActive && (
                  <span className="absolute inset-0 bg-[#006972] rounded-2xl shadow-md shadow-[#006972]/20 transition-all duration-300" />
                )}
                <Icon
                  name={tab.icon}
                  size={20}
                  className={`relative z-10 transition-all duration-200 ${
                    isActive ? 'text-white scale-110' : 'text-deep-navy/60'
                  }`}
                />
                <span
                  className={`font-label text-[9px] mt-0.5 font-bold relative z-10 truncate max-w-[56px] ${
                    isActive ? 'text-white' : 'text-deep-navy/60'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More Items Glass Button */}
          <button
            onClick={() => setShowMoreMenu((prev) => !prev)}
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer border-none bg-transparent ${
              showMoreMenu ? 'text-[#006972]' : 'text-deep-navy/60'
            }`}
          >
            {showMoreMenu && (
              <span className="absolute inset-0 bg-[#006972]/15 rounded-2xl" />
            )}
            <Icon
              name={showMoreMenu ? 'close' : 'grid_view'}
              size={20}
              className={`relative z-10 transition-all duration-200 ${
                showMoreMenu ? 'text-[#006972] scale-110' : 'text-deep-navy/60'
              }`}
            />
            <span
              className={`font-label text-[9px] mt-0.5 font-bold relative z-10 truncate ${
                showMoreMenu ? 'text-[#006972]' : 'text-deep-navy/60'
              }`}
            >
              {showMoreMenu ? 'Close' : 'More'}
            </span>
          </button>
        </nav>
      </div>

      {/* ── SECONDARY ADMIN TOOLS GLASS POPUP SHEET ── */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-40 bg-deep-navy/40 backdrop-blur-md flex flex-col justify-end p-3 pb-24 animate-fadeIn">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl p-5 border border-white/90 shadow-2xl space-y-4 max-w-lg mx-auto w-full">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#006972]/10 text-[#006972] flex items-center justify-center">
                  <Icon name="grid_view" size={18} />
                </div>
                <div>
                  <h3 className="font-headline text-[15px] font-bold text-deep-navy">More Admin Console Tools</h3>
                  <p className="font-label text-[10px] text-on-surface-variant">System tools & platform management</p>
                </div>
              </div>

              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center border-none cursor-pointer"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {secondaryItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    setShowMoreMenu(false);
                    navigate(item.path);
                  }}
                  className="p-3 rounded-2xl bg-white/70 hover:bg-white border border-white/80 shadow-sm flex items-center gap-2.5 text-left transition-all active:scale-95 cursor-pointer"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon name={item.icon} size={18} />
                  </div>
                  <span className="font-label text-[11px] font-bold text-deep-navy leading-tight">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-label text-[12px] font-bold flex items-center justify-center gap-2 transition-all border border-rose-200 shadow-sm cursor-pointer"
            >
              <Icon name="logout" size={16} />
              Logout Staff Account
            </button>
          </div>
        </div>
      )}
    </>
  );
}
