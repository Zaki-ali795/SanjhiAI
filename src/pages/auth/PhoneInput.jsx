import { useNavigate } from 'react-router-dom';
import TopAppBar from '../../components/TopAppBar';
import Icon from '../../components/Icon';

export default function PhoneInput() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center jali-dots">
      <main className="w-full max-w-[480px] min-h-screen md:min-h-[800px] md:h-auto md:rounded-[32px] md:shadow-2xl md:my-8 bg-background relative flex flex-col md:border md:border-outline-variant/20 overflow-hidden">
        <TopAppBar showBack />
        <div className="flex-1 px-4 pt-8 pb-32 flex flex-col">
          <div className="mb-8">
            <h1 className="font-headline text-[32px] leading-[40px] font-bold text-deep-navy mb-2">
              Enter your phone number
            </h1>
            <p className="font-body text-[16px] text-on-surface-variant">
              We'll send you a 6-digit code
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="relative w-1/3 max-w-[100px]">
                <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded-xl px-4 py-4 pr-8 focus:ring-2 focus:ring-teal-emerald focus:border-teal-emerald transition-all font-body text-[16px] shadow-sm">
                  <option value="+92">+92</option>
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
                <Icon name="expand_more" className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" size={20} />
              </div>
              <input
                type="tel"
                value=""
                placeholder="3XX XXX XXXX"
                className="flex-1 bg-surface-container-lowest border border-outline-variant/30 text-on-surface placeholder:text-outline-variant rounded-xl px-4 py-4 focus:ring-2 focus:ring-teal-emerald focus:border-teal-emerald transition-all font-body text-[18px] shadow-sm"
              />
            </div>
            <button onClick={() => navigate('/signup/email')} className="text-teal-emerald font-label text-[14px] font-semibold text-left self-start mt-2 hover:opacity-80 transition-opacity flex items-center gap-1">
              Use email instead
            </button>
          </div>
        </div>
        <div className="fixed bottom-0 w-full max-w-[480px] px-4 py-6 bg-gradient-to-t from-background via-background to-transparent md:absolute">
          <button
            onClick={() => navigate('/otp')}
            className="w-full font-label text-[14px] font-semibold py-4 rounded-xl flex items-center justify-center transition-all bg-teal-emerald text-white shadow-md active:scale-95"
          >
            Continue
          </button>
        </div>
      </main>
    </div>
  );
}
