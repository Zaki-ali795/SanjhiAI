import TopAppBar from '../components/TopAppBar';

export default function AuthLayout({ children, showBack = true, title = '', jaliBg = false }) {
  return (
    <div className={`min-h-screen flex flex-col ${jaliBg ? 'jali-pattern' : ''} bg-surface-warm`}>
      <TopAppBar showBack={showBack} title={title} transparent={!title} />
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-16 py-8">
        {children}
      </main>
    </div>
  );
}
