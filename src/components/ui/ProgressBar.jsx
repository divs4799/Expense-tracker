export function ProgressBar({ pct, color }) {
  const clamped = Math.min(pct, 100);
  const isOver    = pct >= 100;
  const isWarning = pct >= 80 && pct < 100;

  // Use a custom color when not in an alert state (category color)
  if (color && !isOver && !isWarning) {
    return (
      <div className="w-full bg-base-300 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
    );
  }

  const cls = isOver ? "progress-error" : isWarning ? "progress-warning" : "progress-primary";
  return (
    <progress
      className={`progress ${cls} w-full h-1.5`}
      value={clamped}
      max={100}
    />
  );
}
