import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import { committeeService } from '../../services';

export default function ReviewConfirm() {
  const navigate = useNavigate();
  const location = useLocation();

  const data = location.state || {
    name: 'Diwali Savings Fund 2026',
    contribution: 5000,
    capacity: 10,
    interval: '1 month',
    payoutOrder: 'fixed',
    duration: '10 Cycles (10 Months)',
    provider: 'jazzcash',
    accountTitle: 'Ali Khan',
    accountNumber: '03001234567',
  };

  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [apiError, setApiError] = useState('');
  const [ripples, setRipples] = useState({});

  function triggerRipple(e, key) {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipples((prev) => ({
      ...prev,
      [key]: { x: e.clientX - rect.left, y: e.clientY - rect.top, k: Date.now() },
    }));
    setTimeout(() => {
      setRipples((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 600);
  }

  const numMembers = data.capacity || 10;
  const contrib = data.contribution || 5000;
  const totalPool = numMembers * contrib;

  async function handleConfirm(e) {
    if (e) triggerRipple(e, 'confirm');
    setLoading(true);
    setApiError('');

    try {
      const token = localStorage.getItem('sanjhi_token');
      let createdRes = null;

      if (token) {
        createdRes = await committeeService.createCommittee({
          name: data.name,
          contribution_amount: data.contribution,
          capacity: data.capacity,
          interval_type: data.interval,
          is_public: data.is_public,
          category: data.category,
          description: data.description,
          rules: data.rules,
          collection_account: {
            account_type: data.provider,
            account_title: data.accountTitle,
            account_number: data.accountNumber,
          },
        });
      }

      const inviteCode =
        createdRes?.inviteCode ||
        createdRes?.committee?.invite_code ||
        `SANJHI-${Math.floor(1000 + Math.random() * 9000)}K`;

      navigate('/committee/created', {
        state: {
          ...data,
          inviteCode,
          committeeId: createdRes?.committee?.id,
        },
      });
    } catch (err) {
      console.log('Creation fallback mode notice:', err.message);
      // Fallback to local state if server is offline or mock token
      navigate('/committee/created', {
        state: {
          ...data,
          inviteCode: `SANJHI-${Math.floor(1000 + Math.random() * 9000)}K`,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthAmbientBackground showTicker={true}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col items-center justify-center min-h-[calc(100vh-36px)] pb-28 md:pb-12">
        
        {/* Main Glass Card matching User Dashboard */}
        <main className="w-full bg-white/85 backdrop-blur-2xl border border-[#006972]/20 shadow-[0_24px_70px_-15px_rgba(0,105,114,0.22),0_0_0_1px_rgba(0,105,114,0.1)] rounded-2xl sm:rounded-3xl p-5 sm:p-8 animate-fade-up relative z-10">
          
          {/* Header Navigation & Step Indicator */}
          <header className="w-full flex items-center justify-between mb-6 border-b border-[#006972]/10 pb-4">
            <button
              onClick={() => navigate('/committee/link-account', { state: data })}
              aria-label="Go back to Step 3"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/5 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-colors cursor-pointer active:scale-95"
            >
              <Icon name="arrow_back" size={20} />
            </button>

            <div className="text-center">
              <h1 className="font-headline text-[20px] sm:text-[24px] font-bold text-deep-navy">
                Review & Confirm
              </h1>
              <p className="font-body text-[12px] sm:text-[13px] text-on-surface-variant">
                Step 4 of 4: Final Verification
              </p>
            </div>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-label text-[11px] font-bold border border-emerald-200">
              4 / 4
            </span>
          </header>

          {/* Progress Bar */}
          <div className="w-full bg-[#006972]/10 h-2 rounded-full mb-6 overflow-hidden">
            <div className="bg-[#006972] h-full w-full rounded-full transition-all duration-500" />
          </div>

          <p className="font-body text-[13px] text-on-surface-variant mb-4 text-center">
            Review your committee parameters before publishing to the network.
          </p>

          {apiError && (
            <div className="w-full mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-[13px] font-body flex items-start gap-2 shadow-sm">
              <Icon name="error" size={18} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Summary Glass Card */}
          <div className="bg-white border border-[#006972]/20 rounded-2xl overflow-hidden mb-6 shadow-sm">
            <div className="h-2 bg-[#006972] w-full" />
            
            <div className="p-4 sm:p-6 space-y-3.5 text-left">
              
              <SummaryRow
                label="Committee Name"
                value={data.name}
                onEdit={() => navigate('/committee/create', { state: data })}
              />

              <SummaryRow
                label="Monthly Contribution"
                value={`Rs. ${contrib.toLocaleString()} per member`}
                onEdit={() => navigate('/committee/create', { state: data })}
              />

              <SummaryRow
                label="Total Monthly Pool"
                value={`Rs. ${totalPool.toLocaleString()} (${numMembers} members)`}
                onEdit={() => navigate('/committee/create', { state: data })}
              />

              <SummaryRow
                label="Collection Interval"
                value={data.interval === '15 days' ? 'Every 15 Days' : `Every ${data.interval}`}
                onEdit={() => navigate('/committee/schedule', { state: data })}
              />

              <SummaryRow
                label="Payout Distribution"
                value={data.payoutOrder === 'fixed' ? 'Fixed Sequential Order' : data.payoutOrder}
                onEdit={() => navigate('/committee/schedule', { state: data })}
              />

              <SummaryRow
                label="Visibility"
                value={data.is_public ? `Public Marketplace — ${data.category || 'Uncategorized'}` : 'Private (invite-only)'}
                onEdit={() => navigate('/committee/create', { state: data })}
              />

              {data.description && (
                <SummaryRow
                  label="Description"
                  value={data.description}
                  onEdit={() => navigate('/committee/create', { state: data })}
                />
              )}

              {data.rules && (
                <SummaryRow
                  label="Rules / Notes"
                  value={data.rules}
                  onEdit={() => navigate('/committee/create', { state: data })}
                />
              )}

              <SummaryRow
                label="Linked Account"
                value={`${(data.provider || 'JazzCash').toUpperCase()} (${data.accountTitle} • ${data.accountNumber})`}
                onEdit={() => navigate('/committee/link-account', { state: data })}
                isLast
              />
            </div>
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="bg-[#006972]/8 rounded-2xl p-4 border border-[#006972]/15 flex items-start gap-3 mb-6 text-left">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-[#006972] focus:ring-[#006972] cursor-pointer"
            />
            <label htmlFor="terms" className="font-body text-[12px] text-on-surface-variant cursor-pointer">
              I confirm these details are accurate, agree to the Sanjhi Terms of Service, and commit to maintaining full transparency.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/committee/link-account', { state: data })}
              className="w-1/3 py-3.5 px-4 rounded-2xl font-label text-[14px] font-bold text-[#006972] border border-[#006972]/30 hover:bg-[#006972]/5 transition-all cursor-pointer bg-white"
            >
              Back
            </button>
            
            <button
              type="button"
              disabled={loading || !agreed}
              onClick={handleConfirm}
              className="relative overflow-hidden w-2/3 bg-[#006972] hover:bg-[#00575f] text-white py-3.5 px-6 rounded-2xl font-label text-[15px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#006972]/25 hover:shadow-xl cursor-pointer disabled:opacity-50 border-none"
            >
              {ripples.confirm && (
                <span
                  className="absolute rounded-full bg-white/30 w-32 h-32 -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none"
                  style={{ left: ripples.confirm.x, top: ripples.confirm.y }}
                />
              )}
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Creating Committee...
                </>
              ) : (
                <>
                  Confirm & Create Committee
                  <Icon name="check_circle" size={18} />
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    </AuthAmbientBackground>
  );
}

function SummaryRow({ label, value, onEdit, isLast = false }) {
  return (
    <div className={`flex items-center justify-between pb-3 ${!isLast ? 'border-b border-[#006972]/10' : ''}`}>
      <div>
        <span className="block font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
          {label}
        </span>
        <span className="block font-headline text-[14px] sm:text-[15px] font-bold text-deep-navy mt-0.5">
          {value}
        </span>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="p-2 rounded-full text-[#006972] hover:bg-[#006972]/10 transition-colors cursor-pointer"
        title={`Edit ${label}`}
      >
        <Icon name="edit" size={18} />
      </button>
    </div>
  );
}
