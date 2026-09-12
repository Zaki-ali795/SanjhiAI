import TopAppBar from '../../components/TopAppBar';
import Icon from '../../components/Icon';
import Button from '../../components/Button';

export default function EmptyStates() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body antialiased">
<header className="w-full top-0 sticky bg-background border-b border-outline/10 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-sm z-50">
<div className="flex items-center gap-4">
<button className="text-primary hover:bg-surface-container-low transition-colors active:scale-95 duration-150 p-2 rounded-full hidden md:block">
<span className="material-symbols-outlined">menu</span>
</button>
<h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-secondary font-bold">Sanjhi</h1>
</div>
<div>
<button className="text-primary hover:bg-surface-container-low transition-colors active:scale-95 duration-150 p-2 rounded-full">
<span className="material-symbols-outlined">notifications</span>
</button>
</div>
</header>
<main className="flex-grow w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-xl flex flex-col gap-12 items-center justify-center">
<h2 className="font-headline-md text-headline-md text-center w-full mb-8">System Empty States</h2>
<div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">

<div className="bg-surface-container-lowest border border-secondary/15 rounded-xl p-8 flex flex-col items-center text-center gap-6 relative overflow-hidden group">
<div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-secondary/10 via-secondary/20 to-secondary/10 opacity-50"></div>
<div className="w-32 h-32 rounded-full bg-surface-container-low flex items-center justify-center mb-2 border border-outline-variant/30">
<span className="material-symbols-outlined text-6xl text-secondary opacity-50">group_work</span>
</div>
<div className="flex flex-col gap-3">
<h3 className="font-headline-md text-headline-md text-on-surface">No committees yet</h3>
<p className="font-body-md text-body-md text-on-surface-variant max-w-[280px]">Join or start a community circle to begin saving together.</p>
</div>
<button className="mt-4 px-6 py-3 bg-secondary text-on-secondary rounded-full font-label-sm text-label-sm hover:bg-secondary/90 transition-colors active:scale-95 shadow-sm">
                    Create Committee
                </button>
</div>

<div className="bg-surface-container-lowest border border-secondary/15 rounded-xl p-8 flex flex-col items-center text-center gap-6 relative overflow-hidden">
<div className="w-32 h-32 rounded-full bg-surface-container-low flex items-center justify-center mb-2 border border-outline-variant/30 relative">
<span className="material-symbols-outlined text-6xl text-secondary/40">notifications_off</span>
<div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-white">
<span className="material-symbols-outlined text-sm text-on-surface-variant">snooze</span>
</div>
</div>
<div className="flex flex-col gap-3">
<h3 className="font-headline-md text-headline-md text-on-surface">You're all caught up!</h3>
<p className="font-body-md text-body-md text-on-surface-variant max-w-[280px]">No new notifications at the moment.</p>
</div>
</div>

<div className="bg-surface-container-lowest border border-secondary/15 rounded-xl p-8 flex flex-col items-center text-center gap-6 relative overflow-hidden">
<div className="w-32 h-32 rounded-full bg-surface-container-low flex items-center justify-center mb-2 border border-outline-variant/30">
<span className="material-symbols-outlined text-6xl text-tertiary opacity-50">assignment_turned_in</span>
</div>
<div className="flex flex-col gap-3">
<h3 className="font-headline-md text-headline-md text-on-surface">No complaints filed</h3>
<p className="font-body-md text-body-md text-on-surface-variant max-w-[280px]">Everything looks clear in your community.</p>
</div>
</div>
</div>
</main>

<nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-xl bg-surface border-t border-outline/10 shadow-sm flex justify-around items-center h-16 px-2">
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-90 transition-transform p-2 rounded-lg" href="#">
<span className="material-symbols-outlined">grid_view</span>
<span className="font-label-sm text-label-sm text-[10px]">Dashboard</span>
</a>
<a className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 hover:bg-surface-container-high active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined">group_work</span>
<span className="font-label-sm text-label-sm text-[10px]">Pools</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-90 transition-transform p-2 rounded-lg" href="#">
<span className="material-symbols-outlined">diversity_3</span>
<span className="font-label-sm text-label-sm text-[10px]">Connect</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-90 transition-transform p-2 rounded-lg" href="#">
<span className="material-symbols-outlined">person</span>
<span className="font-label-sm text-label-sm text-[10px]">Profile</span>
</a>
</nav>
    </div>
  );
}
