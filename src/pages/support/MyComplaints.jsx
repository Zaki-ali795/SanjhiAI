import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import { getMyComplaints } from '../../services/supportService';

/* ── Skeleton Bone ── */
function Bone({ className = '' }) {
  return <span className={`skeleton-bone inline-block ${className}`} />;
}

/* ── Status Badge Colors ── */
function statusStyle(status) {
  switch (status) {
    case 'ai_resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'needs_human_review': return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'in_review': return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'dismissed': return 'bg-slate-100 text-slate-600 border-slate-200';
    default: return 'bg-amber-50 text-amber-800 border-amber-200';
  }
}

function statusLabel(status) {
  switch (status) {
    case 'ai_resolved': return 'AI Resolved';
    case 'needs_human_review': return 'Under Review';
    case 'pending': return 'Investigating';
    case 'in_review': return 'In Review';
    case 'resolved': return 'Resolved';
    case 'dismissed': return 'Dismissed';
    default: return status || 'Open';
  }
}

export default function MyComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadComplaints();
  }, []);

  async function loadComplaints() {
    try {
      setLoading(true);
      const data = await getMyComplaints();
      setComplaints(Array.isArray(data) ? data : data?.complaints || []);
    } catch (err) {
      setError(err.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = complaints.filter((c) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return ['pending', 'in_review', 'needs_human_review', 'ai_resolved'].includes(c.status);
    if (filter === 'RESOLVED') return c.status === 'resolved' || c.status === 'ai_resolved';
    return true;
  });

  return (
    <AuthAmbientBackground showTicker={true}>
      <div className="w-full max-w-lg mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col items-center min-h-[calc(100vh-36px)] pb-28 md:pb-12">

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
            <div className="flex-1">
              <h1 className="font-headline text-[20px] sm:text-[22px] font-bold text-deep-navy">My Complaints</h1>
              <p className="font-body text-[12px] text-on-surface-variant">Track AI investigations & resolutions</p>
            </div>
            <button
              onClick={() => navigate('/support/file-complaint')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006972] text-white hover:bg-[#00575f] transition-colors cursor-pointer active:scale-95 shadow-md"
              title="File new complaint"
            >
              <Icon name="add" size={20} />
            </button>
          </header>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4 no-scrollbar">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'RESOLVED', label: 'Resolved' },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-full font-label text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filter === tab.id
                    ? 'bg-[#006972] text-white shadow-sm'
                    : 'bg-white text-on-surface-variant border border-[#006972]/15 hover:border-[#006972]/35'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-white border border-[#006972]/8 space-y-3">
                  <div className="flex justify-between"><Bone className="w-24 h-4 rounded-full" /><Bone className="w-16 h-4 rounded-full" /></div>
                  <Bone className="w-full h-4 rounded-lg" />
                  <Bone className="w-3/4 h-3 rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-body text-[13px] flex items-center gap-2 mb-4">
              <Icon name="error" size={18} /> {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-[#006972]/5 flex items-center justify-center mx-auto mb-3 border border-[#006972]/10">
                <Icon name="inbox" size={28} className="text-on-surface-variant/40" />
              </div>
              <p className="font-body text-[14px] text-on-surface-variant">No complaints found</p>
              <p className="font-body text-[12px] text-on-surface-variant/60 mt-1">File a complaint and the AI agent will investigate it for you.</p>
            </div>
          )}

          {/* Complaint Cards */}
          {!loading && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((c) => (
                <button key={c.id} onClick={() => navigate(`/support/complaints/${c.id}`)}
                  className="w-full bg-white border border-[#006972]/10 rounded-xl p-4 text-left hover:border-[#006972]/30 hover:shadow-[0_4px_16px_rgba(0,105,114,0.08)] transition-all cursor-pointer group relative overflow-hidden"
                >
                  {/* Top accent bar for investigated cases */}
                  {c.user_facing_summary && (
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#006972] via-emerald-400 to-[#006972] opacity-60" />
                  )}

                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-[#006972]/5 px-2 py-0.5 rounded-md">
                      {(c.category || 'other').replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-label text-[10px] font-bold border ${statusStyle(c.status)}`}>
                      {statusLabel(c.status)}
                    </span>
                  </div>

                  <p className="font-body text-[13px] text-deep-navy line-clamp-2 leading-relaxed">
                    {c.user_facing_summary || c.description || 'No description'}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#006972]/6">
                    <span className="font-body text-[11px] text-on-surface-variant/60">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </span>

                    <span className="font-label text-[11px] font-bold text-[#006972] group-hover:underline flex items-center gap-0.5">
                      View <Icon name="arrow_forward" size={12} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

    </AuthAmbientBackground>
  );
}
