import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { memberService } from '../../services';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';

export default function JoinRequests() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true);
        const data = await memberService.getJoinRequests(id);
        setRequests(data.requests);
      } catch (err) {
        console.error('Failed to fetch requests:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, [id]);

  async function decide(memberId, action) {
    try {
      if (action === 'approved') {
        await memberService.approveJoinRequest(id, memberId);
      } else {
        await memberService.rejectJoinRequest(id, memberId);
      }
      setRequests((prev) => prev.filter((r) => r.id !== memberId));
    } catch (err) {
      console.error('Action failed:', err);
    }
  }

  return (
    <AuthAmbientBackground showTicker={false}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col min-h-[calc(100vh-36px)] gap-5">

        {/* Header */}
        <header className="w-full flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/60 hover:bg-white/80 text-[#006972] transition-colors cursor-pointer active:scale-95 backdrop-blur-md border border-[#006972]/15 shadow-sm"
          >
            <Icon name="arrow_back" size={20} />
          </button>
          <div className="text-center flex-1">
            <h1 className="font-headline text-[22px] sm:text-[24px] font-bold text-deep-navy tracking-tight">
              Join Requests
            </h1>
          </div>
          <div className="w-10" />
        </header>

        <p className="font-body text-[13px] text-on-surface-variant text-center -mt-2">
          Review pending requests to join the committee.
        </p>

        {/* Request Cards */}
        <main className="flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-16 font-body text-on-surface-variant">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#006972]/10">
                <Icon name="task_alt" size={30} className="text-[#006972]/50" />
              </div>
              <p className="font-body text-[15px] text-on-surface-variant">No pending requests!</p>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#006972]/15 shadow-md p-5 transition-all"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#006972]/20 flex-shrink-0 shadow-sm">
                    <img alt={req.full_name} src={req.profile_photo_url || '/avatar.svg'} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline text-[17px] font-bold text-deep-navy">{req.full_name}</h3>
                    <span className="inline-flex items-center gap-1.5 bg-[#006972]/10 text-[#006972] px-2.5 py-0.5 rounded-full font-label text-[11px] font-semibold mt-1">
                      <Icon name="verified_user" size={12} />
                      {Math.round(req.score)} • Trust Score
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => decide(req.id, 'approved')}
                    className="flex-1 bg-[#006972] hover:bg-[#00575f] text-white font-label text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    <Icon name="check" size={18} />
                    Approve
                  </button>
                  <button
                    onClick={() => decide(req.id, 'rejected')}
                    className="flex-1 border-2 border-red-200 text-red-500 hover:bg-red-50 font-label text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Icon name="close" size={18} />
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </main>

      </div>
    </AuthAmbientBackground>
  );
}
