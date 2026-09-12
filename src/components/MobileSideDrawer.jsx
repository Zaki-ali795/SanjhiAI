import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavDrawer } from '../context/NavDrawerContext';
import Icon from './Icon';
import CnicVerificationModal from './CnicVerificationModal';
import { getCnicStatus, logout } from '../services/authService';
import { getUnreadCount } from '../services/notificationService';
import logo from '../assets/screen.png';
import aiLogo from '../assets/sanjhi-ai-logo.png';
import whatsappIcon from '../assets/whatsapp-icon.svg';
import { SUPPORT_WHATSAPP_NUMBER } from '../utils/constants';

const WHATSAPP_NUMBER = SUPPORT_WHATSAPP_NUMBER;

export default function MobileSideDrawer() {
  const { isDrawerOpen, closeDrawer } = useNavDrawer();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [cnicStatus, setCnicStatus] = useState('unverified');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCnicModal, setShowCnicModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (isDrawerOpen) {
      loadData();
    }
  }, [isDrawerOpen]);

  const loadData = useCallback(async () => {
    try {
      const stored = localStorage.getItem('sanjhi_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
      const cnicData = await getCnicStatus().catch(() => null);
      if (cnicData) {
        const cnic = cnicData.cnic || cnicData;
        setCnicStatus(cnic.cnic_status || 'unverified');
      }
      const countData = await getUnreadCount().catch(() => null);
      if (countData && typeof countData.unreadCount === 'number') {
        setUnreadCount(countData.unreadCount);
      }
    } catch (_) {}
  }, []);

  const handleNavigate = useCallback((path) => {
    navigate(path);
    closeDrawer();
  }, [navigate, closeDrawer]);

  function openWhatsApp() {
    const message = encodeURIComponent('Hello! I need assistance with Sanjhi Committees.');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    closeDrawer();
  }

  async function handleConfirmLogout() {
    setShowLogoutModal(false);
    closeDrawer();
    try {
      await logout();
    } catch (_) {}
    localStorage.removeItem('sanjhi_token');
    localStorage.removeItem('sanjhi_user');
    navigate('/auth/login');
  }

  if (!isDrawerOpen && !showCnicModal && !showLogoutModal) return null;

  return (
    <>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Slide-out Drawer Panel — spring curve for native feel */}
          <div className="relative w-full max-w-[320px] sm:max-w-[360px] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-slide-right overflow-y-auto font-body text-[#101F20]">
          
          {/* Top Section */}
          <div>
            {/* Header / Brand & Close Button */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-[#004f56] via-[#006972] to-[#00383D] text-white relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#D4AF37]/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2.5">
                  <img src={logo} alt="Sanjhi" className="w-8 h-8 object-contain drop-shadow" />
                  <div>
                    <span className="font-headline font-bold text-lg leading-tight tracking-tight block">Sanjhi AI</span>
                    <span className="text-[10px] text-emerald-200 font-label uppercase tracking-wider block">Community Savings</span>
                  </div>
                </div>

                <button
                  onClick={closeDrawer}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                  aria-label="Close menu"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>

              {/* User Profile Card Inside Header */}
              <div
                onClick={() => handleNavigate('/profile')}
                className="bg-white/10 hover:bg-white/18 border border-white/15 rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-all active:scale-98 relative z-10"
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#FFE082] text-[#1a1400] font-bold text-lg flex items-center justify-center shadow-md overflow-hidden border-2 border-white">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      (user?.full_name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#004f56] bg-emerald-500" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-headline font-bold text-sm text-white truncate">
                    {user?.full_name || 'My Account'}
                  </h4>
                  <p className="text-xs text-white/75 truncate font-mono">
                    {user?.phone_number || user?.email || 'Tap to view profile'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {cnicStatus === 'verified' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold border border-emerald-300/30">
                        <Icon name="check_circle" size={12} />
                        CNIC Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-bold border border-amber-300/30">
                        <Icon name="gpp_maybe" size={12} />
                        Unverified CNIC
                      </span>
                    )}
                  </div>
                </div>

                <Icon name="chevron_right" size={20} className="text-white/60" />
              </div>
            </div>

            {/* Quick AI & WhatsApp Assist Banner */}
            <div className="p-3 bg-[#F4F9F9] border-b border-gray-100 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleNavigate('/assistant')}
                className="flex items-center gap-2 p-2 rounded-xl bg-white hover:bg-[#006972]/8 border border-[#006972]/20 text-[#006972] text-xs font-label font-bold transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <img src={aiLogo} alt="AI" className="w-5 h-5 rounded-md object-cover shrink-0" />
                <span className="truncate">Sanjhi AI Bot</span>
              </button>

              <button
                onClick={openWhatsApp}
                className="flex items-center gap-2 p-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-label font-bold transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5 shrink-0" />
                <span className="truncate">WhatsApp Help</span>
              </button>
            </div>

            {/* Nav Groups */}
            <div className="p-3 sm:p-4 space-y-4">
              
              {/* Group 1: Savings & Committees */}
              <div>
                <p className="text-[11px] font-label font-bold text-gray-400 uppercase tracking-wider px-3 mb-1.5">
                  Savings Circles
                </p>
                <div className="space-y-0.5">
                  <DrawerLink
                    icon="dashboard"
                    label="Dashboard"
                    path="/dashboard"
                    currentPath={location.pathname}
                    onClick={() => handleNavigate('/dashboard')}
                  />
                  <DrawerLink
                    icon="explore"
                    label="Public Marketplace"
                    badge="Explore"
                    badgeColor="bg-[#006972]/10 text-[#006972]"
                    path="/committees/public"
                    currentPath={location.pathname}
                    onClick={() => handleNavigate('/committees/public')}
                  />
                  <DrawerLink
                    icon="account_balance_wallet"
                    label="My Savings Pools"
                    path="/pools"
                    currentPath={location.pathname}
                    onClick={() => handleNavigate('/pools')}
                  />
                  <DrawerLink
                    icon="add_circle"
                    label="Create New Pool"
                    path="/committee/create"
                    currentPath={location.pathname}
                    onClick={() => handleNavigate('/committee/create')}
                  />
                  <DrawerLink
                    icon="vpn_key"
                    label="Join via Invite Code"
                    path="/join"
                    currentPath={location.pathname}
                    onClick={() => handleNavigate('/join')}
                  />
                </div>
              </div>

              {/* Group 2: Payments & Payouts */}
              <div>
                <p className="text-[11px] font-label font-bold text-gray-400 uppercase tracking-wider px-3 mb-1.5">
                  Payments & Turns
                </p>
                <div className="space-y-0.5">
                  <DrawerLink
                    icon="payments"
                    label="My Payments & History"
                    path="/payments"
                    currentPath={location.pathname}
                    onClick={() => handleNavigate('/payments')}
                  />
                  <DrawerLink
                    icon="payment"
                    label="Pay Monthly Dues"
                    path="/payments/pay"
                    currentPath={location.pathname}
                    onClick={() => handleNavigate('/payments/pay')}
                  />
                  <DrawerLink
                    icon="currency_exchange"
                    label="Release Payout Turn"
                    path="/payments/release"
                    currentPath={location.pathname}
                    onClick={() => handleNavigate('/payments/release')}
                  />
                </div>
              </div>

              {/* Group 3: Support & Complaints */}
              <div>
                <p className="text-[11px] font-label font-bold text-gray-400 uppercase tracking-wider px-3 mb-1.5">
                  Support & Complaints
                </p>
                <div className="space-y-0.5">
                  <DrawerLink
                    icon="notifications"
                    label="Notifications"
                    badge={unreadCount > 0 ? (unreadCount > 9 ? '9+' : `${unreadCount}`) : null}
                    badgeColor="bg-amber-500 text-white font-bold"
                    path="/notifications"
                    currentPath={location.pathname}
                    onClick={() => handleNavigate('/notifications')}
                  />
                  <DrawerLink
                    icon="contact_support"
                    label="Help & FAQ Center"
                    path="/support"
                    currentPath={location.pathname}
                    onClick={() => handleNavigate('/support')}
                  />
                  <DrawerLink
                    icon="edit_note"
                    label="File a Complaint"
                    path="/support/file-complaint"
                    currentPath={location.pathname}
                    onClick={() => handleNavigate('/support/file-complaint')}
                  />
                  <DrawerLink
                    icon="feedback"
                    label="My Complaints"
                    path="/support/complaints"
                    currentPath={location.pathname}
                    onClick={() => handleNavigate('/support/complaints')}
                  />
                  <DrawerLink
                    icon="flag"
                    label="Report a User"
                    path="/support/file-complaint"
                    currentPath={location.pathname + location.search}
                    onClick={() => handleNavigate('/support/file-complaint?mode=user_report')}
                  />
                  <button
                    onClick={() => {
                      closeDrawer();
                      setShowCnicModal(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-label font-semibold text-gray-700 hover:bg-gray-100 hover:text-[#006972] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Icon name="badge" size={20} className="text-gray-500" />
                      <span>CNIC Verification</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      cnicStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {cnicStatus === 'verified' ? 'Verified' : 'Verify'}
                    </span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Footer Section with Phone Safe-Area Clearance */}
          <div className="p-4 border-t border-gray-100 bg-[#F9FAFB] space-y-3 pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))] shrink-0">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-label font-bold text-xs sm:text-sm border border-rose-200 transition-colors cursor-pointer"
            >
              <Icon name="logout" size={18} />
              <span>Log Out</span>
            </button>

            <p className="text-[10.5px] text-center text-gray-400 font-medium">
              Sanjhi AI v2.4.0 • Secured Peer ROSCA
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Icon name="logout" size={24} />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-deep-navy">Log Out of Sanjhi?</h3>
              <p className="text-xs text-gray-500 mt-1">You will need your phone/password to sign back in.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CNIC Verification Modal */}
      <CnicVerificationModal
        isOpen={showCnicModal}
        onClose={() => setShowCnicModal(false)}
        onVerified={() => {
          setCnicStatus('verified');
          setShowCnicModal(false);
          loadData();
        }}
      />
    </>
  );
}

function DrawerLink({ icon, label, path, currentPath, onClick, badge, badgeColor }) {
  const active = currentPath === path;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-label font-semibold transition-all cursor-pointer ${
        active
          ? 'bg-gradient-to-r from-[#006972] to-[#004f56] text-white shadow-sm'
          : 'text-gray-700 hover:bg-gray-100 hover:text-[#006972]'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon name={icon} size={20} className={active ? 'text-[#FFE082]' : 'text-gray-500'} />
        <span>{label}</span>
      </div>
      {badge && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
          active ? 'bg-white/20 text-white' : badgeColor || 'bg-gray-100 text-gray-600'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}
