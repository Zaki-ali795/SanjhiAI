import { useNavigate } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import logo from '../../assets/screen.png';

export default function JoinRequestSent() {
  const navigate = useNavigate();

  return (
    <AuthAmbientBackground showTicker={true}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col items-center justify-center min-h-[calc(100vh-36px)]">
        
        {/* Main Glass Card with Bold Teal Header */}
        <main className="max-w-md w-full bg-white rounded-2xl sm:rounded-3xl border border-[#006972]/15 shadow-[0_24px_70px_-12px_rgba(0,105,114,0.22)] overflow-hidden animate-fade-up relative z-10 flex flex-col text-center">
          
          {/* Bold Teal Header with Logo */}
          <div className="w-full bg-[#006972] relative p-8 sm:p-10 flex flex-col items-center justify-center overflow-hidden">
            {/* Glowing background light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/20 rounded-full blur-3xl pointer-events-none" />
            
            <img
              alt="Sanjhi Logo"
              src={logo}
              className="w-28 sm:w-32 object-contain relative z-10 logo-3d-white drop-shadow-xl mb-4"
            />
            
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border-2 border-white/40 shadow-lg relative z-10 animate-pulse">
              <Icon name="hourglass_top" size={32} className="text-white" />
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 sm:p-10 flex flex-col items-center">
            <h1 className="font-headline text-[26px] sm:text-[28px] font-bold text-deep-navy mb-3">
              Request Sent
            </h1>

            <p className="font-body text-[14px] sm:text-[15px] text-on-surface-variant mb-10 max-w-[280px]">
              You’ll be notified once the Organizer approves your request.
            </p>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-[#006972] hover:bg-[#00575f] text-[#ffffff] font-label text-[15px] py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Back to Dashboard
              <Icon name="arrow_forward" size={20} />
            </button>
          </div>
          
        </main>
      </div>
    </AuthAmbientBackground>
  );
}
