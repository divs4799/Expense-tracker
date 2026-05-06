import { ThemeSwitch } from "../ui/ThemeSwitch";
import { LogOut, Plus } from "lucide-react";

export function Header({ tab, tabs, dark, onToggleTheme, onAddExpense, onTestNotification, user, onLogout }) {
  const current = tabs.find((t) => t.id === tab);
  const initials = (user?.name || user?.email || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="navbar bg-base-200 border-b border-base-300 sticky top-0 z-50 shadow-sm px-4">
      {/* Left — app name + current page */}
      <div className="navbar-start flex-col items-start gap-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-base-content/40 leading-none">
          Budget Tracker
        </span>
        <span className="text-[18px] font-extrabold leading-tight flex items-center gap-2">
          {current?.icon} {current?.label}
        </span>
      </div>

      {/* Right — theme toggle, conditional add button, user avatar */}
      <div className="navbar-end gap-1">
        <ThemeSwitch dark={dark} onToggle={onToggleTheme} />

        {/* Hide add-expense button on the profile page */}
        {tab !== "profile" && (
          <>
            <button onClick={onTestNotification} className="btn btn-outline btn-xs gap-1 border-base-content/20 text-base-content/60 hover:text-base-content">
              Test
            </button>
            <button onClick={onAddExpense} className="btn btn-primary btn-sm shadow-md gap-1">
              <Plus size={16} /> Expense
            </button>
          </>
        )}

        {/* Avatar → dropdown with email + sign-out */}
        {user && (
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar placeholder ml-1"
            >
              <div className="bg-primary text-primary-content rounded-full w-8 text-xs font-bold flex items-center justify-center">
                {initials}
              </div>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu menu-sm bg-base-200 rounded-box border border-base-300 shadow-lg z-[60] mt-3 w-48 p-2"
            >
              <li className="menu-title px-3 py-1 text-xs text-base-content/50 truncate">
                {user.email}
              </li>
              <li>
                <button onClick={onLogout} className="text-error font-semibold flex items-center gap-2">
                  <LogOut size={16} /> Sign Out
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
