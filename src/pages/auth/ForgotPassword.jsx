import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/screen.png';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import { sendOTP } from '../../services/authService';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = target.trim();
    if (!trimmed) {
      setApiError('Please enter your registered email or phone number.');
      return;
    }
    setApiError('');
    setLoading(true);

    try {
      await sendOTP({ target: trimmed, purpose: 'password_reset' });
      navigate('/otp', {
        state: {
          target: trimmed,
          purpose: 'password_reset',
        },
      });
    } catch (err) {
      setApiError(err.message || 'Failed to send verification code. Please try again.');
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
              onClick={() => navigate('/login')}
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
              Reset Password
            </h1>
            <p className="font-body text-[13px] sm:text-[14px] text-on-surface-variant">
              Enter your registered email or phone number and we'll send you a verification code.
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

            {/* Email / Phone Field */}
            <div className="space-y-1 text-left">
              <label htmlFor="target" className="block font-label text-[12px] sm:text-[13px] font-bold text-deep-navy">
                Email or Phone Number
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#006972]/10 flex items-center justify-center text-[#006972] group-focus-within:bg-[#006972] group-focus-within:text-white transition-all duration-200">
                  <Icon name="lock_reset" size={18} />
                </div>
                <input
                  type="text"
                  id="target"
                  required
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. name@email.com or +92300..."
                  className="w-full h-11 sm:h-12 pl-12 pr-4 bg-white border border-[#006972]/20 rounded-xl sm:rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10 transition-all font-body text-[14px] text-deep-navy outline-none shadow-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative overflow-hidden w-full bg-[#006972] hover:bg-[#00575f] text-white py-3.5 px-6 rounded-xl sm:rounded-2xl font-label text-[15px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] duration-200 mt-2 shadow-lg shadow-[#006972]/25 hover:shadow-xl cursor-pointer disabled:opacity-50 border-none"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Sending Code...
                </>
              ) : (
                <>
                  Send Verification Code
                  <Icon name="arrow_forward" size={18} />
                </>
              )}
            </button>
          </form>

          {/* Bottom Switch Link */}
          <div className="mt-5 pt-4 border-t border-[#006972]/10 text-center">
            <p className="font-body text-[13px] sm:text-[14px] text-on-surface-variant">
              Remembered your password?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-[#006972] font-bold hover:underline underline-offset-4 bg-transparent border-none cursor-pointer"
              >
                Back to Login
              </button>
            </p>
          </div>
        </main>
      </div>
    </AuthAmbientBackground>
  );
}
