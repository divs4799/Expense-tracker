import { ProgressBar } from "../components/ui/ProgressBar";
import { monthKey, fmtCur } from "../utils/helpers";

export function Dashboard({ cats, expenses, monthlyBudgets, onNav, onSetBudget }) {
  const mk             = monthKey();
  const monthExp       = expenses[mk] || [];
  const monthlyBudget  = monthlyBudgets[mk] || 0;
  const totalCatBudget = cats.reduce((s, c) => s + c.budget, 0);
  const totalSpent     = monthExp.reduce((s, e) => s + e.amount, 0);
  const overallBudget  = monthlyBudget || totalCatBudget;
  const totalRemaining = overallBudget - totalSpent;
  const overallPct     = overallBudget ? (totalSpent / overallBudget) * 100 : 0;
  const unallocated    = monthlyBudget ? monthlyBudget - totalCatBudget : 0;

  const overBudgetCats = cats.filter((c) => {
    const sp = monthExp.filter((e) => e.catId === c.id).reduce((a, e) => a + e.amount, 0);
    return sp > c.budget;
  });

  const quickStats = [
    { label: "Categories", val: cats.length,                                                                                       icon: "📁", cls: "text-primary"   },
    { label: "Expenses",   val: monthExp.length,                                                                                   icon: "📝", cls: "text-secondary" },
    { label: "Avg / Day",  val: fmtCur(Math.round(totalSpent / Math.max(1, new Date().getDate()))),                               icon: "📅", cls: "text-warning"   },
    { label: "Days Left",  val: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate(), icon: "⏳", cls: "text-accent"    },
  ];

  return (
    <div className="px-4 pb-28">

      {/* ── Hero card ── */}
      <div
        className="rounded-2xl p-5 mb-4 relative overflow-hidden text-white shadow-xl"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)" }}
      >
        {/* decorative circles */}
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute right-12 -bottom-6 w-20 h-20 rounded-full bg-white/[.07] pointer-events-none" />

        <div className="flex justify-between items-start mb-3 relative">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">
            {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={onSetBudget}
            className="btn btn-xs btn-ghost border border-white/40 text-white hover:bg-white/20 backdrop-blur-sm"
          >
            ✏️ Set Budget
          </button>
        </div>

        <div className="text-4xl font-extrabold tracking-tight mb-1">{fmtCur(totalRemaining)}</div>
        <div className="text-sm text-white/70 mb-4">
          remaining of <strong className="text-white">{fmtCur(overallBudget)}</strong>
          {monthlyBudget > 0 && <span className="opacity-60"> (monthly budget)</span>}
        </div>

        {/* hero progress */}
        <div className="w-full bg-white/25 rounded-full h-1.5 overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(overallPct, 100)}%`,
              background: overallPct >= 100 ? "#ff6b6b" : overallPct >= 80 ? "#ffd166" : "rgba(255,255,255,.9)",
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/60">
          <span>Spent: {fmtCur(totalSpent)}</span>
          <span>{Math.round(overallPct)}% used</span>
        </div>
      </div>

      {/* ── Unallocated notice ── */}
      {monthlyBudget > 0 && unallocated !== 0 && (
        <div role="alert" className={`alert ${unallocated < 0 ? "alert-error" : "alert-info"} mb-3 py-3`}>
          <span>{unallocated < 0 ? "⚠️" : "💡"}</span>
          <div>
            <div className="font-bold text-sm">
              {unallocated < 0 ? "Category budgets exceed monthly budget!" : `${fmtCur(unallocated)} unallocated`}
            </div>
            <div className="text-xs opacity-80">
              {unallocated < 0
                ? `Categories total ${fmtCur(totalCatBudget)} vs ${fmtCur(monthlyBudget)} monthly`
                : "Budget not yet assigned to any category"}
            </div>
          </div>
        </div>
      )}

      {/* ── Over-budget alert ── */}
      {overBudgetCats.length > 0 && (
        <div role="alert" className="alert alert-error mb-3 py-3">
          <span>🚨</span>
          <span className="font-bold text-sm">
            Over budget: {overBudgetCats.map((c) => c.name).join(", ")}
          </span>
        </div>
      )}

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {quickStats.map((s) => (
          <div key={s.label} className="card bg-base-200 shadow-sm border border-base-300">
            <div className="card-body p-4 gap-1">
              <div className="text-xl">{s.icon}</div>
              <div className={`text-xl font-extrabold ${s.cls}`}>{s.val}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-base-content/40">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Category list ── */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-bold">Categories</h2>
        <button onClick={() => onNav("categories")} className="btn btn-ghost btn-xs text-primary">
          Manage →
        </button>
      </div>

      {cats.map((cat) => {
        const spent     = monthExp.filter((e) => e.catId === cat.id).reduce((a, e) => a + e.amount, 0);
        const remaining = cat.budget - spent;
        const pct       = cat.budget ? (spent / cat.budget) * 100 : 0;
        return (
          <div
            key={cat.id}
            className="card bg-base-200 mb-3 shadow-sm border border-base-300 border-l-4"
            style={{ borderLeftColor: cat.color }}
          >
            <div className="card-body p-4 gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-semibold text-sm">{cat.name}</span>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-sm ${remaining < 0 ? "text-error" : "text-success"}`}>
                    {fmtCur(Math.abs(remaining))}{remaining < 0 ? " over" : " left"}
                  </div>
                  <div className="text-xs text-base-content/50">
                    {fmtCur(spent)} / {fmtCur(cat.budget)}
                  </div>
                </div>
              </div>
              <ProgressBar pct={pct} color={cat.color} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
