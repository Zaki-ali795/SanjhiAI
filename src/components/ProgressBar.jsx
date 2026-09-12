export default function ProgressBar({ current, total, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors ${
            i < current ? 'bg-secondary' : 'bg-surface-container-high'
          }`}
        />
      ))}
      <span className="font-label text-[12px] text-on-surface-variant ml-2">
        Step {current} of {total}
      </span>
    </div>
  );
}
