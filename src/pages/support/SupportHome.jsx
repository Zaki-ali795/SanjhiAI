import { useNavigate } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import { useNavDrawer } from '../../context/NavDrawerContext';

export default function SupportHome() {
  const navigate = useNavigate();
  const { openDrawer } = useNavDrawer();

  return (
    <AuthAmbientBackground showTicker={true}>
      <div className="w-full max-w-lg mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col items-center min-h-[calc(100vh-36px)] pb-28 md:pb-12">

        {/* Main Glass Card */}
        <main className="w-full bg-white/85 backdrop-blur-2xl border border-[#006972]/20 shadow-[0_24px_70px_-15px_rgba(0,105,114,0.22),0_0_0_1px_rgba(0,105,114,0.1)] rounded-2xl sm:rounded-3xl p-5 sm:p-8 animate-fade-up relative z-10">

          {/* Header */}
          <header className="w-full flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/5 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-colors cursor-pointer active:scale-95"
                aria-label="Back to Dashboard"
              >
                <Icon name="arrow_back" size={20} />
              </button>
              <div>
                <h1 className="font-headline text-[20px] sm:text-[22px] font-bold text-deep-navy">Support Center</h1>
                <p className="font-body text-[12px] text-on-surface-variant">How can we help you today?</p>
              </div>
            </div>

            <button
              onClick={openDrawer}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-colors active:scale-95 cursor-pointer"
              aria-label="Open Menu"
            >
              <Icon name="menu" size={20} />
            </button>
          </header>

          {/* Action Cards */}
          <div className="space-y-3">
            {/* File a Complaint — Primary */}
            <button
              onClick={() => navigate('/support/file-complaint')}
              className="w-full bg-white border border-[#006972]/15 rounded-2xl p-5 text-left hover:border-[#006972]/40 hover:shadow-[0_8px_24px_rgba(0,105,114,0.1)] transition-all cursor-pointer active:scale-[0.98] group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center border border-[#006972]/20 shadow-sm group-hover:bg-[#006972] group-hover:text-white transition-all">
                    <Icon name="report_problem" size={22} />
                  </div>
                  <div>
                    <h3 className="font-headline text-[15px] font-bold text-deep-navy">File a Complaint</h3>
                    <p className="font-body text-[12px] text-on-surface-variant mt-0.5">Report payment disputes, fraud, or issues. AI investigates automatically.</p>
                  </div>
                </div>
                <Icon name="arrow_forward" size={18} className="text-on-surface-variant/40 group-hover:text-[#006972] transition-colors shrink-0" />
              </div>
            </button>

            {/* Report a User */}
            <button
              onClick={() => navigate('/support/file-complaint?mode=user_report')}
              className="w-full bg-white border border-[#006972]/15 rounded-2xl p-5 text-left hover:border-rose-400/60 hover:shadow-[0_8px_24px_rgba(220,38,38,0.08)] transition-all cursor-pointer active:scale-[0.98] group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/60 shadow-sm group-hover:bg-rose-600 group-hover:text-white transition-all">
                    <Icon name="flag" size={22} />
                  </div>
                  <div>
                    <h3 className="font-headline text-[15px] font-bold text-deep-navy">Report a User</h3>
                    <p className="font-body text-[12px] text-on-surface-variant mt-0.5">Report fraud, harassment, or suspicious behaviour. Admin will review.</p>
                  </div>
                </div>
                <Icon name="arrow_forward" size={18} className="text-on-surface-variant/40 group-hover:text-rose-600 transition-colors shrink-0" />
              </div>
            </button>

            {/* My Complaints */}
            <button
              onClick={() => navigate('/support/complaints')}
              className="w-full bg-white border border-[#006972]/15 rounded-2xl p-5 text-left hover:border-[#006972]/40 hover:shadow-[0_8px_24px_rgba(0,105,114,0.1)] transition-all cursor-pointer active:scale-[0.98] group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60 shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-all">
                    <Icon name="history" size={22} />
                  </div>
                  <div>
                    <h3 className="font-headline text-[15px] font-bold text-deep-navy">My Complaints</h3>
                    <p className="font-body text-[12px] text-on-surface-variant mt-0.5">Track the status of your filed complaints and AI case results.</p>
                  </div>
                </div>
                <Icon name="arrow_forward" size={18} className="text-on-surface-variant/40 group-hover:text-amber-600 transition-colors shrink-0" />
              </div>
            </button>

            {/* Chat with AI Assistant */}
            <button
              onClick={() => navigate('/assistant')}
              className="w-full bg-white border border-[#006972]/15 rounded-2xl p-5 text-left hover:border-[#006972]/40 hover:shadow-[0_8px_24px_rgba(0,105,114,0.1)] transition-all cursor-pointer active:scale-[0.98] group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center border border-violet-200/60 shadow-sm group-hover:bg-violet-500 group-hover:text-white transition-all">
                    <Icon name="smart_toy" size={22} />
                  </div>
                  <div>
                    <h3 className="font-headline text-[15px] font-bold text-deep-navy">AI Assistant</h3>
                    <p className="font-body text-[12px] text-on-surface-variant mt-0.5">Get instant answers about committees, payments, and platform features.</p>
                  </div>
                </div>
                <Icon name="arrow_forward" size={18} className="text-on-surface-variant/40 group-hover:text-violet-600 transition-colors shrink-0" />
              </div>
            </button>
          </div>

          {/* FAQ Section */}
          <section className="mt-8 pt-6 border-t border-[#006972]/10">
            <h2 className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Frequently Asked</h2>
            <div className="space-y-2">
              {[
                'How does the Trust Score work?',
                'What happens if a member defaults on payment?',
                'How are AI investigations triggered?',
                'Can I withdraw from a committee mid-cycle?',
              ].map((question, idx) => (
                <button key={idx}
                  onClick={() => navigate('/assistant', { state: { prompt: question } })}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#006972]/3 hover:bg-[#006972]/8 border border-[#006972]/8 transition-colors cursor-pointer group text-left"
                >
                  <span className="font-body text-[13px] text-deep-navy group-hover:text-[#006972] transition-colors">{question}</span>
                  <Icon name="chevron_right" size={16} className="text-on-surface-variant/40 group-hover:text-[#006972] transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>

    </AuthAmbientBackground>
  );
}
