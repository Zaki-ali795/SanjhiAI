import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/sanjhi-logo-white.png';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';

export default function Welcome() {
  const navigate = useNavigate();
  const [ripples, setRipples] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('sanjhi_token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

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
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 lg:py-12 flex flex-col items-center justify-center min-h-[calc(100vh-36px)]">
        
        {/* Main Card Container with Glassmorphism & Box Shadow */}
        <div className="w-full bg-white/90 backdrop-blur-xl border border-[#006972]/20 shadow-[0_24px_70px_-12px_rgba(0,105,114,0.22),0_0_0_1px_rgba(0,105,114,0.12)] rounded-2xl sm:rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-fade-up">
          
          {/* Left Hero Panel (Teal Banner) */}
          <div className="lg:col-span-6 bg-[#006972] text-white p-6 sm:p-10 lg:p-12 relative overflow-hidden flex flex-col justify-between min-h-[240px] sm:min-h-[300px] lg:min-h-[480px]">
            {/* Subtle dot pattern inside teal banner */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.9) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Glowing background light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            {/* Decorative wave connector (Desktop) */}
            <div className="hidden lg:block absolute top-0 -right-px h-full w-14 z-20">
              <svg viewBox="0 0 100 600" preserveAspectRatio="none" className="h-full w-full">
                <path d="M0,0 C60,100 20,250 60,350 C90,430 20,500 40,600 L100,600 L100,0 Z" fill="white" />
              </svg>
            </div>

            {/* Premium Logo Showcase */}
            <div className="relative z-10 flex flex-col items-center text-center my-auto py-2 sm:py-6">
              <img
                alt="Sanjhi Logo"
                src={logo}
                className="w-44 sm:w-56 lg:w-64 object-contain cursor-default filter drop-shadow-2xl hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Bottom Tagline */}
            <div className="relative z-10 space-y-1.5 text-center lg:text-left">
              <h2 className="font-headline text-[20px] sm:text-[28px] lg:text-[36px] font-bold leading-tight tracking-tight text-white">
                Collective Savings.<br />Shared Success.
              </h2>
              <p className="font-body text-[12px] sm:text-[14px] text-white/80 max-w-sm mx-auto lg:mx-0">
                Empowering peer-to-peer committee groups with transparent ledger security and AI guidance.
              </p>
            </div>
          </div>

          {/* Right Action Panel */}
          <div className="lg:col-span-6 p-5 sm:p-8 lg:p-12 flex flex-col justify-between space-y-6 sm:space-y-8 bg-white/80">
            
            {/* Header & Nastaliq Urdu Text */}
            <div className="w-fit flex flex-col items-start relative">
              <h1 className="font-headline text-[24px] sm:text-[34px] font-bold text-deep-navy tracking-tight leading-tight whitespace-nowrap">
                Welcome to Sanjhi
              </h1>
              
              <div className="w-full flex justify-end pt-6">
                <p className="font-urdu text-[18px] sm:text-[22px] font-bold text-[#006972] leading-tight text-right whitespace-nowrap" dir="rtl">
                  سانجھی میں خوش آمدید
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 w-full">
              <button
                onClick={(e) => {
                  triggerRipple(e, 'getStarted');
                  navigate('/signup');
                }}
                className="relative overflow-hidden w-full py-3.5 sm:py-4 rounded-2xl font-label text-[15px] font-bold text-white bg-[#006972] hover:bg-[#00575f] active:scale-[0.98] transition-all shadow-lg shadow-[#006972]/25 hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                {ripples.getStarted && (
                  <span
                    className="absolute rounded-full bg-white/30 w-32 h-32 -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none"
                    style={{ left: ripples.getStarted.x, top: ripples.getStarted.y }}
                  />
                )}
                Get Started
                <Icon name="arrow_forward" size={18} />
              </button>

              <button
                onClick={(e) => {
                  triggerRipple(e, 'login');
                  navigate('/login');
                }}
                className="relative overflow-hidden w-full py-3.5 sm:py-4 rounded-2xl font-label text-[15px] font-bold text-[#006972] border-2 border-[#006972]/30 hover:border-[#006972] bg-white hover:bg-[#006972]/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {ripples.login && (
                  <span
                    className="absolute rounded-full bg-[#006972]/20 w-32 h-32 -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none"
                    style={{ left: ripples.login.x, top: ripples.login.y }}
                  />
                )}
                Log In to Account
              </button>
            </div>

            {/* How It Works Cards */}
            <div className="space-y-2.5 pt-2 border-t border-[#006972]/10">
              <h3 className="font-label text-[12px] sm:text-[13px] font-bold text-deep-navy uppercase tracking-wider text-left">
                How It Works
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                <FeatureCard icon="groups" title="Join a Pool" desc="Connect & save" />
                <FeatureCard icon="swap_horiz" title="Fair Payouts" desc="Monthly rotation" />
                <FeatureCard icon="verified_user" title="Build Trust" desc="Verifiable ledger" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </AuthAmbientBackground>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center text-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-[#006972]/15 hover:border-[#006972]/40 hover:bg-[#006972]/5 hover:-translate-y-1 transition-all duration-200 cursor-pointer group shadow-sm">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#006972]/10 flex items-center justify-center text-[#006972] mb-1 sm:mb-1.5 group-hover:scale-110 group-hover:bg-[#006972] group-hover:text-white transition-all duration-300">
        <Icon name={icon} size={18} />
      </div>
      <span className="font-headline text-[11px] sm:text-[12px] font-bold text-deep-navy leading-tight">{title}</span>
      <span className="font-body text-[9px] sm:text-[10px] text-on-surface-variant leading-tight mt-0.5 hidden xs:block">{desc}</span>
    </div>
  );
}
