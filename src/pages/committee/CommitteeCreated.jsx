import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import logo from '../../assets/screen.png';

export default function CommitteeCreated() {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state || {};

  const committeeName = data.name || 'New Savings Committee';
  const inviteCode = data.inviteCode || 'SANJHI-782K';

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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

  function handleCopyCode() {
    navigator.clipboard?.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleCopyLink() {
    const link = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <AuthAmbientBackground showTicker={true}>
      <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-36px)]">
        
        {/* Main Glass Card matching User Dashboard */}
        <main className="w-full bg-white/90 backdrop-blur-xl border border-[#006972]/20 shadow-[0_24px_70px_-15px_rgba(0,105,114,0.22),0_0_0_1px_rgba(0,105,114,0.1)] rounded-3xl p-6 sm:p-8 animate-fade-up relative z-10 flex flex-col items-center text-center">
          
          {/* Header Close */}
          <div className="w-full flex items-center justify-between mb-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/5 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-colors cursor-pointer active:scale-95"
              aria-label="Close"
            >
              <Icon name="close" size={20} />
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-label text-[11px] font-bold border border-emerald-200">
              ✓ Published
            </span>
          </div>

          {/* Success Checkmark Graphic */}
          <div className="my-4 relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Icon name="check_circle" size={44} />
              </div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <h1 className="font-headline text-[26px] sm:text-[32px] font-bold text-deep-navy leading-tight tracking-tight mb-1">
            Committee Created!
          </h1>
          <p className="font-body text-[14px] text-on-surface-variant max-w-xs mb-6">
            <strong className="text-[#006972] font-bold">{committeeName}</strong> is now live on the Sanjhi network.
          </p>

          {/* Invite Code Box */}
          <div className="w-full bg-[#006972]/8 border border-[#006972]/20 rounded-2xl p-5 mb-6 flex flex-col items-center">
            <span className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
              Member Invite Code
            </span>
            <div className="font-headline text-[26px] sm:text-[30px] font-bold text-[#006972] tracking-widest my-1 select-all font-mono">
              {inviteCode}
            </div>
            
            <button
              onClick={handleCopyCode}
              className="mt-3 bg-[#006972] hover:bg-[#00575f] text-white font-label text-[13px] font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer border-none"
            >
              <Icon name={copiedCode ? 'check' : 'content_copy'} size={16} />
              {copiedCode ? 'Code Copied!' : 'Copy Code'}
            </button>
          </div>

          {/* Share Links */}
          <div className="w-full space-y-2 mb-6">
            <span className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Share Direct Join Link
            </span>
            
            <div className="flex justify-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 bg-white hover:bg-[#006972]/5 text-[#006972] font-label text-[13px] font-bold py-2.5 px-4 rounded-xl border border-[#006972]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Icon name={copiedLink ? 'check' : 'link'} size={16} />
                {copiedLink ? 'Link Copied!' : 'Copy Invite Link'}
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={(e) => {
              triggerRipple(e, 'go');
              navigate('/dashboard');
            }}
            className="relative overflow-hidden w-full bg-[#006972] hover:bg-[#00575f] text-white py-3.5 px-6 rounded-2xl font-label text-[15px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#006972]/25 hover:shadow-xl cursor-pointer border-none"
          >
            {ripples.go && (
              <span
                className="absolute rounded-full bg-white/30 w-32 h-32 -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none"
                style={{ left: ripples.go.x, top: ripples.go.y }}
              />
            )}
            Go to User Dashboard
            <Icon name="arrow_forward" size={18} />
          </button>
        </main>
      </div>
    </AuthAmbientBackground>
  );
}
