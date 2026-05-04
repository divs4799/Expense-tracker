import { useState } from "react";
import { monthKey, fmtCur } from "../utils/helpers";
import { Plus, Search, Inbox, Wallet, Pencil, Trash2 } from "lucide-react";
import { AddExpenseModal } from "../components/modals/AddExpenseModal";
import { ConfirmModal } from "../components/ui/ConfirmModal";

export function ExpensesView({ cats, expenses, onAdd, onEdit, onDelete }) {
  const mk       = monthKey();
  const monthExp = (expenses[mk] || []).slice().reverse();
  const [catFilter, setCatFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  const getDaysDiff = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(dateStr);
    expDate.setHours(0, 0, 0, 0);
    return Math.abs(today - expDate) / 86400000;
  };

  const filtered = monthExp.filter(
    (e) => (catFilter === "all" || e.catId === catFilter) && (userFilter === "all" || e.createdBy === userFilter)
  );

  // Extract unique users from expenses
  const users = Array.from(new Set(monthExp.map((e) => e.createdBy).filter(Boolean)));
  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="px-4 pb-28">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Expenses</h2>
        <button onClick={onAdd} className="btn btn-primary btn-sm gap-1">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Filter Options & Total */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm">
          <span className="opacity-60">Total:</span>{" "}
          <span className="font-extrabold text-primary">{fmtCur(totalFiltered)}</span>
        </div>
        {users.length > 0 && (
          <select
            className="select select-bordered select-xs w-auto bg-base-200"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="all">All Members</option>
            {users.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        )}
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {[{ id: "all", name: "All Cats", icon: <Search size={12} />, color: "var(--color-primary)" }, ...cats].map((c) => (
          <button
            key={c.id}
            onClick={() => setCatFilter(c.id)}
            className="btn btn-xs rounded-full flex-shrink-0 border transition-all duration-200 gap-1.5"
            style={{
              background:  catFilter === c.id ? (c.color || "var(--color-primary)") : "transparent",
              color:       catFilter === c.id ? "#fff" : undefined,
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
                    {exp.date} · {cat?.name} {exp.createdBy ? ` · By ${exp.createdBy}` : ""}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="text-error font-extrabold text-[15px]">
                    −{fmtCur(exp.amount)}
                  </div>
                  {getDaysDiff(exp.date) <= 10 && (
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => setEditingExpense(exp)}
                        className="btn btn-ghost btn-xs btn-square opacity-50 hover:opacity-100"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setExpenseToDelete(exp)}
                        className="btn btn-ghost btn-xs btn-square opacity-50 hover:opacity-100 text-error hover:bg-error/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Edit Modal */}
      <AddExpenseModal
        open={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        cats={cats}
        initialData={editingExpense}
        onAdd={(updated) => onEdit(editingExpense, updated)}
      />

      <ConfirmModal
        open={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => onDelete(expenseToDelete)}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
      />
    </div>
  );
}
