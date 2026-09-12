import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import { fileComplaint, reportUser, searchReportableUsers } from '../../services/supportService';
import { getMyCommittees } from '../../services/committeeService';

export default function FileComplaint() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine initial mode from URL query param
  const initialMode = searchParams.get('mode') === 'user_report' ? 'user_report' : 'committee';
  const [mode, setMode] = useState(initialMode);

  // ── Committee Dispute State ──
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [committees, setCommittees] = useState([]);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState('');
  const [loadingCommittees, setLoadingCommittees] = useState(true);

  // ── Report a User State ──
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportCategory, setReportCategory] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  // ── Shared State ──
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMode, setSuccessMode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyCommittees();
        const list = data?.committees || data || [];
        setCommittees(list);
      } catch (err) {
        console.error('Failed to load committees:', err);
      } finally {
        setLoadingCommittees(false);
      }
    })();
  }, []);

  // Search users with debounce
  useEffect(() => {
    if (userQuery.trim().length < 2) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const data = await searchReportableUsers(userQuery.trim());
        setUserResults(data?.users || data || []);
      } catch {
        setUserResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [userQuery]);

  const categories = [
    { id: 'payment_dispute', label: 'Payment Dispute', icon: 'payments' },
    { id: 'harassment', label: 'Harassment', icon: 'psychology' },
    { id: 'suspected_fraud', label: 'Suspected Fraud', icon: 'policy' },
    { id: 'other', label: 'Other', icon: 'help' },
  ];

  // ── Committee Dispute Submit ──
  async function handleSubmitCommittee(e) {
    e.preventDefault();
    setError('');
    if (!category) { setError('Please select a category.'); return; }
    if (!description.trim() || description.trim().length < 20) {
      setError('Description must be at least 20 characters.'); return;
    }
    if (description.length > 3000) {
      setError('Description must be 3000 characters or less.'); return;
    }
    if (!selectedCommitteeId) { setError('Please select the committee this dispute is about.'); return; }
    setSubmitting(true);
    try {
      await fileComplaint({ category, description: description.trim(), committee_id: selectedCommitteeId });
      setSuccessMode('committee');
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Report a User Submit ──
  async function handleSubmitReport(e) {
    e.preventDefault();
    setError('');
    if (!selectedUser) { setError('Please search and select the user you want to report.'); return; }
    if (!reportCategory) { setError('Please select a violation category.'); return; }
    if (!reportDesc.trim() || reportDesc.trim().length < 20) {
      setError('Description must be at least 20 characters.'); return;
    }
    if (reportDesc.length > 3000) {
      setError('Description must be 3000 characters or less.'); return;
    }
    setSubmitting(true);
    try {
      await reportUser({
        accused_user_id: selectedUser.id,
        category: reportCategory,
        description: reportDesc.trim(),
        evidence_url: evidenceUrl.trim() || undefined,
      });
      setSuccessMode('user_report');
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Success State ── */
  if (success) {
    return (
      <AuthAmbientBackground showTicker={true}>
        <div className="w-full max-w-md mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col items-center justify-center min-h-[calc(100vh-36px)]">
          <main className="w-full bg-white/85 backdrop-blur-2xl border border-[#006972]/20 shadow-[0_24px_70px_-15px_rgba(0,105,114,0.22),0_0_0_1px_rgba(0,105,114,0.1)] rounded-2xl sm:rounded-3xl p-6 sm:p-8 animate-fade-up relative z-10 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${successMode === 'user_report' ? 'bg-rose-50 border-rose-200' : 'bg-emerald-100 border-emerald-200'}`}>
              <Icon name="check_circle" size={32} className={successMode === 'user_report' ? 'text-rose-600' : 'text-emerald-600'} />
            </div>
            <h2 className="font-headline text-[20px] font-bold text-deep-navy mb-2">
              {successMode === 'user_report' ? 'User Reported Successfully' : 'Complaint Filed Successfully'}
            </h2>
            <p className="font-body text-[13px] text-on-surface-variant mb-6 leading-relaxed">
              {successMode === 'user_report'
                ? 'Our admin team has been notified and will review your report within 24–48 hours.'
                : <>Our AI Case-Builder Agent is now investigating your complaint.<br />You'll receive a notification once the analysis is complete.</>}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => navigate('/support/complaints')} className="flex-1 py-3 rounded-xl bg-[#006972] text-white font-label text-[13px] font-bold hover:bg-[#00575f] transition-colors cursor-pointer">
                View My Complaints
              </button>
              <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-label text-[13px] font-bold hover:bg-slate-200 transition-colors cursor-pointer">
                Back to Dashboard
              </button>
            </div>
          </main>
        </div>
      </AuthAmbientBackground>
    );
  }

  /* ── Form State ── */
  return (
    <AuthAmbientBackground showTicker={true}>
      <div className="w-full max-w-lg mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col items-center min-h-[calc(100vh-36px)] pb-32">

        {/* Main Glass Card */}
        <main className="w-full bg-white/85 backdrop-blur-2xl border border-[#006972]/20 shadow-[0_24px_70px_-15px_rgba(0,105,114,0.22),0_0_0_1px_rgba(0,105,114,0.1)] rounded-2xl sm:rounded-3xl p-5 sm:p-8 animate-fade-up relative z-10">

          {/* Header */}
          <header className="w-full flex items-center gap-3 mb-5">
            <button
              onClick={() => navigate('/support')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/5 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-colors cursor-pointer active:scale-95"
            >
              <Icon name="arrow_back" size={20} />
            </button>
            <div>
              <h1 className="font-headline text-[20px] sm:text-[22px] font-bold text-deep-navy">File a Report</h1>
              <p className="font-body text-[12px] text-on-surface-variant">Committee dispute or user report</p>
            </div>
          </header>

          {/* Mode Toggle */}
          <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl mb-6">
            <button
              onClick={() => { setMode('committee'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-label text-[13px] font-bold transition-all cursor-pointer ${
                mode === 'committee'
                  ? 'bg-white text-[#006972] shadow-sm border border-[#006972]/15'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon name="gavel" size={16} />
              Committee Dispute
            </button>
            <button
              onClick={() => { setMode('user_report'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-label text-[13px] font-bold transition-all cursor-pointer ${
                mode === 'user_report'
                  ? 'bg-white text-rose-600 shadow-sm border border-rose-200/60'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon name="flag" size={16} />
              Report a User
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-body text-[13px] flex items-center gap-2.5 animate-fade-in">
              <Icon name="error" size={18} className="shrink-0" /> {error}
            </div>
          )}

          {/* ════════════════════════════════════════ */}
          {/* COMMITTEE DISPUTE MODE                   */}
          {/* ════════════════════════════════════════ */}
          {mode === 'committee' && (
            <form onSubmit={handleSubmitCommittee} className="space-y-6">
              {/* Committee Selection */}
              <section>
                <label className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5 block">Select Committee Pool</label>
                {loadingCommittees ? (
                  <div className="p-3.5 rounded-xl border border-[#006972]/10 bg-white text-on-surface-variant font-body text-[13px] animate-pulse">Loading committees...</div>
                ) : committees.length === 0 ? (
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 font-body text-[13px] flex items-center gap-2">
                    <Icon name="warning" size={16} className="shrink-0" /> You are not a member of any committee yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {committees.map((c) => (
                      <button key={c.id} type="button"
                        onClick={() => setSelectedCommitteeId(c.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl text-left font-label text-[13px] font-bold transition-all border-2 cursor-pointer ${
                          selectedCommitteeId === c.id
                            ? 'bg-[#006972] text-white border-[#006972] shadow-md'
                            : 'bg-white text-deep-navy border-[#006972]/10 hover:border-[#006972]/35'
                        }`}>
                        <Icon name="groups" size={18} className={selectedCommitteeId === c.id ? 'text-white' : 'text-[#006972]'} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{c.name || 'Unnamed Committee'}</p>
                          <p className={`text-[11px] font-body font-normal mt-0.5 ${selectedCommitteeId === c.id ? 'text-white/70' : 'text-on-surface-variant'}`}>
                            {c.member_count || c.capacity || '?'} members • Rs. {c.contribution_amount?.toLocaleString() || '0'}
                          </p>
                        </div>
                        {selectedCommitteeId === c.id && <Icon name="check_circle" size={18} className="text-emerald-300" />}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Category Selection */}
              <section>
                <label className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5 block">Category</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {categories.map((cat) => (
                    <button key={cat.id} type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2.5 p-3.5 rounded-xl text-left font-label text-[13px] font-bold transition-all border-2 cursor-pointer ${
                        category === cat.id
                          ? 'bg-[#006972] text-white border-[#006972] shadow-md'
                          : 'bg-white text-deep-navy border-[#006972]/10 hover:border-[#006972]/35'
                      }`}>
                      <Icon name={cat.icon} size={18} className={category === cat.id ? 'text-white' : 'text-[#006972]'} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Description */}
              <section>
                <label className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5 block">Describe the Issue</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-[#006972]/15 rounded-xl p-4 outline-none focus:border-[#006972] focus:ring-2 focus:ring-[#006972]/15 font-body text-[14px] text-deep-navy placeholder:text-on-surface-variant/50 resize-none"
                  placeholder="Include dates, amounts, member names. The AI agent will cross-reference your claims with payment records..."
                  rows={6} maxLength={3000} />
                <div className="flex justify-between items-center mt-1.5">
                  <p className="font-body text-[11px] text-on-surface-variant/60">Min 20 characters</p>
                  <p className={`font-body text-[11px] ${description.length > 2800 ? 'text-rose-600 font-bold' : 'text-on-surface-variant/60'}`}>
                    {description.length} / 3000
                  </p>
                </div>
              </section>

              {/* Submit */}
              <button type="submit" disabled={submitting || !category || !selectedCommitteeId || description.trim().length < 20}
                className="w-full bg-gradient-to-r from-[#006972] to-[#007a82] text-white py-3.5 px-6 rounded-xl font-label text-[14px] font-bold hover:from-[#00575f] hover:to-[#006972] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 cursor-pointer">
                {submitting ? (
                  <><Icon name="hourglass_top" size={18} className="animate-pulse" /> Filing & Starting AI Investigation...</>
                ) : (
                  <><Icon name="send" size={18} /> Submit Complaint</>
                )}
              </button>

              {/* Info Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#006972]/4 to-amber-50/40 border border-[#006972]/10">
                <p className="font-body text-[12px] text-on-surface-variant flex items-start gap-2.5 leading-relaxed">
                  <Icon name="auto_awesome" size={16} className="shrink-0 mt-0.5 text-[#006972]" />
                  <span>
                    <strong className="text-deep-navy">AI Case-Builder Agent:</strong> Cross-references payment records, trust scores & risk flags. Cases with 85%+ confidence are auto-resolved. Complex cases are forwarded to human reviewers.
                  </span>
                </p>
              </div>
            </form>
          )}

          {/* ════════════════════════════════════════ */}
          {/* REPORT A USER MODE                       */}
          {/* ════════════════════════════════════════ */}
          {mode === 'user_report' && (
            <form onSubmit={handleSubmitReport} className="space-y-6">
              {/* User Search */}
              <section>
                <label className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5 block">Search User to Report</label>

                {selectedUser ? (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300">
                    <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold font-headline text-[16px] shrink-0">
                      {(selectedUser.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-label text-[14px] font-bold text-deep-navy truncate">{selectedUser.full_name}</p>
                      <p className="font-body text-[12px] text-on-surface-variant">{selectedUser.email || selectedUser.phone_number}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedUser(null); setUserQuery(''); }}
                      className="w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center border-none cursor-pointer transition-colors"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#006972]">
                      <Icon name="search" size={18} />
                    </div>
                    <input
                      type="text"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="Search by name, phone, or email..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#006972]/15 outline-none focus:border-[#006972] focus:ring-2 focus:ring-[#006972]/15 font-body text-[14px] text-deep-navy placeholder:text-on-surface-variant/50"
                    />
                    {searchingUsers && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <Icon name="progress_activity" size={18} className="text-[#006972] animate-spin" />
                      </div>
                    )}

                    {userResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#006972]/15 rounded-xl shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto">
                        {userResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => { setSelectedUser(u); setUserQuery(''); setUserResults([]); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#006972]/5 border-b border-slate-50 last:border-b-0 text-left cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#006972] text-white flex items-center justify-center font-bold text-[13px] shrink-0">
                              {(u.full_name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-label text-[13px] font-bold text-deep-navy truncate">{u.full_name}</p>
                              <p className="font-body text-[11px] text-on-surface-variant">{u.email || u.phone_number}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Violation Category */}
              <section>
                <label className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5 block">Violation Category</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {categories.map((cat) => (
                    <button key={cat.id} type="button"
                      onClick={() => setReportCategory(cat.id)}
                      className={`flex items-center gap-2.5 p-3.5 rounded-xl text-left font-label text-[13px] font-bold transition-all border-2 cursor-pointer ${
                        reportCategory === cat.id
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                          : 'bg-white text-deep-navy border-slate-200 hover:border-rose-300'
                      }`}>
                      <Icon name={cat.icon} size={18} className={reportCategory === cat.id ? 'text-white' : 'text-rose-600'} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Report Description */}
              <section>
                <label className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5 block">Describe the Incident</label>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full bg-white border border-[#006972]/15 rounded-xl p-4 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/15 font-body text-[14px] text-deep-navy placeholder:text-on-surface-variant/50 resize-none"
                  placeholder="Describe what happened, when it occurred, and any relevant context..."
                  rows={5} maxLength={3000}
                />
                <div className="flex justify-between items-center mt-1.5">
                  <p className="font-body text-[11px] text-on-surface-variant/60">Min 20 characters</p>
                  <p className={`font-body text-[11px] ${reportDesc.length > 2800 ? 'text-rose-600 font-bold' : 'text-on-surface-variant/60'}`}>
                    {reportDesc.length} / 3000
                  </p>
                </div>
              </section>

              {/* Evidence URL (optional) */}
              <section>
                <label className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5 block">
                  Evidence URL <span className="font-normal normal-case opacity-60">(optional)</span>
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://drive.google.com/... screenshot or document link"
                  className="w-full bg-white border border-[#006972]/15 rounded-xl px-4 py-3 outline-none focus:border-[#006972] font-body text-[14px] text-deep-navy placeholder:text-on-surface-variant/40"
                />
              </section>

              {/* Submit */}
              <button type="submit" disabled={submitting || !selectedUser || !reportCategory || reportDesc.trim().length < 20}
                className="w-full bg-gradient-to-r from-rose-600 to-rose-700 text-white py-3.5 px-6 rounded-xl font-label text-[14px] font-bold hover:from-rose-700 hover:to-rose-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 cursor-pointer">
                {submitting ? (
                  <><Icon name="hourglass_top" size={18} className="animate-pulse" /> Submitting Report...</>
                ) : (
                  <><Icon name="flag" size={18} /> Submit User Report</>
                )}
              </button>

              {/* Info Box */}
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/60">
                <p className="font-body text-[12px] text-rose-900/80 flex items-start gap-2.5 leading-relaxed">
                  <Icon name="shield" size={16} className="shrink-0 mt-0.5 text-rose-600" />
                  <span>
                    <strong className="text-rose-900">Admin Review:</strong> All user reports are reviewed by our moderation team within 24–48 hours. Repeated false reports may result in your own account being flagged.
                  </span>
                </p>
              </div>
            </form>
          )}
        </main>
      </div>

    </AuthAmbientBackground>
  );
}
