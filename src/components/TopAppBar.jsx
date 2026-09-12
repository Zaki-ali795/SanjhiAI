import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useNavDrawer } from '../context/NavDrawerContext';

export default function TopAppBar({
  title = '',
  showBack = false,
  showMenu = true,
  onBack,
  rightAction,
  transparent = false,
}) {
  const navigate = useNavigate();
  const { openDrawer } = useNavDrawer();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header
      className={`w-full sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 md:px-12 h-16 sm:h-18 transition-all ${
        transparent
          ? 'bg-transparent'
          : 'bg-white/92 backdrop-blur-xl border-b border-[#006972]/10 shadow-[0_4px_20px_-4px_rgba(0,105,114,0.06)]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {showBack && (
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-colors active:scale-95 cursor-pointer shrink-0"
            aria-label="Go back"
          >
            <Icon name="arrow_back" size={20} />
          </button>
        )}
        {title && (
          <h1 className="font-headline text-[18px] sm:text-[22px] leading-tight font-bold text-deep-navy truncate">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {rightAction ? (
          <div>{rightAction}</div>
        ) : showMenu ? (
          <button
            onClick={openDrawer}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/8 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-colors active:scale-95 cursor-pointer shrink-0"
            aria-label="Open Navigation Menu"
            title="Open Menu"
          >
            <Icon name="menu" size={22} />
          </button>
        ) : showBack ? (
          <div className="w-10" />
        ) : null}
      </div>
    </header>
  );
}
