import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/screen.png';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import { setupProfile, logout } from '../../services/authService';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const passwordsMatch = password && confirmPass && password === confirmPass;
  const passwordStrong = password.length >= 8;
  const isFormValid = passwordStrong && passwordsMatch;
  const strength = getStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    setLoading(true);

    try {
      await setupProfile({ password });
      await logout();
      navigate('/login', { state: { passwordReset: true } });
    } catch (err) {
      if (err.status === 401) {
        setApiError('Your reset session has expired. Please start the password reset again.');
      } else {
        setApiError(err.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthAmbientBackground showTicker={true}>
      <div className="w-full max-w-md mx-auto px-3 sm:px-4 py-4 sm:py-8 flex flex-col items-center justify-center min-h-[calc(100vh-36px)]">

        <main className="w-full bg-white/85 backdrop-blur-2xl border border-[#006972]/20 shadow-[0_24px_70px_-15px_rgba(0,105,114,0.22),0_0_0_1px_rgba(0,105,114,0.1)] rounded-2xl sm:rounded-3xl p-5 sm:p-8 animate-fade-up relative z-10">

          {/* Header navigation bar */}
          <div className="w-full flex items-center justify-start mb-2">
            <button
              onClick={() => navigate('/forgot-password')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/5 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-colors cursor-pointer active:scale-95"
              aria-label="Go back"
            >
              <Icon name="arrow_back" size={20} />
            </button>
          </div>

          {/* Logo & Heading */}
          <div className="text-center mb-6 w-full flex flex-col items-center">
            <div className="relative mb-2 cursor-pointer" onClick={() => navigate('/')}>
              <img
                alt="Sanjhi Logo"
                src={logo}
                className="w-20 h-20 sm:w-26 sm:h-26 object-contain drop-shadow-sm"
              />
            </div>
            <h1 className="text-[24px] sm:text-[30px] leading-tight font-bold text-deep-navy mb-1 font-headline">
              Set New Password
            </h1>
            <p className="font-body text-[13px] sm:text-[14px] text-on-surface-variant">
              Choose a strong new password for your account.
            </p>
          </div>

          {/* API Error Box */}
          {apiError && (
            <div className="w-full mb-4 p-3 sm:p-3.5 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl text-rose-700 text-[12px] sm:text-[13px] font-body flex items-start gap-2 animate-fade-in shadow-sm">
              <Icon name="error" size={18} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3.5 sm:space-y-4">

            {/* New Password */}
            <div className="space-y-1 text-left">
              <label htmlFor="new-password" className="block font-label text-[12px] sm:text-[13px] font-bold text-deep-navy">
                New Password
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#006972]/10 flex items-center justify-center text-[#006972] group-focus-within:bg-[#006972] group-focus-within:text-white transition-all">
                  <Icon name="lock" size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="new-password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full h-11 sm:h-12 pl-12 pr-11 bg-white border border-[#006972]/20 rounded-xl sm:rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10 transition-all font-body text-[14px] text-deep-navy outline-none shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-on-surface-variant hover:text-[#006972] transition-colors cursor-pointer"
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>

              {/* Password Strength Visual Meter */}
              {password && (
                <div className="space-y-1 px-1">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((level) => {
                      const active = strength >= level;
                      const colors = ['bg-rose-500', 'bg-amber-500', 'bg-amber-400', 'bg-emerald-600'];
                      return (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            active ? colors[strength - 1] : 'bg-[#006972]/10'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[11px] font-semibold text-right text-on-surface-variant">
                    Strength: {['Weak', 'Fair', 'Good', 'Strong'][Math.max(0, strength - 1)]}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1 text-left">
              <label htmlFor="confirm-password" className="block font-label text-[12px] sm:text-[13px] font-bold text-deep-navy">
                Confirm New Password
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#006972]/10 flex items-center justify-center text-[#006972] group-focus-within:bg-[#006972] group-focus-within:text-white transition-all">
                  <Icon name="lock_reset" size={18} />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirm-password"
                  required
                  autoComplete="new-password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full h-11 sm:h-12 pl-12 pr-11 bg-white border border-[#006972]/20 rounded-xl sm:rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10 transition-all font-body text-[14px] text-deep-navy outline-none shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-on-surface-variant hover:text-[#006972] transition-colors cursor-pointer"
                >
                  <Icon name={showConfirm ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>

              {confirmPass && !passwordsMatch && (
                <p className="text-[11px] sm:text-[12px] font-medium text-rose-600 ml-1">Passwords don't match</p>
              )}
              {confirmPass && passwordsMatch && (
                <p className="text-[11px] sm:text-[12px] font-medium text-emerald-600 ml-1">✓ Passwords match</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="relative overflow-hidden w-full bg-[#006972] hover:bg-[#00575f] text-white py-3.5 px-6 rounded-xl sm:rounded-2xl font-label text-[15px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] duration-200 mt-2 shadow-lg shadow-[#006972]/25 hover:shadow-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-none"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  Reset Password
                  <Icon name="arrow_forward" size={18} />
                </>
              )}
            </button>
          </form>

          {/* Trust Banner */}
          <div className="mt-5 bg-[#006972]/8 border border-[#006972]/15 rounded-xl sm:rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#006972]/15 text-[#006972] flex items-center justify-center shrink-0">
              <Icon name="verified_user" size={18} />
            </div>
            <div className="text-left">
              <h4 className="font-headline text-[12px] sm:text-[13px] font-bold text-deep-navy">Secure Password Reset</h4>
              <p className="font-body text-[10px] sm:text-[11px] text-on-surface-variant leading-tight">
                You'll be logged out of all sessions after resetting your password.
              </p>
            </div>
          </div>
        </main>
      </div>
    </AuthAmbientBackground>
  );
}

function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
