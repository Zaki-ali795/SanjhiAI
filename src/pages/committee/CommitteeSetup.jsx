import TopAppBar from '../../components/TopAppBar';
import Icon from '../../components/Icon';
import Button from '../../components/Button';

export default function CommitteeSetup() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body antialiased">
<header className="w-full top-0 sticky bg-background dark:bg-background border-b border-outline/10 z-50">
<div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-sm w-full max-w-[1280px] mx-auto">
<button className="text-primary dark:text-on-primary-fixed hover:bg-surface-container-low transition-colors active:scale-95 duration-150 p-2 rounded-full">
<span className="material-symbols-outlined">menu</span>
</button>
<div className="font-display-lg-mobile text-display-lg-mobile text-secondary dark:text-secondary-fixed font-bold">
                Sanjhi
            </div>
<button className="text-primary dark:text-on-primary-fixed hover:bg-surface-container-low transition-colors active:scale-95 duration-150 p-2 rounded-full">
<span className="material-symbols-outlined">notifications</span>
</button>
</div>
</header>

<main className="flex-grow flex flex-col md:flex-row w-full max-w-[1280px] mx-auto pb-24 md:pb-8">

<nav className="hidden md:flex flex-col p-md gap-sm bg-surface border-r border-outline/10 h-[calc(100vh-64px)] w-80 sticky top-[64px]">
<div className="mb-lg">
<div className="flex items-center gap-4 mb-4">
<img alt="User profile photo" className="w-12 h-12 rounded-full object-cover border border-outline/20" src="/avatar.svg"/>
<div>
<h2 className="font-headline-md text-body-lg font-bold text-on-surface">Aarav Sharma</h2>
<p className="font-label-sm text-on-surface-variant">Trust Score: 850</p>
</div>
</div>
<p className="font-label-sm text-outline">Member since 2023</p>
</div>
<a className="flex items-center gap-3 p-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 ease-in-out" href="#">
<span className="material-symbols-outlined">grid_view</span>
<span className="font-body-md">Dashboard</span>
</a>
<a className="flex items-center gap-3 p-3 rounded-lg bg-secondary-container text-on-secondary-container font-bold transition-all duration-200 ease-in-out" href="#">
<span className="material-symbols-outlined">group_work</span>
<span className="font-body-md">Pools</span>
</a>
<a className="flex items-center gap-3 p-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 ease-in-out" href="#">
<span className="material-symbols-outlined">diversity_3</span>
<span className="font-body-md">Connect</span>
</a>
<div className="mt-auto flex flex-col gap-sm">
<a className="flex items-center gap-3 p-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 ease-in-out" href="#">
<span className="material-symbols-outlined">settings</span>
<span className="font-body-md">Settings</span>
</a>
<a className="flex items-center gap-3 p-3 rounded-lg text-error hover:bg-error-container transition-all duration-200 ease-in-out" href="#">
<span className="material-symbols-outlined">logout</span>
<span className="font-body-md">Logout</span>
</a>
</div>
</nav>

<div className="flex-grow p-margin-mobile md:p-margin-desktop">
<div className="max-w-2xl mx-auto w-full">
<div className="mb-lg">
<h1 className="font-headline-md text-headline-md text-on-surface mb-2">Committee Setup</h1>
<p className="font-body-md text-on-surface-variant">Define the parameters for your new shared savings pool.</p>
</div>

<div className="bg-surface-container-highest border border-outline/10 rounded-lg p-4 mb-lg flex items-start gap-4">
<span className="material-symbols-outlined text-outline mt-1">cloud_off</span>
<div>
<h3 className="font-body-md font-semibold text-on-surface">AI Assistant Offline</h3>
<p className="font-body-md text-on-surface-variant text-sm mt-1">AI Assistant is currently offline. Please use the manual form below to set up your committee.</p>
</div>
</div>

<form className="space-y-lg bg-surface border border-outline/10 rounded-xl p-md md:p-lg relative overflow-hidden">

<div className="absolute top-0 left-0 right-0 h-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImpzbGkiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMTBoMjBMMTAgMGwtMTAgMTB6IiBmaWxsPSIjMDA2OTcyIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNqc2xpKSIvPjwvc3ZnPg==')] opacity-30"></div>
<div>
<label className="block font-label-sm text-label-sm text-on-surface mb-2" htmlFor="committee-name">Committee Name</label>
<input className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-shadow text-body-md" name="committee-name" placeholder="e.g., Diwali Fund 2024" type="text"/>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
<div>
<label className="block font-label-sm text-label-sm text-on-surface mb-2" htmlFor="contribution-amount">Monthly Contribution (₹)</label>
<input className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-shadow text-body-md" name="contribution-amount" placeholder="5000" type="number"/>
</div>
<div>
<label className="block font-label-sm text-label-sm text-on-surface mb-2" htmlFor="duration">Duration (Months)</label>
<select className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-shadow text-body-md appearance-none" name="duration">
<option value="6">6 Months</option>
<option selected="" value="12">12 Months</option>
<option value="24">24 Months</option>
</select>
</div>
</div>
<div>
<label className="block font-label-sm text-label-sm text-on-surface mb-2" htmlFor="start-date">Start Date</label>
<input className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-shadow text-body-md" name="start-date" type="date"/>
</div>
<div>
<label className="block font-label-sm text-label-sm text-on-surface mb-2">Rules & Guidelines</label>
<textarea className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-shadow text-body-md resize-none" placeholder="Enter any specific rules for this committee..." rows="4"></textarea>
</div>
<div className="pt-4 flex justify-end gap-4">
<button className="px-6 py-3 rounded-lg font-label-sm text-label-sm text-secondary hover:bg-surface-container-low transition-colors" type="button">
                            Cancel
                        </button>
<button className="px-6 py-3 bg-secondary text-on-secondary rounded-lg font-label-sm text-label-sm hover:bg-on-secondary-fixed-variant transition-colors shadow-sm" type="submit">
                            Create Committee
                        </button>
</div>
</form>
</div>
</div>
</main>

<nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-xl bg-surface dark:bg-surface-dim border-t border-outline/10 shadow-sm flex justify-around items-center h-16 px-2">
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-90 transition-transform p-2 rounded-lg" href="#">
<span className="material-symbols-outlined">grid_view</span>
<span className="font-label-sm text-label-sm mt-1 text-[10px]">Dashboard</span>
</a>
<a className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 hover:bg-surface-container-high active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined icon-filled">group_work</span>
<span className="font-label-sm text-label-sm mt-1 text-[10px]">Pools</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-90 transition-transform p-2 rounded-lg" href="#">
<span className="material-symbols-outlined">diversity_3</span>
<span className="font-label-sm text-label-sm mt-1 text-[10px]">Connect</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-90 transition-transform p-2 rounded-lg" href="#">
<span className="material-symbols-outlined">person</span>
<span className="font-label-sm text-label-sm mt-1 text-[10px]">Profile</span>
</a>
</nav>
    </div>
  );
}
