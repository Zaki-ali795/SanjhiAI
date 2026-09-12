import Icon from './Icon';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utilities/calendarHelper';

export default function AddToCalendarModal({
  isOpen,
  onClose,
  title = 'Sanjhi Committee Payment Due',
  description = 'Payment due for Sanjhi ROSCA committee. Pay on Sanjhi AI to maintain your Trust Score.',
  startDate = new Date(),
  endDate = null,
  committeeName = '',
  amount = 0,
}) {
  if (!isOpen) return null;

  const displayTitle = committeeName ? `Sanjhi Payment: ${committeeName}` : title;
  const amountStr = amount ? `Rs. ${Number(amount).toLocaleString('en-PK')}` : '';
  const displayDesc = `${description} ${amountStr ? `Amount: ${amountStr}` : ''}`;

  const googleUrl = getGoogleCalendarUrl({
    title: displayTitle,
    description: displayDesc,
    startDate,
    endDate,
  });

  const handleDownloadIcs = () => {
    downloadIcsFile({
      title: displayTitle,
      description: displayDesc,
      startDate,
      endDate,
      filename: `sanjhi-${(committeeName || 'payment').toLowerCase().replace(/\s+/g, '-')}-reminder.ics`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-[#006972]/15 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center border-none cursor-pointer"
        >
          <Icon name="close" size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#006972]/10 text-[#006972] flex items-center justify-center shrink-0">
            <Icon name="calendar_month" size={24} />
          </div>
          <div>
            <h3 className="font-headline text-[18px] font-bold text-deep-navy">Add Payment Reminder</h3>
            <p className="font-body text-[12px] text-on-surface-variant">Sync due dates with your personal calendar</p>
          </div>
        </div>

        {/* Event Preview Card */}
        <div className="p-4 rounded-2xl bg-[#006972]/5 border border-[#006972]/15 space-y-1.5">
          <p className="font-label text-[10px] uppercase font-bold text-[#006972] tracking-wider">Reminder Preview</p>
          <p className="font-headline text-[15px] font-bold text-deep-navy">{displayTitle}</p>
          {startDate && (
            <p className="font-body text-[13px] text-slate-600 flex items-center gap-1.5">
              <Icon name="event" size={14} className="text-[#006972]" />
              Due Date: {new Date(startDate).toLocaleDateString('en-PK', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          )}
          {amountStr && (
            <p className="font-body text-[13px] font-bold text-[#006972] flex items-center gap-1.5">
              <Icon name="payments" size={14} />
              Amount: {amountStr}
            </p>
          )}
        </div>

        {/* Calendar Options */}
        <div className="space-y-3">
          {/* Option 1: Google Calendar */}
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#006972] to-[#007a82] hover:from-[#00575f] hover:to-[#006972] text-white font-label text-[13px] font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2.5 no-underline active:scale-[0.98]"
          >
            <Icon name="launch" size={18} />
            <span>Open in Google Calendar</span>
          </a>

          {/* Option 2: Apple Calendar / Outlook (.ics) */}
          <button
            type="button"
            onClick={() => {
              handleDownloadIcs();
              onClose();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-deep-navy font-label text-[13px] font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-2.5 active:scale-[0.98]"
          >
            <Icon name="download" size={18} className="text-[#006972]" />
            <span>Download Apple / Outlook .ics File</span>
          </button>
        </div>

        {/* Footer Note */}
        <p className="font-body text-[11px] text-center text-on-surface-variant/70">
          Reminders will automatically alert you 1 day before & on the due date.
        </p>
      </div>
    </div>
  );
}
