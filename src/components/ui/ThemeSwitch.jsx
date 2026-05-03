import { Sun, Moon } from "lucide-react";

export function ThemeSwitch({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle theme"
      className="btn btn-ghost btn-sm btn-circle"
    >
      {dark ? <Sun size={20} className="text-warning" /> : <Moon size={20} className="text-primary" />}
    </button>
  );
}
