import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';

export default function InviteMembers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  function handleCopy(text) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AuthAmbientBackground showTicker={false}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col min-h-[calc(100vh-36px)] gap-5">

        {/* Header */}
        <header className="w-full flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/60 hover:bg-white/80 text-[#006972] transition-colors cursor-pointer active:scale-95 backdrop-blur-md border border-[#006972]/15 shadow-sm"
          >
            <Icon name="arrow_back" size={20} />
          </button>
          <h1 className="font-headline text-[22px] sm:text-[24px] font-bold text-deep-navy tracking-tight">
            Invite Members
          </h1>
          <div className="w-10" />
        </header>

        {/* Invite Code Card */}
        <section className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#006972]/15 shadow-md p-6 flex flex-col gap-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#006972] rounded-t-2xl" />

          {/* Code Display */}
          <div className="flex flex-col items-center py-2 text-center">
            <span className="font-label text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Invite Code</span>
            <div className="flex items-center gap-3">
              <span className="font-headline text-[36px] sm:text-[42px] font-bold text-[#006972] tracking-tight">SANJHI-782K</span>
              <button
                onClick={() => handleCopy('SANJHI-782K')}
                aria-label="Copy code"
                className="w-10 h-10 rounded-full bg-[#006972]/10 hover:bg-[#006972]/20 text-[#006972] flex items-center justify-center transition-all active:scale-90"
              >
                <Icon name={copied ? 'check' : 'content_copy'} size={20} />
              </button>
            </div>
            <button className="mt-3 font-label text-[13px] text-[#006972] underline-offset-2 underline hover:no-underline transition-all">
              Regenerate Invite
            </button>
          </div>

          <div className="h-px w-full bg-[#006972]/10" />

          {/* Invite Link Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="font-label text-[11px] text-on-surface-variant block mb-1">Invite Link</span>
              <span className="font-body text-[14px] text-deep-navy break-all">sanjhi.app/join/782k</span>
            </div>
            <button
              onClick={() => handleCopy('https://sanjhi.app/join/782k')}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006972] text-white font-label text-[13px] font-semibold hover:bg-[#00575f] transition-all shadow-md active:scale-95"
            >
              <Icon name="share" size={18} />
              Share Link
            </button>
          </div>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-[#006972]/15" />
          <span className="font-label text-[11px] text-on-surface-variant uppercase tracking-widest">or add directly</span>
          <div className="h-px flex-1 bg-[#006972]/15" />
        </div>

        {/* Search Section */}
        <section className="flex flex-col gap-4">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon name="search" size={20} className="text-[#006972]" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Add by User ID or phone"
              className="block w-full pl-11 pr-4 py-3.5 border border-[#c4c6cc] rounded-xl bg-[#f5f4e8] focus:border-[#006972] outline-none transition-colors text-deep-navy font-body text-[15px] placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Search Result */}
          <div className="bg-white/90 backdrop-blur-md border border-[#006972]/15 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <img alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-[#006972]/15" src="/avatar.svg" />
              <div>
                <span className="font-headline text-[15px] font-bold text-deep-navy block">Zaid Ahmed</span>
                <span className="font-label text-[12px] text-on-surface-variant">@zaid_99</span>
              </div>
            </div>
            <button className="px-4 py-2 rounded-xl bg-[#006972]/10 hover:bg-[#006972] hover:text-white text-[#006972] font-label text-[13px] font-semibold transition-all active:scale-95">
              Add
            </button>
          </div>
        </section>

        {/* Pool Capacity Progress */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#006972]/15 shadow-sm p-4 flex items-center gap-4 mt-auto">
          <div className="w-10 h-10 rounded-full bg-[#006972]/10 flex items-center justify-center text-[#006972] flex-shrink-0">
            <Icon name="group" size={22} />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between items-center w-full">
              <span className="font-label text-[13px] text-deep-navy font-semibold">Pool Capacity</span>
              <span className="font-label text-[13px] text-[#006972] font-bold">3 of 10</span>
            </div>
            <div className="w-full h-2 bg-[#006972]/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#006972] rounded-full w-[30%] transition-all duration-500" />
            </div>
          </div>
        </div>

      </div>
    </AuthAmbientBackground>
  );
}
