import { useState } from "react";
import { monthKey, fmtCur } from "../utils/helpers";
import { Plus, Search, Inbox, Wallet } from "lucide-react";

export function ExpensesView({ cats, expenses, onAdd }) {
  const mk       = monthKey();
  const monthExp = (expenses[mk] || []).slice().reverse();
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? monthExp : monthExp.filter((e) => e.catId === filter);

  return (
    <div className="px-4 pb-28">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Expenses</h2>
        <button onClick={onAdd} className="btn btn-primary btn-sm gap-1">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {[{ id: "all", name: "All", icon: <Search size={12} />, color: "var(--color-primary)" }, ...cats].map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className="btn btn-xs rounded-full flex-shrink-0 border transition-all duration-200 gap-1.5"
            style={{
              background:  filter === c.id ? (c.color || "var(--color-primary)") : "transparent",
              color:       filter === c.id ? "#fff" : undefined,
              borderColor: c.color || "var(--color-primary)",
            }}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-base-200/50 rounded-3xl border-2 border-dashed border-base-300">
          <div className="flex justify-center mb-4 text-base-content/20"><Inbox size={48} /></div>
          <div className="font-bold text-base-content/40">No expenses yet</div>
          <div className="text-xs text-base-content/30 mt-1">Tap the plus button to add one</div>
        </div>
      ) : (
        filtered.map((exp) => {
          const cat = cats.find((c) => c.id === exp.catId);
          return (
            <div
              key={exp.id}
              className="card bg-base-200 mb-3 shadow-sm border border-base-300"
            >
              <div className="card-body p-4 flex-row items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ 
                    background: (cat?.color || "var(--color-primary)") + "22",
                    color: cat?.color || "var(--color-primary)"
                  }}
                >
                  {cat?.icon || <Wallet size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{exp.note || cat?.name || "Expense"}</div>
                  <div className="text-xs text-base-content/50 mt-0.5">
                    {exp.date} · {cat?.name}
                  </div>
                </div>
                <div className="text-error font-extrabold text-[15px] flex-shrink-0">
                  −{fmtCur(exp.amount)}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
