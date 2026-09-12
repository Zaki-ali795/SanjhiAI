import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SCREENS = [
  { label: 'Welcome', path: '/' },
  { label: 'Sign Up', path: '/signup' },
  { label: 'Phone Input', path: '/signup/phone' },
  { label: 'OTP Verification', path: '/otp' },
  { label: 'Forgot Password', path: '/forgot-password' },
  { label: 'Reset Password', path: '/reset-password' },
  { label: 'Profile Setup', path: '/profile-setup' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Create Committee', path: '/committee/create' },
  { label: 'Set Schedule', path: '/committee/schedule' },
  { label: 'Link Account', path: '/committee/link-account' },
  { label: 'Review & Confirm', path: '/committee/review' },
  { label: 'Committee Created', path: '/committee/created' },
  { label: 'My Pools Hub', path: '/pools' },
  { label: 'Committee Detail', path: '/committee/1' },
  { label: 'Committee Settings', path: '/committee/1/settings' },
  { label: 'Committee Progress', path: '/committee/1/progress' },
  { label: 'Committee Setup', path: '/committee/setup' },
  { label: 'Join by Code', path: '/join' },
  { label: 'Join Committee', path: '/join/DEMO' },
  { label: 'Join Request Sent', path: '/join-request-sent' },
  { label: 'Invite Members', path: '/committee/1/invite' },
  { label: 'Join Requests', path: '/committee/1/requests' },
  { label: 'My Payments', path: '/payments' },
  { label: 'Pay Now', path: '/payments/pay' },
  { label: 'Release Payout', path: '/payments/release' },
  { label: 'Support Home', path: '/support' },
  { label: 'File Complaint', path: '/support/file-complaint' },
  { label: 'My Complaints', path: '/support/complaints' },
  { label: 'Complaint Detail', path: '/support/complaints/1' },
  { label: 'Assistant', path: '/assistant' },
  { label: 'Notifications', path: '/notifications' },
  { label: 'Profile', path: '/profile' },
  { label: 'Admin Overview', path: '/admin' },
  { label: 'Admin Analytics', path: '/admin/analytics' },
  { label: 'Admin Users', path: '/admin/users' },
  { label: 'Admin Committees', path: '/admin/committees' },
  { label: 'Admin Committee Detail', path: '/admin/committees/com-1' },
  { label: 'Admin Disputes', path: '/admin/disputes' },
  { label: 'Admin Announcements', path: '/admin/announcements' },
  { label: 'Activity Log', path: '/admin/activity' },
  { label: 'Admin Settings', path: '/admin/settings' },
  { label: 'Offline', path: '/offline' },
  { label: 'Loading', path: '/loading' },
  { label: 'Empty States', path: '/empty' },
];

export default function ScreenNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="fixed bottom-20 right-3.5 z-[9999] md:bottom-8 md:right-8">
      {/* Panel */}
      {open && (
        <div className="absolute bottom-16 right-0 w-64 max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 mb-2">
          <div className="sticky top-0 bg-white pb-2 mb-1 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 pt-2">
              All Screens ({SCREENS.length})
            </p>
            <p className="text-[10px] text-gray-400 px-3">
              Current: {location.pathname}
            </p>
          </div>
          {SCREENS.map((s) => (
            <button
              key={s.path}
              onClick={() => go(s.path)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                location.pathname === s.path
                  ? 'bg-teal-emerald/10 text-teal-emerald font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{s.label}</span>
              {location.pathname === s.path && (
                <span className="text-teal-emerald text-xs">current</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90 ${
          open
            ? 'bg-gray-800 text-white rotate-45'
            : 'bg-teal-emerald text-white hover:bg-teal-emerald/90'
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
          {open ? 'close' : 'dashboard'}
        </span>
      </button>
    </div>
  );
}
