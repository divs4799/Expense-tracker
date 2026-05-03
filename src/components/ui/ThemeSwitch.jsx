export function ThemeSwitch({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle theme"
      className="btn btn-ghost btn-sm btn-circle text-xl"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
