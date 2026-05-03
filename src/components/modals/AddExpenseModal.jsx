import { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Btn }   from "../ui/Btn";
import { today, uid } from "../../utils/helpers";

export function AddExpenseModal({ open, onClose, cats, onAdd }) {
  const [form, setForm] = useState({
    catId: cats[0]?.id || "", amount: "", note: "", date: today(),
  });

  useEffect(() => {
    if (open) setForm((f) => ({ ...f, catId: cats[0]?.id || "", date: today() }));
  }, [open, cats]);

  const submit = () => {
    if (!form.catId || !form.amount) return;
    onAdd({ id: uid(), catId: form.catId, amount: Number(form.amount), note: form.note, date: form.date });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Expense">
      {/* Category picker */}
      <div className="mb-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-base-content/50 mb-2">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setForm((f) => ({ ...f, catId: c.id }))}
              className="btn btn-xs rounded-full border transition-all duration-200"
              style={{
                background: form.catId === c.id ? c.color : "transparent",
                color:      form.catId === c.id ? "#fff"  : undefined,
                borderColor: c.color,
              }}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      <Input label="Amount (₹)"     type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="300" />
      <Input label="Note (optional)"               value={form.note}   onChange={(e) => setForm((f) => ({ ...f, note:   e.target.value }))} placeholder="Vegetables, fuel top-up…" />
      <Input label="Date"            type="date"  value={form.date}   onChange={(e) => setForm((f) => ({ ...f, date:   e.target.value }))} />
      <Btn onClick={submit}>Add Expense</Btn>
    </Modal>
  );
}
