import Icon from './Icon';

export default function CommitteeCard({ name, subtitle, role, status, icon, iconBg, onClick }) {
  const roleColors = {
    organizer: 'text-secondary bg-secondary/10 border-secondary/20',
    member: 'text-tertiary bg-tertiary/10 border-tertiary/20',
  };

  return (
    <div
      onClick={onClick}
      className="bg-surface rounded-xl p-5 border border-outline-variant/40 shadow-[0_2px_16px_rgba(15,28,44,0.04)] hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full ${iconBg || 'bg-surface-container-highest'} flex items-center justify-center text-on-surface-variant`}>
            <Icon name={icon || 'groups'} size={22} />
          </div>
          <div>
            <h3 className="font-headline text-[17px] leading-[26px] font-medium text-on-surface group-hover:text-deep-navy transition-colors">
              {name}
            </h3>
            <p className="font-label text-[13px] text-on-surface-variant">{subtitle}</p>
          </div>
        </div>
        {role && (
          <span className={`font-label text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border ${roleColors[role] || roleColors.member}`}>
            {role}
          </span>
        )}
      </div>
      {status && (
        <div className="flex items-center justify-between border-t border-outline-variant/40 pt-3 mt-2">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Icon name={status.icon} size={18} />
            <span className="font-body text-[13px]">{status.text}</span>
          </div>
          <span className="font-label text-[13px] font-semibold text-deep-navy group-hover:underline underline-offset-4">
            {status.action}
          </span>
        </div>
      )}
    </div>
  );
}
