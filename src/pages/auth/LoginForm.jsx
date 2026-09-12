import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/screen.png';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import { loginWithPassword, sendOTP } from '../../services/authService';

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const passwordJustReset = location.state?.passwordReset === true;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [ripples, setRipples] = useState({});

  function triggerRipple(e, key) {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipples((prev) => ({
      ...prev,
      [key]: { x: e.clientX - rect.left, y: e.clientY - rect.top, k: Date.now() },
    }));
    setTimeout(() => {
      setRipples((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 600);
  }

  async function handleSendOTPDirect(targetEmail) {
    targetEmail = targetEmail || email;
    if (!targetEmail.trim()) {
      setApiError('Please enter your email or phone number first.');
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      await sendOTP({ target: targetEmail.trim(), purpose: 'login' });
      navigate('/otp', {
        state: {
          target: targetEmail.trim(),
          purpose: 'login',
        },
      });
    } catch (err) {
      const isUnregistered =
        err.data?.unregistered === true ||
        err.status === 404 ||
        (err.message && (
          err.message.toLowerCase().includes('not registered') ||
          err.message.toLowerCase().includes('no account') ||
          err.message.toLowerCase().includes('registration')
        ));

      if (isUnregistered) {
        setApiError('This account is not registered yet. Redirecting you to complete your details...');
        const isEmail = targetEmail.includes('@');
        setTimeout(() => {
          navigate(isEmail ? '/signup/email' : '/signup/phone', {
            state: { initialTarget: targetEmail.trim() },
          });
        }, 1200);
      } else {
        setApiError(err.message || 'Failed to send OTP.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    setLoading(true);

    try {
      const res = await loginWithPassword({ target: email.trim(), password });
      const isAdmin = res?.user?.is_admin || email.trim().toLowerCase() === 'admin@sanjhi.pk';
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const nextFailCount = failedAttempts + 1;
      setFailedAttempts(nextFailCount);

      if (nextFailCount >= 3) {
        setApiError('Incorrect password entered 3 times. Automatically switching to OTP verification...');
        setTimeout(() => handleSendOTPDirect(email.trim()), 1200);
      } else {
        setApiError(err.message || `Incorrect password (${3 - nextFailCount} attempt${3 - nextFailCount === 1 ? '' : 's'} remaining).`);
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
              onClick={() => navigate('/')}
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
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-sm"
              />
            </div>
            <h1 className="text-[24px] sm:text-[30px] leading-tight font-bold text-deep-navy mb-1 font-headline">
              Welcome Back
            </h1>
            <p className="font-body text-[13px] sm:text-[14px] text-on-surface-variant">
              Log in to access your committees & savings ledger
            </p>
          </div>

          {/* Password Reset Success Box */}
          {passwordJustReset && !apiError && (
            <div className="w-full mb-4 p-3 sm:p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl text-emerald-700 text-[12px] sm:text-[13px] font-body flex items-start gap-2 animate-fade-in shadow-sm">
              <Icon name="check_circle" size={18} className="shrink-0 mt-0.5 text-emerald-600" />
              <span>Your password has been reset successfully. Please log in with your new password.</span>
            </div>
          )}

          {/* API Error Box */}
          {apiError && (
            <div className="w-full mb-4 p-3 sm:p-3.5 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl text-rose-700 text-[12px] sm:text-[13px] font-body flex items-start gap-2 animate-fade-in shadow-sm">
              <Icon name="error" size={18} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3.5 sm:space-y-4">

            {/* Email / Phone Field */}
            <div className="space-y-1 text-left">
              <label htmlFor="email" className="block font-label text-[12px] sm:text-[13px] font-bold text-deep-navy">
                Email or Phone Number
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#006972]/10 flex items-center justify-center text-[#006972] group-focus-within:bg-[#006972] group-focus-within:text-white transition-all duration-200">
                  <Icon name="mail" size={18} />
                </div>
                <input
                  type="text"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@email.com or +92300..."
                  className="w-full h-11 sm:h-12 pl-12 pr-4 bg-white border border-[#006972]/20 rounded-xl sm:rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10 transition-all font-body text-[14px] text-deep-navy outline-none shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1 text-left">
              <label htmlFor="password" className="block font-label text-[12px] sm:text-[13px] font-bold text-deep-navy">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#006972]/10 flex items-center justify-center text-[#006972] group-focus-within:bg-[#006972] group-focus-within:text-white transition-all duration-200">
                  <Icon name="lock" size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 sm:h-12 pl-12 pr-11 bg-white border border-[#006972]/20 rounded-xl sm:rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10 transition-all font-body text-[14px] text-deep-navy outline-none shadow-sm"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-on-surface-variant hover:text-[#006972] transition-colors cursor-pointer border-none bg-transparent"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
            </div>

            {/* Secondary Action Links */}
            <div className="flex justify-between items-center w-full pt-1">
              <button
                type="button"
                onClick={() => handleSendOTPDirect()}
                className="font-label text-[12px] sm:text-[13px] font-bold text-[#006972] hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
              >
                <Icon name="sms" size={15} />
                Sign in with OTP
              </button>

              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="font-label text-[12px] sm:text-[13px] font-medium text-on-surface-variant hover:text-[#006972] transition-colors bg-transparent border-none cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              onClick={(e) => triggerRipple(e, 'submit')}
              className="relative overflow-hidden w-full bg-[#006972] hover:bg-[#00575f] text-white py-3.5 px-6 rounded-xl sm:rounded-2xl font-label text-[15px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] duration-200 mt-2 shadow-lg shadow-[#006972]/25 hover:shadow-xl cursor-pointer disabled:opacity-50 border-none"
            >
              {ripples.submit && (
                <span
                  className="absolute rounded-full bg-white/30 w-32 h-32 -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none"
                  style={{ left: ripples.submit.x, top: ripples.submit.y }}
                />
              )}
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Log In
                  <Icon name="arrow_forward" size={18} />
                </>
              )}
            </button>
          </form>

          {/* Bottom Switch Link */}
          <div className="mt-5 pt-4 border-t border-[#006972]/10 text-center">
            <p className="font-body text-[13px] sm:text-[14px] text-on-surface-variant">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-[#006972] font-bold hover:underline underline-offset-4 bg-transparent border-none cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </div>
        </main>
      </div>
    </AuthAmbientBackground>
  );
}
