import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import { getComplaint } from '../../services/supportService';

/* ── Skeleton Bone ── */
function Bone({ className = '' }) {
  return <span className={`skeleton-bone inline-block ${className}`} />;
}

/* ── Helpers ── */
function statusColor(status) {
  if (['resolved', 'ai_resolved'].includes(status)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'needs_human_review') return 'bg-violet-50 text-violet-700 border-violet-200';
  if (status === 'dismissed') return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    try {
      setLoading(true);
      const data = await getComplaint(id);
      setComplaint(data?.complaint || data);
    } catch (err) {
      setError(err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  }

  const friendlySummary = complaint?.user_facing_summary || complaint?.resolution_notes;

  return (
    <AuthAmbientBackground showTicker={true}>
      <div className="w-full max-w-lg mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col items-center min-h-[calc(100vh-36px)]">

        {/* Main Glass Card */}
        <main className="w-full bg-white/85 backdrop-blur-2xl border border-[#006972]/20 shadow-[0_24px_70px_-15px_rgba(0,105,114,0.22),0_0_0_1px_rgba(0,105,114,0.1)] rounded-2xl sm:rounded-3xl p-5 sm:p-8 animate-fade-up relative z-10">

          {/* Header */}
          <header className="w-full flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/support/complaints')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/5 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-colors cursor-pointer active:scale-95"
            >
              <Icon name="arrow_back" size={20} />
            </button>
            <div className="flex-1">
              <h1 className="font-headline text-[18px] sm:text-[20px] font-bold text-deep-navy">Complaint Details</h1>
              <p className="font-mono text-[11px] text-on-surface-variant">#{id}</p>
            </div>
          </header>

          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              <div className="flex justify-between"><Bone className="w-28 h-5 rounded-full" /><Bone className="w-20 h-5 rounded-full" /></div>
              <Bone className="w-full h-4 rounded-lg" />
              <Bone className="w-5/6 h-4 rounded-lg" />
              <Bone className="w-full h-24 rounded-xl" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-body text-[13px] flex items-center gap-2">
              <Icon name="error" size={18} /> {error}
            </div>
          )}

          {/* Content */}
          {!loading && complaint && (
            <div className="space-y-5">
              {/* Status & Category Row */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`px-3 py-1 rounded-full font-label text-[11px] font-bold border ${statusColor(complaint.status)}`}>
                  {complaint.status?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
                <span className="px-3 py-1 rounded-full font-label text-[11px] font-bold bg-[#006972]/8 text-[#006972] border border-[#006972]/15">
                  {(complaint.category || 'other').replace(/_/g, ' ')}
                </span>
                {complaint.created_at && (
                  <span className="font-body text-[11px] text-on-surface-variant ml-auto">
                    {new Date(complaint.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Description */}
              <section className="p-4 rounded-xl bg-[#006972]/3 border border-[#006972]/8">
                <p className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Your Complaint</p>
                <p className="font-body text-[13px] text-deep-navy leading-relaxed">{complaint.description}</p>
              </section>

              {/* ─── Investigation Result ─── */}
              {friendlySummary ? (
                <section className={`p-5 rounded-xl border overflow-hidden ${
                  complaint.status === 'dismissed'
                    ? 'bg-slate-50/60 border-slate-200'
                    : ['resolved', 'ai_resolved'].includes(complaint.status)
                      ? 'bg-emerald-50/40 border-emerald-150'
                      : 'bg-[#006972]/3 border border-[#006972]/12'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      complaint.status === 'dismissed' ? 'bg-slate-100' : ['resolved', 'ai_resolved'].includes(complaint.status) ? 'bg-emerald-100' : 'bg-amber-100'
                    }`}>
                      <Icon name={
                        complaint.status === 'dismissed' ? 'cancel'
                          : ['resolved', 'ai_resolved'].includes(complaint.status) ? 'check_circle'
                          : 'hourglass_top'
                      } size={16} className={
                        complaint.status === 'dismissed' ? 'text-slate-500' : ['resolved', 'ai_resolved'].includes(complaint.status) ? 'text-emerald-600' : 'text-amber-600'
                      } />
                    </div>
                    <div>
                      <p className={`font-label text-[11px] font-bold uppercase tracking-wider ${
                        complaint.status === 'dismissed' ? 'text-slate-600' : ['resolved', 'ai_resolved'].includes(complaint.status) ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {complaint.status === 'dismissed' ? 'Complaint Dismissed' : ['resolved', 'ai_resolved'].includes(complaint.status) ? 'Resolved' : 'Under Review'}
                      </p>
                      {complaint.resolved_by_name && (
                        <p className="font-body text-[10px] text-on-surface-variant">
                          by {complaint.resolved_by_name} • {complaint.resolved_at ? new Date(complaint.resolved_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className={`font-body text-[14px] leading-relaxed ${
                    complaint.status === 'dismissed' ? 'text-slate-700' : ['resolved', 'ai_resolved'].includes(complaint.status) ? 'text-emerald-900' : 'text-deep-navy'
                  }`}>{friendlySummary}</p>
                </section>
              ) : (
                /* Investigation Pending */
                <section className="p-5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#006972]/8 flex items-center justify-center mx-auto mb-3">
                    <Icon name="hourglass_top" size={22} className="text-[#006972] animate-pulse" />
                  </div>
                  <p className="font-body text-[13px] text-on-surface-variant">
                    {['pending', 'open', 'needs_human_review'].includes(complaint.status)
                      ? 'Your complaint is being investigated. We\'ll update you as soon as a decision is made.'
                      : 'No details available for this complaint yet.'}
                  </p>
                </section>
              )}
            </div>
          )}
        </main>
      </div>

    </AuthAmbientBackground>
  );
}
