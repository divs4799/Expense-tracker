import { useState } from "react";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Btn }   from "../components/ui/Btn";
import { CAT_COLORS } from "../constants/categories";
import { monthKey, fmtCur, uid } from "../utils/helpers";
import { Plus, Pencil, Trash2 } from "lucide-react";

export function CategoriesView({ cats, expenses, onCatsChange }) {
  const mk       = monthKey();
  const monthExp = expenses[mk] || [];
  const [showAdd, setShowAdd] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm]       = useState({ name: "", icon: "💰", budget: "", color: CAT_COLORS[0] });

  const openAdd = () => {
    setForm({ name: "", icon: "💰", budget: "", color: CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)] });
    setEditCat(null);
    setShowAdd(true);
  };
  const openEdit = (cat) => {
    setForm({ name: cat.name, icon: cat.icon, budget: String(cat.budget), color: cat.color });
    setEditCat(cat);
    setShowAdd(true);
  };
  const save = () => {
    if (!form.name || !form.budget) return;
    if (editCat) onCatsChange(cats.map((c) => c.id === editCat.id ? { ...c, ...form, budget: Number(form.budget) } : c));
    else         onCatsChange([...cats, { id: uid(), ...form, budget: Number(form.budget) }]);
    setShowAdd(false);
  };
  const del = (id) => {
    if (window.confirm("Delete this category?")) onCatsChange(cats.filter((c) => c.id !== id));
  };

  return (
    <div className="px-4 pb-28">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Categories</h2>
        <button onClick={openAdd} className="btn btn-primary btn-sm gap-1">
          <Plus size={16} /> Add
        </button>
      </div>

      {cats.map((cat) => {
        const spent = monthExp.filter((e) => e.catId === cat.id).reduce((a, e) => a + e.amount, 0);
        return (
          <div
            key={cat.id}
            className="card bg-base-200 mb-3 shadow-sm border border-base-300 border-l-4"
            style={{ borderLeftColor: cat.color }}
          >
            <div className="card-body p-4 flex-row items-center gap-3">
              <span className="text-2xl">{cat.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-sm">{cat.name}</div>
                <div className="text-xs text-base-content/50">
                  Budget: {fmtCur(cat.budget)} · Spent: {fmtCur(spent)}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(cat)}
                  className="btn btn-ghost btn-xs btn-square"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => del(cat.id)}
                  className="btn btn-error btn-xs btn-square btn-outline"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add / Edit modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editCat ? "Edit Category" : "New Category"}>
        <Input label="Name"   value={form.name}   onChange={(e) => setForm((f) => ({ ...f, name:   e.target.value }))} placeholder="e.g. Groceries" />
        <Input label="Icon"   value={form.icon}   onChange={(e) => setForm((f) => ({ ...f, icon:   e.target.value }))} placeholder="💰" />
        <Input label="Monthly Budget (₹)" type="number" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} placeholder="5000" />

        {/* Color picker */}
        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-base-content/50 mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {CAT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className="w-8 h-8 rounded-full border-[3px] transition-all duration-150"
                style={{
                  background:   c,
                  borderColor:  form.color === c ? "oklch(var(--bc))" : "transparent",
                }}
              />
            ))}
          </div>
        </div>

        <Btn onClick={save}>{editCat ? "Save Changes" : "Add Category"}</Btn>
      </Modal>
    </div>
  );
}
