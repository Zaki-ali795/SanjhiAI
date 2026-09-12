import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './Icon';
import { useNavDrawer } from '../context/NavDrawerContext';
import aiLogo from '../assets/sanjhi-ai-logo.png';

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Home' },
  { to: '/committees/public', icon: 'explore', label: 'Explore' },
  { to: '/pools', icon: 'account_balance_wallet', label: 'My Pools' },
  { to: '/assistant', icon: 'smart_toy', label: 'AI Bot', isAi: true },
];

function BottomNav() {
  const { openDrawer, isDrawerOpen } = useNavDrawer();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#006972]/15 shadow-[0_-8px_24px_rgba(0,105,114,0.12)] rounded-t-3xl px-2.5 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex justify-around items-center select-none"
      style={{
        WebkitBackdropFilter: 'blur(16px)',
        transform: 'translateZ(0)',
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/dashboard'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-all duration-150 py-1 px-2.5 rounded-2xl no-scale-active relative ${
              isActive
                ? 'bg-[#006972] text-white shadow-md shadow-[#006972]/25 scale-105'
                : 'text-slate-600 hover:text-[#006972] active:text-[#006972]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {item.isAi ? (
                <div className="relative">
                  <img
                    src={aiLogo}
                    alt="AI"
                    className={`w-6 h-6 rounded-lg object-cover transition-transform ${
                      isActive ? 'ring-2 ring-white/90 scale-105' : 'border border-[#006972]/20'
                    }`}
                  />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                </div>
              ) : (
                <Icon name={item.icon} size={22} className={isActive ? 'text-white' : 'text-[#006972]'} />
              )}
              <span
                className={`font-label text-[10.5px] font-bold tracking-tight mt-0.5 ${
                  isActive ? 'text-white' : 'text-slate-700'
                }`}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}

      {/* Menu / Drawer Toggle Button */}
      <button
        onClick={openDrawer}
        aria-label="Open More Menu"
        className={`flex flex-col items-center justify-center transition-all duration-150 py-1 px-2.5 rounded-2xl cursor-pointer no-scale-active border-none ${
          isDrawerOpen
            ? 'bg-[#006972] text-white shadow-md shadow-[#006972]/25 scale-105'
            : 'bg-transparent text-slate-700 hover:text-[#006972] active:bg-[#006972]/10'
        }`}
      >
        <Icon name="menu" size={22} className={isDrawerOpen ? 'text-white' : 'text-[#006972]'} />
        <span
          className={`font-label text-[10.5px] font-bold tracking-tight mt-0.5 ${
            isDrawerOpen ? 'text-white' : 'text-slate-700'
          }`}
        >
          Menu
        </span>
      </button>
    </nav>
  );
}

// Memoize: BottomNav never needs to re-render unless drawer state changes
export default memo(BottomNav);
