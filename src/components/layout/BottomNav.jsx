export function BottomNav({ tab, tabs, onTabChange }) {
  return (
    <div className="dock fixed bottom-0 left-0 right-0 z-50 bg-base-200 border-t border-base-300 shadow-[0_-2px_12px_rgba(0,0,0,.15)]">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className={tab === t.id ? "active" : ""}
        >
          <span className="text-[22px]">{t.icon}</span>
          <span className="dock-label text-[10px] font-bold tracking-wide">
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}
