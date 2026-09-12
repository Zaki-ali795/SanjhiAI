import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import logo from '../../assets/screen.png';
import { verifyOTP, resendOTP, setupProfile } from '../../services/authService';

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();

  const { target = '', purpose = 'signup', fullName, age, sex, password } = location.state || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(59);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [ripples, setRipples] = useState({});
  const inputRefs = useRef([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const handleChange = (index, value) => {
    const val = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    setErrorMessage('');
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      setErrorMessage('');
      await resendOTP({ target, purpose });
      setTimeLeft(59);
      setResendStatus('New verification code sent!');
    } catch (err) {
      console.error('Resend OTP error:', err);
      setErrorMessage(err.message || 'Failed to resend verification code');
    }
  };

  const handleVerify = async (e) => {
    if (e) triggerRipple(e, 'verify');
    const codeStr = otp.join('');
    if (codeStr.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Verify OTP code with backend (created via Green API WhatsApp or Email)
      const result = await verifyOTP({ target, code: codeStr, purpose, password });

      if (fullName || password) {
        await setupProfile({
          full_name: fullName,
          ...(age && { age: parseInt(age, 10) }),
          ...(sex && { sex }),
          ...(password && { password }),
        });
      }

      if (purpose === 'password_reset') {
        navigate('/reset-password');
      } else if (result.isNew && !fullName) {
        navigate('/profile-setup');
      } else if (result?.user?.is_admin || target.toLowerCase() === 'admin@sanjhi.pk') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setErrorMessage(err.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthAmbientBackground showTicker={true}>
      <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-36px)]">
        
        {/* Main Glass Card with Rich Box Shadow */}
        <main className="w-full bg-white/85 backdrop-blur-2xl border border-[#006972]/20 shadow-[0_24px_70px_-15px_rgba(0,105,114,0.22),0_0_0_1px_rgba(0,105,114,0.1)] rounded-3xl p-6 sm:p-8 animate-fade-up relative z-10 flex flex-col items-center">
          
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/5 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-colors cursor-pointer active:scale-95"
            >
              <Icon name="arrow_back" size={20} />
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-label text-[11px] font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Verification
            </span>
          </div>

          {/* Logo & Headline */}
          <div className="mb-6 w-full flex flex-col items-center text-center">
            <img
              alt="Sanjhi Logo"
              src={logo}
              className="w-20 h-20 sm:w-24 sm:h-24 mb-2 object-contain drop-shadow-sm"
            />
            <h1 className="font-headline text-[26px] sm:text-[32px] font-bold text-deep-navy tracking-tight mb-1">
              Verify your code
            </h1>
            <p className="font-body text-[14px] text-on-surface-variant max-w-xs">
              Enter the 6-digit code sent to <span className="font-bold text-deep-navy">{target}</span>
            </p>

            {resendStatus && (
              <div className="mt-2 text-emerald-600 text-[13px] font-semibold flex items-center gap-1 animate-fade-in">
                <Icon name="check_circle" size={16} />
                {resendStatus}
              </div>
            )}
          </div>

          {/* OTP Digit Inputs */}
          <div className="w-full flex flex-col items-center mb-6">
            <div className="flex justify-center items-center gap-2 mb-2 w-full">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                  className={`otp-input w-11 sm:w-13 h-14 bg-white border-2 rounded-2xl text-center font-headline text-[24px] font-bold text-deep-navy focus:outline-none transition-all shadow-sm ${
                    errorMessage
                      ? 'border-rose-500 bg-rose-50/50 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-[#006972]/20 focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10'
                  }`}
                />
              ))}
            </div>

            {errorMessage && (
              <div className="flex items-center justify-center text-rose-600 gap-1.5 mt-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl w-full text-center">
                <Icon name="error" size={16} />
                <span className="font-label text-[12px] font-semibold">{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Timer & Resend */}
          <div className="w-full flex flex-col items-center mb-4">
            {timeLeft > 0 ? (
              <div className="flex items-center gap-1.5 font-label text-[13px]">
                <Icon name="schedule" size={16} className="text-on-surface-variant" />
                <span className="text-on-surface-variant">Resend code in</span>
                <span className="text-[#006972] font-bold">
                  00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                </span>
              </div>
            ) : (
              <button
                onClick={handleResend}
                className="font-label text-[13px] text-[#006972] hover:underline font-bold cursor-pointer bg-transparent border-none flex items-center gap-1"
              >
                <Icon name="refresh" size={16} />
                Resend Verification Code
              </button>
            )}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length < 6}
            className="relative overflow-hidden w-full bg-[#006972] hover:bg-[#00575f] text-white py-3.5 px-6 rounded-2xl font-label text-[15px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] duration-200 shadow-lg shadow-[#006972]/25 hover:shadow-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-none"
          >
            {ripples.verify && (
              <span
                className="absolute rounded-full bg-white/30 w-32 h-32 -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none"
                style={{ left: ripples.verify.x, top: ripples.verify.y }}
              />
            )}
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Verifying Code...
              </>
            ) : (
              <>
                Verify & Continue
                <Icon name="arrow_forward" size={18} />
              </>
            )}
          </button>
        </main>
      </div>
    </AuthAmbientBackground>
  );
}
