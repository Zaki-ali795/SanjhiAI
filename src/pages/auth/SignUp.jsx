import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import logo from '../../assets/screen.png';

export default function SignUp() {
  const navigate = useNavigate();
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

  return (
    <AuthAmbientBackground showTicker={true}>
      <div className="w-full max-w-md mx-auto px-3 sm:px-4 py-4 sm:py-8 flex flex-col items-center justify-center min-h-[calc(100vh-36px)]">
        
        {/* Main Glass Card with Mobile Responsive Spacing */}
        <main className="w-full bg-white/85 backdrop-blur-2xl border border-[#006972]/20 shadow-[0_24px_70px_-15px_rgba(0,105,114,0.22),0_0_0_1px_rgba(0,105,114,0.1)] rounded-2xl sm:rounded-3xl p-5 sm:p-8 animate-fade-up relative z-10">
          
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/5 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-colors cursor-pointer active:scale-95"
              aria-label="Go back"
            >
              <Icon name="arrow_back" size={20} />
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006972]/10 text-[#006972] font-label text-[11px] font-bold border border-[#006972]/20">
              Step 1 of 2
            </span>
          </div>

          <div className="w-full flex flex-col items-center text-center mb-5">
            <img
              alt="Sanjhi Logo"
              src={logo}
              className="w-18 h-18 sm:w-24 sm:h-24 mb-2 object-contain drop-shadow-sm"
            />
            <h1 className="font-headline text-[24px] sm:text-[30px] leading-tight font-bold text-deep-navy mb-1">
              Create your account
            </h1>
            <p className="font-body text-[13px] sm:text-[14px] text-on-surface-variant max-w-xs">
              Choose your preferred verification method to join Sanjhi
            </p>
          </div>

          {/* Option Cards */}
          <div className="flex flex-col gap-3 sm:gap-4">
            
            {/* Phone Method */}
            <button
              onClick={(e) => {
                triggerRipple(e, 'phone');
                navigate('/signup/phone');
              }}
              className="relative overflow-hidden w-full group text-left bg-white border-2 border-[#006972]/30 hover:border-[#006972] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-xl hover:bg-[#006972]/5 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
            >
              {ripples.phone && (
                <span
                  className="absolute rounded-full bg-[#006972]/15 w-36 h-36 -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none"
                  style={{ left: ripples.phone.x, top: ripples.phone.y }}
                />
              )}

              {/* Recommended Badge */}
              <div className="absolute -top-0 right-3 sm:right-4 bg-amber-500 text-white px-2.5 sm:px-3 py-0.5 rounded-b-xl font-label text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow-sm uppercase tracking-wider">
                <Icon name="star" filled size={11} className="text-amber-200" />
                Recommended
              </div>

              <div className="flex items-center gap-3.5 pt-1">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#006972] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Icon name="smartphone" size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="font-headline text-[16px] sm:text-[17px] font-bold text-deep-navy leading-tight mb-0.5">
                    Continue with Phone
                  </h3>
                  <p className="font-body text-[12px] sm:text-[13px] text-on-surface-variant">
                    Instant SMS OTP verification
                  </p>
                </div>
                <div className="shrink-0 text-[#006972] opacity-70 group-hover:opacity-100 transition-all">
                  <Icon name="arrow_forward" size={18} />
                </div>
              </div>
            </button>

            {/* Email Method */}
            <button
              onClick={(e) => {
                triggerRipple(e, 'email');
                navigate('/signup/email');
              }}
              className="relative overflow-hidden w-full group text-left bg-white border border-[#006972]/20 hover:border-[#006972] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:bg-[#006972]/5 transition-all duration-300 transform cursor-pointer"
            >
              {ripples.email && (
                <span
                  className="absolute rounded-full bg-[#006972]/15 w-36 h-36 -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none"
                  style={{ left: ripples.email.x, top: ripples.email.y }}
                />
              )}

              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0 group-hover:bg-[#006972] group-hover:text-white transition-colors duration-300">
                  <Icon name="mail" size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="font-headline text-[16px] sm:text-[17px] font-bold text-deep-navy leading-tight mb-0.5">
                    Continue with Email
                  </h3>
                  <p className="font-body text-[12px] sm:text-[13px] text-on-surface-variant">
                    Verify via email code
                  </p>
                </div>
                <div className="shrink-0 text-deep-navy/40 group-hover:text-[#006972] transition-colors">
                  <Icon name="arrow_forward" size={18} />
                </div>
              </div>
            </button>
          </div>

          {/* Footer Link */}
          <div className="mt-6 text-center pt-4 border-t border-[#006972]/10">
            <p className="font-body text-[13px] sm:text-[14px] text-on-surface-variant">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-label text-[13px] sm:text-[14px] font-bold text-[#006972] hover:underline underline-offset-4 bg-transparent border-none cursor-pointer"
              >
                Log in
              </button>
            </p>
          </div>
        </main>
      </div>
    </AuthAmbientBackground>
  );
}
