import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { reportUser, searchReportableUsers } from '../services/supportService';

const CATEGORIES = [
  {
    id: 'suspected_fraud',
    label: 'Suspected Fraud / Scam',
    desc: 'Financial deception, fraudulent claims, or fake collection accounts',
    icon: 'policy',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    id: 'harassment',
    label: 'Harassment / Abuse',
    desc: 'Inappropriate language, threats, bullying, or aggressive behavior',
    icon: 'sentiment_very_dissatisfied',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
  },
  {
    id: 'payment_dispute',
    label: 'Defaulting / Non-Payment',
    desc: 'Refusal or repeated failure to pay agreed committee dues',
    icon: 'payments',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    id: 'other',
    label: 'Identity / Policy Violation',
    desc: 'Fake profile, impersonation, or platform rule breaking',
    icon: 'shield',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
  },
];

export default function ReportUserModal({
  isOpen,
  onClose,
  targetUser = null,
  committeeId = null,
  committeeName = '',
  onSuccess = null,
}) {
  const [selectedUser, setSelectedUser] = useState(targetUser);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  // User search states (if no targetUser was passed)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedUser(targetUser);
      setCategory('');
      setDescription('');
      setEvidenceUrl('');
      setError('');
      setSuccess(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, targetUser]);

  // Handle live search when searching for another user
  useEffect(() => {
    if (selectedUser || !isOpen) return;

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchReportableUsers(searchQuery.trim());
        setSearchResults(res?.users || res || []);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, selectedUser, isOpen]);

  if (!isOpen) return null;

  const currentUserId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('sanjhi_user') || '{}');
      return u?.id || u?.userId;
    } catch {
      return null;
    }
  })();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const targetId = selectedUser?.id || selectedUser?.user_id;

    if (!targetId) {
      setError('Please select the user you want to report.');
      return;
    }

    if (targetId === currentUserId) {
      setError('You cannot report your own account.');
      return;
    }

    if (!category) {
      setError('Please select a violation category.');
      return;
    }

    if (!description.trim() || description.trim().length < 20) {
      setError('Description must be at least 20 characters so admins can investigate.');
      return;
    }

    setSubmitting(true);
    try {
      await reportUser({
        accused_user_id: targetId,
        committee_id: committeeId || null,
        category,
        description: description.trim(),
        evidence_url: evidenceUrl.trim() || null,
      });

      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const targetName = selectedUser?.full_name || selectedUser?.name || 'User';
  const targetContact = selectedUser?.phone_number || selectedUser?.phone || selectedUser?.email || '';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] my-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-700 via-rose-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0">
              <Icon name="report" size={22} />
            </div>
            <div>
              <h2 className="font-headline text-[17px] sm:text-[18px] font-bold leading-tight">
                Report User
              </h2>
              <p className="font-label text-[11px] text-rose-200">
                Administrative and AI Case Investigation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border-none"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {success ? (
            <div className="py-8 text-center space-y-3 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-md">
                <Icon name="check_circle" size={36} />
              </div>
              <h3 className="font-headline text-[18px] font-bold text-deep-navy">
                Report Filed Successfully
              </h3>
              <p className="font-body text-[13px] text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                Thank you for helping keep Sanjhi safe. Platform administrators and our AI Case-Builder will review your report and take necessary action.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-body text-[13px] flex items-center gap-2.5 animate-fade-in">
                  <Icon name="error" size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Reported User Badge / Search */}
              <div>
                <label className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Reported User
                </label>

                {selectedUser ? (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-white font-bold flex items-center justify-center text-[15px] shrink-0">
                        {targetName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-headline text-[14px] font-bold text-deep-navy truncate">
                          {targetName}
                        </p>
                        {targetContact && (
                          <p className="font-body text-[12px] text-on-surface-variant truncate">
                            {targetContact}
                          </p>
                        )}
                      </div>
                    </div>

                    {!targetUser && (
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="font-label text-[11px] font-bold text-[#006972] hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Change
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Icon
                        name="search"
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by full name, phone number, or email..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-body text-[13px] text-deep-navy placeholder:text-slate-400 focus:outline-none focus:border-[#006972] focus:ring-1 focus:ring-[#006972]"
                      />
                    </div>

                    {searching && (
                      <p className="font-body text-[12px] text-slate-500 px-2 animate-pulse">
                        Searching platform members...
                      </p>
                    )}

                    {searchResults.length > 0 && (
                      <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white shadow-sm">
                        {searchResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            className="w-full p-2.5 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer border-none"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#006972]/10 text-[#006972] font-bold text-xs flex items-center justify-center shrink-0">
                              {(u.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-headline text-[13px] font-bold text-deep-navy truncate">
                                {u.full_name}
                              </p>
                              <p className="font-body text-[11px] text-slate-500 truncate">
                                {u.phone_number || u.email}
                              </p>
                            </div>
                            <Icon name="arrow_forward" size={14} className="text-slate-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Committee context banner if reporting within pool */}
              {committeeName && (
                <div className="p-2.5 rounded-xl bg-[#006972]/6 border border-[#006972]/15 flex items-center gap-2">
                  <Icon name="groups" size={16} className="text-[#006972] shrink-0" />
                  <span className="font-body text-[12px] text-deep-navy truncate">
                    Related Committee: <strong>{committeeName}</strong>
                  </span>
                </div>
              )}

              {/* Violation Category Selection */}
              <div>
                <label className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2">
                  Violation Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-rose-600 bg-rose-50/70 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-label text-[12px] font-bold text-deep-navy">
                            {cat.label}
                          </span>
                          <Icon
                            name={cat.icon}
                            size={18}
                            className={isSelected ? 'text-rose-600' : 'text-slate-400'}
                          />
                        </div>
                        <p className="font-body text-[11px] text-on-surface-variant leading-tight">
                          {cat.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Detailed Reason & Evidence Notes
                  </label>
                  <span
                    className={`font-mono text-[10px] ${
                      description.length < 20
                        ? 'text-rose-600 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {description.length}/3000 (min 20)
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={3000}
                  placeholder="Explain what happened. Mention specific dates, amounts, messages, or actions. Sanjhi staff and AI agent cross-reference ledger data..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-[13px] font-body text-deep-navy placeholder:text-slate-400 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 resize-none"
                />
              </div>

              {/* Optional Evidence URL */}
              <div>
                <label className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Evidence Link (Optional)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or image link"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-body text-[13px] text-deep-navy placeholder:text-slate-400 focus:outline-none focus:border-[#006972]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-label text-[13px] font-bold transition-all cursor-pointer border-none"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !category || description.trim().length < 20}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-label text-[13px] font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Icon name="hourglass_top" size={16} className="animate-pulse" />
                      <span>Filing Report...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="send" size={16} />
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
