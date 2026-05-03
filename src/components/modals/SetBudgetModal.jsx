import { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Btn }   from "../ui/Btn";
import { monthKey } from "../../utils/helpers";

export function SetBudgetModal({ open, onClose, monthlyBudgets, onSave }) {
  const mk      = monthKey();
  const current = monthlyBudgets[mk] || "";
  const [val, setVal] = useState(String(current));

  useEffect(() => {
    if (open) setVal(String(monthlyBudgets[monthKey()] || ""));
  }, [open, monthlyBudgets]);

  const save = () => {
    const n = Number(val);
    if (!n || n <= 0) return;
    onSave(n);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Set Monthly Budget">
      <p className="text-sm text-base-content/60 mb-4 leading-relaxed">
        Set your total income / budget for{" "}
        <strong className="text-base-content">
          {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
        </strong>
        . This is separate from your category allocations.
      </p>
      <Input
        label="Total Monthly Budget (₹)"
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="e.g. 60000"
        autoFocus
      />
      <Btn onClick={save}>Save Budget</Btn>
    </Modal>
  );
}
