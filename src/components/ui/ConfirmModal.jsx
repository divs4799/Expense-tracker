import { Trash2 } from "lucide-react";

export function ConfirmModal({ open, onClose, onConfirm, title, message }) {
  return (
    <div className={`modal modal-bottom sm:modal-middle ${open ? 'modal-open' : ''}`}>
      <div className="modal-box border border-base-300 shadow-2xl">
        <h3 className="font-bold text-lg text-error flex items-center gap-2">
          <Trash2 size={20} />
          {title}
        </h3>
        <p className="py-4 text-sm opacity-70">
          {message}
        </p>
        <div className="modal-action">
          <button onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="btn btn-error btn-sm">
            Delete
          </button>
        </div>
      </div>
      <div className="modal-backdrop backdrop-blur-sm" onClick={onClose}></div>
    </div>
  );
}
