import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import AdminMobileNav from '../../components/AdminMobileNav';
import { getComplaints, resolveComplaint, dismissComplaint, reinvestigateComplaint } from '../../services/adminService';
import { suspendUser } from '../../services/adminService';
import { logout } from '../../services/authService';

const GLASS_CARD = 'bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_rgba(0,105,114,0.08)]';

/* ── Skeleton Helper ── */
function Bone({ className = '' }) {
  return <div className={`skeleton-bone ${className}`} />;
}

export default function AdminDisputes() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, OPEN, RESOLVED, DISMISSED
  const [searchQuery, setSearchQuery] = useState('');

  /* Selected Dispute Modal State */
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      // ignore
    } finally {
      navigate('/login');
    }
  }

  async function loadComplaintsData() {
    try {
      setLoading(true);
      setLoadError('');
      const data = await getComplaints({ search: searchQuery });
      const list = data?.complaints || data || [];

      setComplaints(list);
    } catch (err) {
      setLoadError(err.message || 'Failed to load complaints queue.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaintsData();
  }, []);

  /* Filter Complaints */
  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === 'USER_REPORTS') return !!c.accused_user_id;
    if (activeTab === 'OPEN') return c.status === 'open' || c.status === 'pending' || c.status === 'in_review' || c.status === 'needs_human_review';
    if (activeTab === 'RESOLVED') return c.status === 'resolved' || c.status === 'ai_resolved';
    if (activeTab === 'DISMISSED') return c.status === 'dismissed';

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (c.complainant_name || '').toLowerCase().includes(q) ||
        (c.committee_name || '').toLowerCase().includes(q) ||
        (c.accused_name || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.id || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  function openDispute(c) {
    setSelectedDispute(c);
    setResolutionNotes(c.resolution_notes || c.user_facing_summary || '');
  }

  async function handleResolve(actionType) {
    if (!selectedDispute || processingAction) return;
    setProcessingAction(true);
    try {
      if (actionType === 'resolve') {
        await resolveComplaint(selectedDispute.id, { notes: resolutionNotes });
        showToast(`Dispute #${selectedDispute.id} resolved successfully!`);
      } else {
        await dismissComplaint(selectedDispute.id, { notes: resolutionNotes });
        showToast(`Dispute #${selectedDispute.id} dismissed.`);
      }

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === selectedDispute.id
            ? { ...c, status: actionType === 'resolve' ? 'resolved' : 'dismissed', resolution_notes: resolutionNotes }
            : c
        )
      );
      setSelectedDispute(null);
      setResolutionNotes('');
    } catch (err) {
      showToast(err.message || 'Failed to process dispute.');
    } finally {
      setProcessingAction(false);
    }
  }

  const adminNavItems = [
    { label: 'Overview', icon: 'dashboard', path: '/admin' },
    { label: 'Analytics', icon: 'bar_chart', path: '/admin/analytics' },
    { label: 'Users', icon: 'group', path: '/admin/users' },
    { label: 'Committees', icon: 'groups', path: '/admin/committees' },
    { label: 'Disputes', icon: 'gavel', path: '/admin/disputes' },
    { label: 'CNIC Verification', icon: 'badge', path: '/admin/cnic-verification' },
    { label: 'Broadcasts', icon: 'campaign', path: '/admin/announcements' },
    { label: 'Audit Log', icon: 'history', path: '/admin/activity' },
    { label: 'Settings', icon: 'settings', path: '/admin/settings' },
  ];

  return (
    <AuthAmbientBackground showTicker={false}>
      <div className="min-h-screen flex flex-col md:flex-row w-full max-w-7xl mx-auto">

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col gap-6 p-5 my-6 ml-4 bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(0,105,114,0.12)]">
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#006972] to-[#004f56] text-white flex items-center justify-center font-bold font-headline text-[16px] shadow-md">
              SA
            </div>
            <div>
              <h2 className="font-headline text-[15px] font-bold text-deep-navy leading-tight">Sanjhi Admin</h2>
              <p className="font-label text-[10px] text-[#006972] font-semibold">Disputes Triage</p>
            </div>
          </div>

          <hr className="border-slate-200/60" />

          <nav className="flex flex-col gap-1">
            {adminNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-label text-[13px] font-bold transition-all cursor-pointer border-none text-left ${
                    isActive
                      ? 'bg-[#006972] text-white shadow-md shadow-[#006972]/20'
                      : 'text-deep-navy/70 hover:bg-white/80 hover:text-deep-navy'
                  }`}
                >
                  <Icon name={item.icon} size={20} className={isActive ? 'text-white' : 'text-[#006972]'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-slate-200/60">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-label text-[12px] font-bold transition-all cursor-pointer border border-rose-200/80 shadow-sm"
            >
              <Icon name="logout" size={16} />
              <span>Logout Staff Account</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-6 min-w-0 pb-28 md:pb-12">

          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shadow-sm">
                  <Icon name="gavel" size={20} />
                </span>
                <h1 className="font-headline text-[22px] sm:text-[26px] font-bold text-deep-navy">
                  Disputes & Triage Center
                </h1>
              </div>
              <p className="font-label text-[11px] sm:text-[12px] text-on-surface-variant font-medium mt-1">
                Investigate payout delays, rejected payment receipts, and participant complaints
              </p>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#006972]">
                <Icon name="search" size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dispute #, member, pool..."
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 text-deep-navy font-body text-[13px] placeholder:text-slate-400 outline-none focus:border-[#006972] focus:bg-white transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
          </header>

          {/* Filter Chips */}
          <section className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Complaints', count: complaints.length, icon: 'gavel' },
              { id: 'USER_REPORTS', label: 'User Reports', count: complaints.filter((c) => c.accused_user_id).length, icon: 'flag' },
              { id: 'OPEN', label: 'Open Triage', count: complaints.filter((c) => c.status !== 'resolved' && c.status !== 'dismissed').length, icon: 'pending_actions' },
              { id: 'RESOLVED', label: 'Resolved', count: complaints.filter((c) => c.status === 'resolved').length, icon: 'check_circle' },
              { id: 'DISMISSED', label: 'Dismissed', count: complaints.filter((c) => c.status === 'dismissed').length, icon: 'cancel' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full font-label text-[12px] font-bold transition-all cursor-pointer border shrink-0 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-[#006972] text-white border-[#006972] shadow-md shadow-[#006972]/20'
                    : 'bg-white/60 hover:bg-white text-deep-navy/70 border-white/80'
                }`}
              >
                <Icon name={tab.icon} size={14} />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </section>

          {loading ? (
            <div className="space-y-3 w-full">
              {[1, 2, 3, 4].map((i) => (
                <Bone key={i} className="w-full h-32 rounded-3xl" />
              ))}
            </div>
          ) : loadError ? (
            <div className={`${GLASS_CARD} rounded-3xl p-8 text-center space-y-3`}>
              <div className="w-14 h-14 rounded-3xl bg-rose-50/90 text-rose-600 flex items-center justify-center mx-auto border border-rose-200/80 shadow-sm">
                <Icon name="error" size={28} />
              </div>
              <h2 className="font-headline text-[18px] font-bold text-deep-navy">Couldn't load disputes queue</h2>
              <p className="font-body text-[13px] text-on-surface-variant max-w-xs mx-auto">{loadError}</p>
              <button
                onClick={loadComplaintsData}
                className="px-6 py-2.5 rounded-2xl bg-[#006972] text-white font-label text-[13px] font-bold cursor-pointer border-none shadow-md"
              >
                Retry
              </button>
            </div>
          ) : (
            /* Disputes List */
            <section className="space-y-3">
              {filteredComplaints.length === 0 ? (
                <div className={`${GLASS_CARD} rounded-3xl py-12 text-center space-y-2`}>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Icon name="task_alt" size={24} />
                  </div>
                  <p className="font-headline text-[16px] font-bold text-deep-navy">No complaints found</p>
                  <p className="font-body text-[12px] text-on-surface-variant">Try selecting a different filter tab or clearing search.</p>
                </div>
              ) : (
                filteredComplaints.map((c) => {
                  const isResolved = c.status === 'resolved';
                  const isDismissed = c.status === 'dismissed';

                  return (
                    <div
                      key={c.id}
                      onClick={() => openDispute(c)}
                      className={`${GLASS_CARD} rounded-3xl p-5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-[0_12px_40px_rgba(0,105,114,0.14)] hover:-translate-y-0.5 cursor-pointer border border-white/90`}
                    >
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#006972] bg-[#006972]/10 px-2.5 py-0.5 rounded-lg border border-[#006972]/20">
                            {c.id || '—'}
                          </span>

                          {/* User Report Badge */}
                          {c.accused_user_id && (
                            <span className="px-2.5 py-0.5 rounded-full font-label text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                              <Icon name="flag" size={10} /> User Report
                            </span>
                          )}

                          <span className={`px-2.5 py-0.5 rounded-full font-label text-[10px] font-bold uppercase tracking-wider border ${
                            c.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : c.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-900 border-amber-200'
                              : 'bg-[#006972]/10 text-[#006972] border-[#006972]/20'
                          }`}>
                            {c.priority || 'MEDIUM'} Priority
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-full font-label text-[10px] font-bold uppercase border ${
                            isResolved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isDismissed
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {c.status || 'Open Triage'}
                          </span>

                          {/* AI Agent Badge */}
                          {c.ai_case_file?.judge_assessment && (
                            <span className={`px-2 py-0.5 rounded-full font-label text-[10px] font-bold border flex items-center gap-1 ${
                              c.ai_case_file.judge_assessment.confidence_score >= 0.85 && c.ai_case_file.judge_assessment.judge_satisfied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-violet-50 text-violet-700 border-violet-200'
                            }`}>
                              <Icon name="auto_awesome" size={10} />
                              {Math.round((c.ai_case_file.judge_assessment.confidence_score ?? 0) * 100)}%
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-headline text-[16px] font-bold text-deep-navy">
                            {c.complainant_name || 'Unknown'}
                            {c.accused_name && (
                              <span className="text-rose-700 font-semibold"> → {c.accused_name}</span>
                            )}
                            {!c.accused_name && <span className="text-[#006972] font-semibold"> — {c.committee_name || 'Unknown Pool'}</span>}
                          </h3>
                          <p className="font-body text-[13px] text-on-surface-variant mt-1 line-clamp-2">
                            {c.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDispute(c);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#006972] to-[#007a82] hover:from-[#00575f] hover:to-[#006972] text-white font-label text-[12px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border-none shadow-sm"
                        >
                          <span>Triage Case</span>
                          <Icon name="arrow_forward" size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          )}
        </main>
      </div>

      {/* ── DISPUTE INSPECTION & RESOLUTION MODAL ── */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-deep-navy/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className={`${GLASS_CARD} rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 relative`}>
            <button
              onClick={() => setSelectedDispute(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center border-none cursor-pointer"
            >
              <Icon name="close" size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-md">
                <Icon name="gavel" size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-[#006972]">{selectedDispute.id}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-label text-[10px] font-bold uppercase">
                    {selectedDispute.priority || 'N/A'} Priority
                  </span>
                </div>
                <h3 className="font-headline text-[17px] font-bold text-deep-navy mt-0.5">{selectedDispute.complainant_name}</h3>
              </div>
            </div>

            {/* AI Case File Section */}
            {selectedDispute.ai_case_file ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#006972]/5 to-[#f7d679]/5 border border-[#006972]/15 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-label text-[10px] uppercase font-bold text-[#006972] flex items-center gap-1.5">
                    <Icon name="auto_awesome" size={14} /> AI Case-Builder Report
                  </p>
                  {selectedDispute.ai_case_file.judge_assessment && (
                    <span className={`px-2.5 py-1 rounded-full font-label text-[10px] font-bold ${
                      (selectedDispute.ai_case_file.judge_assessment.confidence_score ?? 0) >= 0.85 && selectedDispute.ai_case_file.judge_assessment.judge_satisfied
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {((selectedDispute.ai_case_file.judge_assessment.confidence_score ?? 0) * 100).toFixed(0)}% — {selectedDispute.ai_case_file.judge_assessment.routing_decision}
                    </span>
                  )}
                </div>

                {/* Investigator Report */}
                {selectedDispute.ai_case_file.case_summary && (
                  <div className="space-y-2">
                    <p className="font-body text-[13px] text-deep-navy leading-relaxed">
                      {selectedDispute.ai_case_file.case_summary}
                    </p>

                    {/* Contradictions */}
                    {(selectedDispute.ai_case_file.contradictions || []).length > 0 && (
                      <div className="space-y-1.5">
                        <p className="font-label text-[10px] uppercase font-bold text-rose-700">Contradictions Found</p>
                        {selectedDispute.ai_case_file.contradictions.map((c, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[12px] font-body text-rose-900">
                            {typeof c === 'string' ? c : `${c.claim} → ${c.fact}`}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Evidence Trail */}
                    {(selectedDispute.ai_case_file.evidence_trail || []).length > 0 && (
                      <div className="space-y-1.5">
                        <p className="font-label text-[10px] uppercase font-bold text-[#006972]">Evidence Trail ({selectedDispute.ai_case_file.evidence_trail.length} items)</p>
                        {selectedDispute.ai_case_file.evidence_trail.map((ev, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-[#006972]/5 border border-[#006972]/10 text-[12px] font-body text-deep-navy">
                            <span className="font-bold text-[#006972]">[{ev.type}]</span> {ev.description}
                            {ev.relevance && <p className="text-on-surface-variant text-[11px] mt-0.5 italic">{ev.relevance}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reasoning */}
                    {selectedDispute.ai_case_file.reasoning && (
                      <div className="space-y-1">
                        <p className="font-label text-[10px] uppercase font-bold text-on-surface-variant">Agent Reasoning</p>
                        <p className="font-body text-[12px] text-deep-navy leading-relaxed">{selectedDispute.ai_case_file.reasoning}</p>
                      </div>
                    )}

                    {/* Recommendation */}
                    {selectedDispute.ai_case_file.recommended_action && (
                      <div className="flex items-center gap-2 pt-1">
                        <p className="font-label text-[10px] uppercase font-bold text-on-surface-variant">Recommendation:</p>
                        <span className="px-2 py-0.5 rounded-lg bg-[#006972]/10 text-[#006972] font-label text-[11px] font-bold">
                          {selectedDispute.ai_case_file.recommended_action.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg font-label text-[10px] font-bold ${
                          selectedDispute.ai_case_file.recommended_priority === 'urgent' ? 'bg-rose-100 text-rose-800'
                            : selectedDispute.ai_case_file.recommended_priority === 'high' ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {(selectedDispute.ai_case_file.recommended_priority || 'medium').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Judge Assessment Details */}
                {selectedDispute.ai_case_file.judge_assessment?.concerns?.length > 0 && (
                  <div className="pt-2 border-t border-[#006972]/10">
                    <p className="font-label text-[10px] uppercase font-bold text-amber-800">Judge Concerns</p>
                    {selectedDispute.ai_case_file.judge_assessment.concerns.map((concern, i) => (
                      <p key={i} className="font-body text-[12px] text-amber-900 mt-1">• {concern}</p>
                    ))}
                  </div>
                )}

                {/* Reinvestigate Button */}
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      try {
                        await reinvestigateComplaint(selectedDispute.id);
                        showToast('Agent re-investigation started. Check back in ~30 seconds.');
                        setSelectedDispute(null);
                        setTimeout(() => loadComplaintsData(), 35000);
                      } catch (err) {
                        showToast(err.message || 'Reinvestigation failed.');
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#006972]/10 hover:bg-[#006972]/20 text-[#006972] font-label text-[11px] font-bold transition-all cursor-pointer border border-[#006972]/20 flex items-center justify-center gap-1.5"
                  >
                    <Icon name="refresh" size={14} /> Re-investigate with AI Agent
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <Icon name="hourglass_top" size={18} className="text-slate-400 animate-pulse" />
                  <p className="font-body text-[12px] text-slate-500">
                    {['pending', 'open'].includes(selectedDispute.status)
                      ? 'AI Agent investigation pending or failed.'
                      : 'No AI case file generated for this complaint.'}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await reinvestigateComplaint(selectedDispute.id);
                      showToast('AI Agent investigation started. Check back in ~30 seconds.');
                      setSelectedDispute(null);
                      setTimeout(() => loadComplaintsData(), 35000);
                    } catch (err) {
                      showToast(err.message || 'Failed to start investigation.');
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#006972] text-white font-label text-[11px] font-bold transition-all cursor-pointer hover:bg-[#00575f] flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Icon name="play_arrow" size={16} /> Run AI Investigation
                </button>
              </div>
            )}

            {/* Accused User Card (for User Reports) */}
            {selectedDispute.accused_user_id && (
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-3">
                <p className="font-label text-[10px] uppercase font-bold text-rose-700 flex items-center gap-1.5">
                  <Icon name="flag" size={13} /> Reported User
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold font-headline text-[16px] shrink-0">
                    {(selectedDispute.accused_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label text-[14px] font-bold text-deep-navy">{selectedDispute.accused_name || 'Unknown User'}</p>
                    {selectedDispute.accused_email && (
                      <p className="font-body text-[12px] text-on-surface-variant">{selectedDispute.accused_email}</p>
                    )}
                    {selectedDispute.accused_phone && (
                      <p className="font-body text-[12px] text-on-surface-variant">{selectedDispute.accused_phone}</p>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-label text-[10px] font-bold uppercase border ${
                    selectedDispute.accused_is_suspended
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {selectedDispute.accused_is_suspended ? 'Suspended' : 'Active'}
                  </span>
                </div>
                {!selectedDispute.accused_is_suspended && (
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Suspend ${selectedDispute.accused_name}?`)) return;
                      setProcessingAction(true);
                      try {
                        await suspendUser(selectedDispute.accused_user_id, { notes: `Suspended via dispute #${selectedDispute.id}` });
                        showToast(`${selectedDispute.accused_name} has been suspended.`);
                        setSelectedDispute((prev) => ({ ...prev, accused_is_suspended: true }));
                      } catch (err) {
                        showToast(err.message || 'Failed to suspend user.');
                      } finally {
                        setProcessingAction(false);
                      }
                    }}
                    disabled={processingAction}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-label text-[12px] font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Icon name="block" size={16} /> Suspend Accused User
                  </button>
                )}
              </div>
            )}

            {/* Dispute Description */}
            <div className="p-4 rounded-2xl bg-white/80 border border-white/90 space-y-2">
              <p className="font-label text-[10px] uppercase font-bold text-on-surface-variant">Committee Pool</p>
              <p className="font-headline text-[14px] font-bold text-deep-navy">{selectedDispute.committee_name || 'Unknown'}</p>

              <hr className="border-slate-100 my-2" />

              <p className="font-label text-[10px] uppercase font-bold text-on-surface-variant">Dispute Description</p>
              <p className="font-body text-[13px] text-deep-navy leading-relaxed">
                {selectedDispute.description || 'No description provided.'}
              </p>
            </div>

            {/* Resolution Form */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block font-label text-[11px] font-bold text-deep-navy">
                Staff Resolution / Action Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter investigation details or resolution instructions..."
                rows={3}
                className="w-full p-3 rounded-2xl bg-white/80 border border-slate-200 font-body text-[13px] text-deep-navy outline-none focus:border-[#006972]"
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleResolve('dismiss')}
                  disabled={processingAction}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-label text-[12px] font-bold border-none cursor-pointer"
                >
                  Dismiss Case
                </button>
                <button
                  onClick={() => handleResolve('resolve')}
                  disabled={processingAction}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#006972] to-[#007a82] hover:from-[#00575f] hover:to-[#006972] text-white font-label text-[12px] font-bold transition-all cursor-pointer border-none shadow-md"
                >
                  {processingAction ? 'Processing...' : 'Mark Resolved'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-4 left-4 sm:left-auto sm:right-5 sm:w-80 z-50 px-4 py-3 rounded-2xl shadow-2xl font-label text-[13px] font-bold flex items-center gap-2.5 border border-white/20 bg-[#006972] text-white">
          <Icon name="check_circle" size={18} className="shrink-0 text-emerald-300" />
          <span className="flex-1">{toastMessage}</span>
        </div>
      )}

      {/* Floating Glass Bottom Navbar for Mobile */}
      <AdminMobileNav />
    </AuthAmbientBackground>
  );
}
