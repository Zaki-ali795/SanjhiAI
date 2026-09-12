import TopAppBar from '../../components/TopAppBar';
import Icon from '../../components/Icon';
import Button from '../../components/Button';

export default function Offline() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body antialiased">
<main className="flex-grow flex items-center justify-center p-margin-mobile md:p-margin-desktop relative overflow-hidden">

<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
<div className="w-full max-w-md bg-surface-container-lowest rounded-xl border border-secondary/10 p-xl flex flex-col items-center text-center relative z-10">
<div className="w-24 h-24 rounded-full bg-secondary-container flex items-center justify-center mb-lg">
<span className="material-symbols-outlined text-on-secondary-container">
                    wifi_off
                </span>
</div>
<h1 className="font-headline-md text-headline-md text-primary mb-sm">
                Connection Lost
            </h1>
<p className="font-body-md text-body-md text-on-surface-variant mb-xl">
                We're having trouble connecting to the Sanjhi network. Please check your internet and try again.
            </p>
<button className="bg-secondary text-on-secondary font-label-sm text-label-sm px-lg py-sm rounded-full w-full max-w-xs hover:bg-on-secondary-fixed-variant active:scale-95 transition-all duration-150 flex items-center justify-center gap-2">
<span className="material-symbols-outlined">refresh</span>
                Retry Connection
            </button>
</div>
</main>
    </div>
  );
}
