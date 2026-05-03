export function Btn({ children, variant = "primary", className = "", ...props }) {
  const variantCls =
    variant === "primary" ? "btn-primary" :
    variant === "danger"  ? "btn-error"   :
                            "btn-ghost";
  return (
    <button
      {...props}
      className={`btn ${variantCls} w-full ${className}`}
    >
      {children}
    </button>
  );
}
