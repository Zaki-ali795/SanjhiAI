import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import logo from '../../assets/screen.png';
import { setupProfile } from '../../services/authService';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
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

  const handleFinish = async (e) => {
    e?.preventDefault();
    if (e) triggerRipple(e, 'finish');

    if (!displayName.trim()) {
      setErrorMsg('Display name is required');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await setupProfile({ full_name: displayName.trim() });
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
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
              Final Step
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
              Set up your profile
            </h1>
            <p className="font-body text-[14px] text-on-surface-variant max-w-xs">
              Let your savings pool members recognize you
            </p>
          </div>

          {/* Profile Avatar Upload Mock */}
          <div className="flex flex-col items-center my-4 relative group">
            <div className="relative cursor-pointer">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#006972]/10 border-2 border-[#006972]/30 flex items-center justify-center overflow-hidden shadow-inner transition-transform duration-300 group-hover:scale-105">
                <Icon name="person" size={56} className="text-[#006972]" />
              </div>
              <div className="absolute bottom-0 right-0 w-9 h-9 bg-[#006972] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform">
                <Icon name="photo_camera" size={18} />
              </div>
            </div>
            <span className="font-label text-[12px] font-bold text-[#006972] mt-2 cursor-pointer hover:underline">
              Add Profile Photo
            </span>
          </div>

          {errorMsg && (
            <div className="w-full mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-[13px] font-body text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleFinish} className="w-full space-y-4 mt-2">
            <div className="space-y-1 text-left">
              <label className="block font-label text-[13px] font-bold text-deep-navy" htmlFor="displayName">
                Display Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#006972]/10 flex items-center justify-center text-[#006972] group-focus-within:bg-[#006972] group-focus-within:text-white transition-all">
                  <Icon name="badge" size={18} />
                </div>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Anika S."
                  className="w-full h-12 pl-13 pr-4 bg-white border border-[#006972]/20 rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10 transition-all font-body text-[14px] text-deep-navy outline-none shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className="relative overflow-hidden w-full bg-[#006972] hover:bg-[#00575f] text-white py-3.5 px-6 rounded-2xl font-label text-[15px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] duration-200 shadow-lg shadow-[#006972]/25 hover:shadow-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-none mt-4"
            >
              {ripples.finish && (
                <span
                  className="absolute rounded-full bg-white/30 w-32 h-32 -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none"
                  style={{ left: ripples.finish.x, top: ripples.finish.y }}
                />
              )}
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  Complete Setup
                  <Icon name="arrow_forward" size={18} />
                </>
              )}
            </button>
          </form>
        </main>
      </div>
    </AuthAmbientBackground>
  );
}
