import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PageTransition from './components/PageTransition';
import BottomNav from './components/BottomNav';
import { NavDrawerProvider } from './context/NavDrawerContext';
import MobileSideDrawer from './components/MobileSideDrawer';
import logo from './assets/screen.png';

// Auth pages
import Welcome from './pages/auth/Welcome';
import SignUp from './pages/auth/SignUp';
import SignUpForm from './pages/auth/SignUpForm';
import LoginForm from './pages/auth/LoginForm';
import OTPVerification from './pages/auth/OTPVerification';
const ProfileSetup = lazy(() => import('./pages/auth/ProfileSetup'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

// Committee pages
const CreateCommittee = lazy(() => import('./pages/committee/CreateCommittee'));
const SetSchedule = lazy(() => import('./pages/committee/SetSchedule'));
const LinkAccount = lazy(() => import('./pages/committee/LinkAccount'));
const ReviewConfirm = lazy(() => import('./pages/committee/ReviewConfirm'));
const CommitteeCreated = lazy(() => import('./pages/committee/CommitteeCreated'));
const CommitteeDetail = lazy(() => import('./pages/committee/CommitteeDetail'));
const CommitteeSettings = lazy(() => import('./pages/committee/CommitteeSettings'));
const CommitteeProgress = lazy(() => import('./pages/committee/CommitteeProgress'));
const JoinCommittee = lazy(() => import('./pages/committee/JoinCommittee'));
const JoinByCode = lazy(() => import('./pages/committee/JoinByCode'));
const JoinRequestSent = lazy(() => import('./pages/committee/JoinRequestSent'));
const MyPools = lazy(() => import('./pages/committee/MyPools'));
const PublicCommittees = lazy(() => import('./pages/committee/PublicCommittees'));

// Dashboard pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Assistant = lazy(() => import('./pages/dashboard/Assistant'));
const Notifications = lazy(() => import('./pages/dashboard/Notifications'));

// Members pages
const InviteMembers = lazy(() => import('./pages/members/InviteMembers'));
const JoinRequests = lazy(() => import('./pages/members/JoinRequests'));

// Payments pages
const ReleasePayout = lazy(() => import('./pages/payments/ReleasePayout'));
const MyPayments = lazy(() => import('./pages/payments/MyPayments'));
const PayNow = lazy(() => import('./pages/payments/PayNow'));

// Support pages
const SupportHome = lazy(() => import('./pages/support/SupportHome'));
const FileComplaint = lazy(() => import('./pages/support/FileComplaint'));
const MyComplaints = lazy(() => import('./pages/support/MyComplaints'));
const ComplaintDetail = lazy(() => import('./pages/support/ComplaintDetail'));

// Profile
const Profile = lazy(() => import('./pages/profile/Profile'));

// Admin pages
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCommittees = lazy(() => import('./pages/admin/AdminCommittees'));
const AdminCommitteeDetail = lazy(() => import('./pages/admin/AdminCommitteeDetail'));
const AdminDisputes = lazy(() => import('./pages/admin/AdminDisputes'));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminCnicVerification = lazy(() => import('./pages/admin/AdminCnicVerification'));
const ActivityLog = lazy(() => import('./pages/admin/ActivityLog'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

// Misc pages
const Offline = lazy(() => import('./pages/misc/Offline'));
const Loading = lazy(() => import('./pages/misc/Loading'));
const EmptyStates = lazy(() => import('./pages/misc/EmptyStates'));

/* ── Ultra-sleek, Lightweight Page Loader ── */
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#FBFAEE] relative flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      {/* Ambient Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #006972 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="hidden sm:block absolute w-[400px] h-[400px] rounded-full bg-[#006972]/8 blur-3xl top-[-80px] left-[-80px]" />
        <div className="hidden sm:block absolute w-[360px] h-[360px] rounded-full bg-[#d4af37]/8 blur-3xl bottom-[-60px] right-[-60px]" />
      </div>

      {/* Central Stable Card */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center p-7 sm:p-9 rounded-3xl bg-white border border-[#006972]/15 shadow-[0_16px_40px_-12px_rgba(0,105,114,0.12)] w-[360px] max-w-[92vw] min-h-[440px] transform-gpu">
        {/* Logo Container with Smooth Pulse */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mb-5 shrink-0">
          <div className="absolute -inset-1.5 rounded-[1.75rem] border-2 border-[#006972]/20 animate-glow-pulse" />
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white p-2.5 shadow-md border border-[#006972]/15 flex items-center justify-center">
            <img src={logo} alt="Sanjhi Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Brand Text */}
        <div className="flex flex-col items-center gap-1.5 mb-6">
          <h2 className="font-headline text-[26px] font-extrabold text-[#006972] tracking-tight leading-tight">
            Sanjhi
          </h2>
          <p className="font-urdu text-[24px] text-deep-navy font-bold leading-normal">
            سانجھی
          </p>
          <span className="font-label text-[11px] uppercase tracking-[0.14em] font-bold text-[#006972]/80 mt-0.5">
            Community Savings · Trusted Pools
          </span>
        </div>

        {/* Progress Section with Ultra-Smooth Indeterminate Beam */}
        <div className="w-full flex flex-col items-center gap-3">
          <div className="w-full max-w-[220px] h-1.5 rounded-full bg-[#006972]/12 overflow-hidden relative">
            <div
              className="h-full w-full rounded-full bg-gradient-to-r from-[#006972] via-emerald-400 to-[#d4af37] animate-smooth-beam"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#006972]/7 border border-[#006972]/14 font-label text-[11px] font-semibold text-[#006972]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Loading experience...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Root Auth Redirector: checks session token on root path ── */
function RootRouteHandler() {
  const token = localStorage.getItem('sanjhi_token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Welcome />;
}

/* ── Global Viewport Bottom Navigation Handler ── */
function GlobalBottomNav() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const isAuthPage =
    path === '/' ||
    path === '/welcome' ||
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path.startsWith('/otp') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password') ||
    path.startsWith('/profile-setup');

  if (isAuthPage) return null;

  return <BottomNav />;
}

export default function App() {
  return (
    <NavDrawerProvider>
      <MobileSideDrawer />
      <Suspense fallback={<PageLoader />}>
        <PageTransition>
          <Routes>
            {/* Auth Flow */}
            <Route path="/" element={<RootRouteHandler />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signup/:method" element={<SignUpForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/otp" element={<OTPVerification />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />

            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Committee Creation Flow */}
            <Route path="/committee/create" element={<CreateCommittee />} />
            <Route path="/committee/schedule" element={<SetSchedule />} />
            <Route path="/committee/link-account" element={<LinkAccount />} />
            <Route path="/committee/review" element={<ReviewConfirm />} />
            <Route path="/committee/created" element={<CommitteeCreated />} />

            {/* Committee Detail & Pools Hub */}
            <Route path="/pools" element={<MyPools />} />
            <Route path="/committees" element={<MyPools />} />
            <Route path="/committee/:id" element={<CommitteeDetail />} />
            <Route path="/committee/:id/settings" element={<CommitteeSettings />} />
            <Route path="/committee/:id/progress" element={<CommitteeProgress />} />

            {/* Join Committee */}
            <Route path="/join" element={<JoinByCode />} />
            <Route path="/join/:code" element={<JoinCommittee />} />
            <Route path="/join-request-sent" element={<JoinRequestSent />} />

            {/* Public Marketplace */}
            <Route path="/committees/public" element={<PublicCommittees />} />
            <Route path="/public-committees" element={<PublicCommittees />} />

            {/* Members */}
            <Route path="/committee/:id/invite" element={<InviteMembers />} />
            <Route path="/committee/:id/requests" element={<JoinRequests />} />

            {/* Payments */}
            <Route path="/payments" element={<MyPayments />} />
            <Route path="/payments/pay/:committeeId" element={<PayNow />} />
            <Route path="/payments/pay/:committeeId/:cycleId" element={<PayNow />} />
            <Route path="/payments/pay" element={<PayNow />} />
            <Route path="/payments/release" element={<ReleasePayout />} />
            <Route path="/payments/release/:committeeId/:cycleId" element={<ReleasePayout />} />

            {/* Support */}
            <Route path="/support" element={<SupportHome />} />
            <Route path="/support/complaints" element={<MyComplaints />} />
            <Route path="/support/complaints/:id" element={<ComplaintDetail />} />
            <Route path="/support/file-complaint" element={<FileComplaint />} />

            {/* Profile */}
            <Route path="/profile" element={<Profile />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/committees" element={<AdminCommittees />} />
            <Route path="/admin/committees/:id" element={<AdminCommitteeDetail />} />
            <Route path="/admin/disputes" element={<AdminDisputes />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/cnic-verification" element={<AdminCnicVerification />} />
            <Route path="/admin/activity" element={<ActivityLog />} />
            <Route path="/admin/settings" element={<AdminSettings />} />

            {/* Misc */}
            <Route path="/offline" element={<Offline />} />
            <Route path="/loading" element={<Loading />} />
            <Route path="/empty" element={<EmptyStates />} />
          </Routes>
        </PageTransition>
      </Suspense>
      <GlobalBottomNav />
    </NavDrawerProvider>
  );
}
