import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import logo from '../../assets/screen.png';
import Icon from '../../components/Icon';

export default function JoinByCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
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

  function handleContinue(e) {
    e.preventDefault();
    triggerRipple(e, 'continue');
    const cleanCode = code.trim() ? code.trim() : 'SANJHI-8492K';
    setTimeout(() => {
      navigate(`/join/${cleanCode}`);
    }, 200);
  }

  return (
    <AuthAmbientBackground showTicker={true}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col items-center justify-center min-h-[calc(100vh-36px)]">
        
        {/* Main Glass Card */}
        <main className="max-w-md w-full bg-white/90 backdrop-blur-2xl border border-[#006972]/20 shadow-[0_24px_70px_-15px_rgba(0,105,114,0.22),0_0_0_1px_rgba(0,105,114,0.1)] rounded-2xl sm:rounded-3xl p-6 sm:p-10 animate-fade-up relative z-10">
          
          {/* Header Navigation */}
          <header className="w-full flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/5 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-colors cursor-pointer active:scale-95 border-none"
            >
              <Icon name="arrow_back" size={20} />
            </button>
          </header>

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
              Join a Committee
            </h1>
            <p className="font-body text-[13px] sm:text-[14px] text-on-surface-variant">
              Enter the unique invite code or link provided by the committee organizer.
            </p>
          </div>

          {/* Form Content: Via Code */}
          <form onSubmit={handleContinue} className="space-y-6">
            <div>
              <label htmlFor="inviteCode" className="block font-label text-[14px] text-deep-navy mb-2 text-center font-bold">
                Invite Code
              </label>
              <input
                id="inviteCode"
                type="text"
                required
                maxLength="20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SANJHI-8492K"
                className="block w-full px-4 py-4 border border-[#c4c6cc] rounded-xl bg-[#f5f4e8] focus:ring-[#006972] focus:border-[#006972] transition-colors text-deep-navy outline-none font-body text-[18px] text-center uppercase tracking-widest placeholder:text-on-surface-variant/50 placeholder:font-normal placeholder:tracking-normal font-bold"
              />
            </div>

            <div className="text-center bg-[#006972]/5 p-3 rounded-xl border border-[#006972]/10">
              <p className="font-label text-[12px] text-on-surface-variant flex items-center justify-center gap-1.5">
                <Icon name="info" size={16} className="text-[#006972]" />
                Alternatively, click an invite link shared with you via WhatsApp or Email
              </p>
            </div>

            <button
              type="submit"
              className="relative overflow-hidden w-full bg-[#006972] hover:bg-[#00575f] text-white font-label text-[14px] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer border-none"
            >
              {ripples.continue && (
                <span
                  className="absolute rounded-full bg-white/30 w-32 h-32 -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none"
                  style={{ left: ripples.continue.x, top: ripples.continue.y }}
                />
              )}
              View Committee & Request to Join
              <Icon name="arrow_forward" size={20} />
            </button>
          </form>

        </main>
      </div>
    </AuthAmbientBackground>
  );
}
