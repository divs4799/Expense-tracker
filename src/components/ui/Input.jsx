export function Input({ label, className = "", ...props }) {
  return (
    <div className="mb-3">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-base-content/50 mb-1">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`input input-bordered bg-base-200 w-full ${className}`}
      />
    </div>
  );
}
