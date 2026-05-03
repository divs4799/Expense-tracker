export function Modal({ open, onClose, title, children }) {
  return (
    <div
      className={`modal modal-bottom ${open ? "modal-open" : ""}`}
      onClick={onClose}
    >
      <div
        className="modal-box rounded-t-2xl rounded-b-none w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
