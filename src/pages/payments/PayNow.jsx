import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import { getCommitteeById } from '../../services/committeeService';
import { submitPayment } from '../../services/paymentService';
import { getWallet, openWalletApp, copyText, detectPlatform, WALLETS } from '../../utils/wallets';

const GLASS_CARD = 'bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,105,114,0.12)]';

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/* ── Skeleton Bone Helper ── */
function Bone({ className = '' }) {
  return <span className={`skeleton-bone inline-block ${className}`} />;
}

export default function PayNow() {
  const navigate = useNavigate();
  const { committeeId, cycleId } = useParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [committee, setCommittee] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState(cycleId || '');
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState(null);

  const [senderAccount, setSenderAccount] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState('');
  const [walletHint, setWalletHint] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showFutureCyclesDrawer, setShowFutureCyclesDrawer] = useState(false);

  const wallet = getWallet(committee?.account_type);
  const platform = detectPlatform();

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCommittee() {
      try {
        setLoading(true);
        setLoadError('');
        const data = await getCommitteeById(committeeId);
        if (cancelled) return;

        const c = data?.committee || {};
        setCommittee(c);
        setAmount(parseFloat(c.contribution_amount) || 0);

        const loadedCycles = data?.cycles || [];
        setCycles(loadedCycles);

        let target = null;
        if (cycleId) {
          target = loadedCycles.find((cy) => String(cy.id) === String(cycleId));
        }
        if (!target) {
          target = loadedCycles.find((cy) => cy.status === 'collecting') || loadedCycles[0] || null;
        }

        if (target) {
          setSelectedCycleId(target.id);
          setDueDate(formatDate(target.due_date));
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Failed to load payment details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (committeeId) {
      loadCommittee();
    } else {
      setLoadError('No committee selected for this payment.');
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [committeeId, cycleId]);

  /* Currently selected cycle object */
  const activeCycle = cycles.find((cy) => String(cy.id) === String(selectedCycleId)) || cycles[0];

  function handleSelectCycle(cId) {
    setSelectedCycleId(cId);
    const target = cycles.find((cy) => String(cy.id) === String(cId));
    if (target) {
      setDueDate(formatDate(target.due_date));
    }
  }

  async function handleCopy(text, key, label) {
    const ok = await copyText(text);
    if (ok) {
      setCopied(key);
      setTimeout(() => setCopied(''), 1800);
    } else {
      showToast(`Copy failed — ${label}: ${text}`);
    }
  }

  async function handleOpenWallet(walletKey) {
    const targetWallet = walletKey ? WALLETS[walletKey] : wallet;
    if (!targetWallet) return;

    // Auto-copy account number for user convenience
    if (committee?.account_number) {
      await copyText(committee.account_number);
      setCopied('number');
      setTimeout(() => setCopied(''), 2000);
      showToast(`Copied ${committee.account_number} — opening ${targetWallet.label}...`);
    }

    const result = openWalletApp(targetWallet);
    if (result === 'unavailable') {
      setWalletHint(
        platform === 'desktop'
          ? `Opening ${targetWallet.label} in new tab. You can also scan/transfer using your phone.`
          : `${targetWallet.label} not detected. Install it from the Play Store / App Store, then return here.`
      );
    } else {
      setWalletHint(`Opening ${targetWallet.label}. Account number has been copied to your clipboard!`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || !activeCycle) return;
    setSubmitting(true);
    try {
      await submitPayment(committeeId, activeCycle.id, {
        sender_account_details: senderAccount,
        transaction_id: txnRef,
      });
      setSubmitted(true);
      showToast('Payment submitted for verification!');
    } catch (err) {
      showToast(err.message || 'Failed to submit payment.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Skeleton Loading Screen ── */
  if (loading) {
    return (
      <AuthAmbientBackground showTicker={false}>
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col min-h-[calc(100vh-36px)] gap-5">
          <header className="w-full flex items-center justify-between">
            <Bone className="w-11 h-11 rounded-full shrink-0" />
            <Bone className="w-44 h-6 rounded-xl" />
            <div className="w-11" />
          </header>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <Bone className="w-28 h-9 rounded-full shrink-0" />
            <Bone className="w-28 h-9 rounded-full shrink-0" />
            <Bone className="w-28 h-9 rounded-full shrink-0" />
          </div>

          <div className="bg-white/60 rounded-3xl p-6 text-center space-y-4 border border-white/70 shadow-sm">
            <Bone className="w-48 h-3 rounded-full mx-auto" />
            <Bone className="w-56 h-12 rounded-2xl mx-auto" />
            <Bone className="w-36 h-6 rounded-full mx-auto" />
          </div>

          <div className={`${GLASS_CARD} rounded-3xl p-5 space-y-4`}>
            <Bone className="w-32 h-3 rounded-full" />
            <div className="flex justify-between items-center gap-3">
              <div className="space-y-2 flex-1"><Bone className="w-24 h-3 rounded-lg" /><Bone className="w-40 h-5 rounded-xl" /></div>
              <Bone className="w-10 h-10 rounded-2xl shrink-0" />
            </div>
            <div className="p-3 rounded-2xl bg-white/40 flex items-center justify-between gap-3 border border-white/60">
              <div className="flex gap-3 items-center flex-1">
                <Bone className="w-11 h-11 rounded-2xl shrink-0" />
                <div className="space-y-1.5 flex-1"><Bone className="w-28 h-3 rounded-lg" /><Bone className="w-44 h-4 rounded-xl" /></div>
              </div>
              <Bone className="w-10 h-10 rounded-2xl shrink-0" />
            </div>
          </div>

          <Bone className="w-full h-14 rounded-2xl" />

          <div className={`${GLASS_CARD} rounded-3xl p-5 space-y-4`}>
            <div className="space-y-2"><Bone className="w-44 h-3 rounded-lg" /><Bone className="w-full h-12 rounded-2xl" /></div>
            <div className="space-y-2"><Bone className="w-36 h-3 rounded-lg" /><Bone className="w-full h-12 rounded-2xl" /></div>
          </div>
        </div>
      </AuthAmbientBackground>
    );
  }

  if (loadError) {
    return (
      <AuthAmbientBackground showTicker={false}>
        <div className="w-full max-w-2xl mx-auto px-6 py-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-50/90 text-rose-600 flex items-center justify-center border border-rose-200/80 shadow-sm">
            <Icon name="error" size={30} />
          </div>
          <h1 className="font-headline text-[22px] font-bold text-deep-navy">Couldn't load payment</h1>
          <p className="font-body text-[13px] text-on-surface-variant max-w-xs">{loadError}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-2xl bg-[#006972] hover:bg-[#00575f] text-white font-label text-[13px] font-bold cursor-pointer border-none shadow-md transition-colors active:scale-95"
          >
            Go Back
          </button>
        </div>
      </AuthAmbientBackground>
    );
  }

  return (
    <AuthAmbientBackground showTicker={false}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col min-h-[calc(100vh-36px)] gap-5 pb-28 md:pb-12">

        {/* Header */}
        <header className="w-full flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/60 hover:bg-white/80 text-[#006972] transition-all cursor-pointer active:scale-90 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgba(0,105,114,0.12)]"
          >
            <Icon name="arrow_back" size={20} />
          </button>
          <h1 className="font-headline text-[20px] sm:text-[23px] font-bold text-deep-navy tracking-tight">
            Checkout & Pay
          </h1>
          <button
            onClick={() => navigate('/payments/my')}
            title="My Payments"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/60 hover:bg-white/80 text-[#006972] transition-all cursor-pointer active:scale-90 backdrop-blur-xl border border-white/80 shadow-sm"
          >
            <Icon name="history" size={20} />
          </button>
        </header>

        {/* Cycle Switcher Tabs */}
        {cycles.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-label text-[10px] font-bold uppercase text-on-surface-variant tracking-widest flex items-center gap-1">
                <Icon name="tune" size={12} className="text-[#006972]" /> Select Cycle to Pay
              </span>
              {cycles.length > 1 && (
                <button
                  onClick={() => setShowFutureCyclesDrawer(!showFutureCyclesDrawer)}
                  className="font-label text-[11px] font-bold text-[#006972] hover:underline cursor-pointer bg-transparent border-none"
                >
                  {showFutureCyclesDrawer ? 'Hide Future Cycles' : 'Pay Future Cycles'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {cycles.map((cy) => {
                const isSelected = String(cy.id) === String(selectedCycleId);
                const isCollecting = cy.status === 'collecting';
                return (
                  <button
                    key={cy.id}
                    onClick={() => handleSelectCycle(cy.id)}
                    className={`px-4 py-2 rounded-full font-label text-[12px] font-bold transition-all cursor-pointer border shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#006972] text-white border-[#006972] shadow-md shadow-[#006972]/20'
                        : 'bg-white/60 hover:bg-white text-deep-navy/70 border-white/80'
                    }`}
                  >
                    <Icon name={isCollecting ? 'schedule' : 'event'} size={14} />
                    Cycle {cy.cycle_number}
                    {isCollecting && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Step Progress Tracker */}
        <section className="grid grid-cols-3 gap-2 text-center font-label text-[11px] font-bold">
          <div className="p-2 rounded-2xl bg-white/70 border border-white/80 text-[#006972] flex items-center justify-center gap-1.5 shadow-sm">
            <span className="w-5 h-5 rounded-full bg-[#006972] text-white text-[10px] flex items-center justify-center font-mono">1</span>
            <span>Transfer</span>
          </div>
          <div className="p-2 rounded-2xl bg-white/50 border border-white/70 text-deep-navy/70 flex items-center justify-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#006972]/15 text-[#006972] text-[10px] flex items-center justify-center font-mono">2</span>
            <span>App Pay</span>
          </div>
          <div className="p-2 rounded-2xl bg-white/50 border border-white/70 text-deep-navy/70 flex items-center justify-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#006972]/15 text-[#006972] text-[10px] flex items-center justify-center font-mono">3</span>
            <span>Verify</span>
          </div>
        </section>

        {/* Amount Hero Banner */}
        <section className="bg-gradient-to-br from-[#006972] via-[#007a82] to-[#005f66] rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden border border-[#006972]/30 shadow-[0_16px_48px_rgba(0,105,114,0.3)]">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-44 bg-white/15 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none" />
          <div className="relative z-10 space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white font-label text-[11px] font-bold uppercase tracking-wider border border-white/20 mb-2">
              <Icon name="groups" size={13} /> {committee?.name} — Cycle {activeCycle?.cycle_number ?? '—'}
            </span>
            <h2 className="font-headline text-[42px] sm:text-[54px] font-bold text-white leading-none tabular-nums tracking-tight">
              Rs. {amount.toLocaleString('en-PK')}
            </h2>
            {dueDate && (
              <div className="inline-flex items-center gap-1.5 text-white/90 font-label text-[12px] font-semibold pt-2">
                <Icon name="event" size={15} className="text-emerald-300" />
                <span>Due by <strong>{dueDate}</strong></span>
              </div>
            )}
          </div>
        </section>

        {submitted ? (
          <section className={`${GLASS_CARD} rounded-3xl p-6 sm:p-8 text-center space-y-4`}>
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200/80 shadow-md">
              <Icon name="mark_email_read" size={32} />
            </div>
            <div>
              <h3 className="font-headline text-[22px] font-bold text-deep-navy">Payment Submitted!</h3>
              <p className="font-body text-[13px] text-on-surface-variant mt-1.5 leading-relaxed max-w-md mx-auto">
                The organizer will verify your transfer of <strong className="text-deep-navy">Rs. {amount.toLocaleString('en-PK')}</strong> for Cycle {activeCycle?.cycle_number}.
                You will get a notification once confirmed.
              </p>
            </div>
            <button
              onClick={() => navigate(`/committee/${committeeId}`)}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#006972] to-[#007a82] hover:from-[#00575f] hover:to-[#006972] text-white font-label text-[13px] font-bold cursor-pointer border-none shadow-lg shadow-[#006972]/25 active:scale-95 transition-all"
            >
              Back to Committee
            </button>
          </section>
        ) : (
          <>
            {/* Transfer Details Card */}
            <section className={`${GLASS_CARD} rounded-3xl p-5 sm:p-6 relative overflow-hidden space-y-4`}>
              <div className="h-0.5 bg-gradient-to-r from-transparent via-[#006972]/40 to-transparent absolute top-0 inset-x-6" />
              <div className="flex items-center justify-between">
                <span className="font-label text-[10px] font-bold uppercase text-on-surface-variant tracking-widest flex items-center gap-1">
                  <Icon name="account_balance_wallet" size={13} className="text-[#006972]" /> Transfer Details
                </span>
                <span className="text-[10px] font-label font-bold text-[#006972] bg-[#006972]/10 px-2 py-0.5 rounded-full border border-[#006972]/15">
                  Send to Organizer
                </span>
              </div>

              {/* Account Title */}
              <div className="flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <p className="font-label text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-0.5">Account Title</p>
                  <p className="font-headline text-[16px] sm:text-[17px] font-bold text-deep-navy truncate">{committee?.account_title || '—'}</p>
                </div>
                <button
                  onClick={() => handleCopy(committee?.account_title || '', 'title', 'account title')}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 cursor-pointer border shrink-0 ${
                    copied === 'title'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-white/80 hover:bg-white text-[#006972] border-white/80 shadow-sm'
                  }`}
                  title="Copy Account Title"
                >
                  <Icon name={copied === 'title' ? 'check' : 'content_copy'} size={17} />
                </button>
              </div>

              {/* Account Number */}
              <div className="flex justify-between items-center gap-3 p-3.5 rounded-2xl bg-white/60 border border-white/80 shadow-sm">
                <div className="flex gap-3.5 items-center min-w-0">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md" style={{ backgroundColor: wallet.brandColor }}>
                    <Icon name={wallet.label === 'Bank Transfer' ? 'account_balance' : 'payments'} size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-label text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-0.5">{wallet.label} Account</p>
                    <p className="font-headline text-[16px] sm:text-[17px] font-bold text-deep-navy truncate font-mono text-[#006972]">{committee?.account_number || '—'}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(committee?.account_number || '', 'number', 'account number')}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 cursor-pointer border shrink-0 ${
                    copied === 'number'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-white/80 hover:bg-white text-[#006972] border-white/80 shadow-sm'
                  }`}
                  title="Copy Account Number"
                >
                  <Icon name={copied === 'number' ? 'check' : 'content_copy'} size={17} />
                </button>
              </div>

              {/* Amount row */}
              <div className="flex justify-between items-center gap-3">
                <div>
                  <p className="font-label text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-0.5">Exact Amount to Send</p>
                  <p className="font-headline text-[17px] sm:text-[19px] font-bold text-deep-navy tabular-nums">Rs. {amount.toLocaleString('en-PK')}</p>
                </div>
                <button
                  onClick={() => handleCopy(String(amount), 'amount', 'amount')}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 cursor-pointer border shrink-0 ${
                    copied === 'amount'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-white/80 hover:bg-white text-[#006972] border-white/80 shadow-sm'
                  }`}
                  title="Copy Amount"
                >
                  <Icon name={copied === 'amount' ? 'check' : 'content_copy'} size={17} />
                </button>
              </div>
            </section>

            {/* Open Wallet Quick Action Buttons (JazzCash & EasyPaisa) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="font-label text-[10px] font-bold uppercase text-on-surface-variant tracking-wider flex items-center gap-1">
                  <Icon name="phone_android" size={13} className="text-[#006972]" /> Quick Pay via Mobile Wallet
                </span>
                <span className="text-[10px] font-label text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                  Auto-copies Account #
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* JazzCash Button */}
                <button
                  type="button"
                  onClick={() => handleOpenWallet('jazzcash')}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-3 px-4 text-white font-label text-[13px] font-bold shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer transition-all border border-white/25 bg-[#c8102e]"
                >
                  <Icon name="open_in_new" size={16} />
                  <span>Open JazzCash</span>
                </button>

                {/* EasyPaisa Button */}
                <button
                  type="button"
                  onClick={() => handleOpenWallet('easypaisa')}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-3 px-4 text-white font-label text-[13px] font-bold shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer transition-all border border-white/25 bg-[#00a651]"
                >
                  <Icon name="open_in_new" size={16} />
                  <span>Open EasyPaisa</span>
                </button>
              </div>
            </div>

            {walletHint && (
              <p className="font-body text-[12px] text-on-surface-variant text-center px-3 leading-relaxed bg-white/60 border border-white/80 p-2.5 rounded-2xl shadow-sm">
                {walletHint}
              </p>
            )}

            {/* Submit Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className={`${GLASS_CARD} rounded-3xl p-5 space-y-4 text-left`}>
                <p className="font-label text-[10px] font-bold uppercase text-on-surface-variant tracking-widest flex items-center gap-1">
                  <Icon name="verified" size={13} className="text-[#006972]" /> Submit Transfer Receipt
                </p>

                {/* Sender Account */}
                <div>
                  <label htmlFor="senderAccount" className="block font-label text-[11px] font-bold text-deep-navy uppercase tracking-wider mb-1.5">
                    Sender Account / Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#006972]">
                      <Icon name="person" size={18} />
                    </div>
                    <input
                      id="senderAccount"
                      type="text"
                      required
                      value={senderAccount}
                      onChange={(e) => setSenderAccount(e.target.value)}
                      placeholder="e.g. 03451234567"
                      className="block w-full pl-11 pr-4 py-3 border border-white/80 rounded-2xl bg-white/70 backdrop-blur-xl focus:border-[#006972] focus:bg-white focus:ring-4 focus:ring-[#006972]/8 outline-none transition-all text-deep-navy font-body text-[14px] placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Transaction Reference */}
                <div>
                  <label htmlFor="txnRef" className="block font-label text-[11px] font-bold text-deep-navy uppercase tracking-wider mb-1.5">
                    Transaction ID / TID <span className="font-normal text-on-surface-variant/70 text-[10px]">(Optional)</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#006972]">
                      <Icon name="receipt" size={18} />
                    </div>
                    <input
                      id="txnRef"
                      type="text"
                      value={txnRef}
                      onChange={(e) => setTxnRef(e.target.value)}
                      placeholder="From your wallet SMS (e.g. TXN987654)"
                      className="block w-full pl-11 pr-4 py-3 border border-white/80 rounded-2xl bg-white/70 backdrop-blur-xl focus:border-[#006972] focus:bg-white focus:ring-4 focus:ring-[#006972]/8 outline-none transition-all text-deep-navy font-body text-[14px] placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#006972] to-[#007a82] hover:from-[#00575f] hover:to-[#006972] text-white font-label text-[14px] font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#006972]/25 active:scale-[0.98] cursor-pointer border-none disabled:opacity-60"
              >
                {submitting && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                <Icon name="check_circle" size={18} />
                Submit Payment for Cycle {activeCycle?.cycle_number ?? ''}
              </button>
            </form>
          </>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-24 right-4 left-4 sm:left-auto sm:right-5 sm:w-80 z-50 px-4 py-3 rounded-2xl shadow-2xl font-label text-[13px] font-bold flex items-center gap-2.5 border border-white/20 bg-[#006972] text-white">
            <Icon name="check_circle" size={18} className="shrink-0 text-emerald-300" />
            <span className="flex-1">{toastMessage}</span>
          </div>
        )}

      </div>
    </AuthAmbientBackground>
  );
}
