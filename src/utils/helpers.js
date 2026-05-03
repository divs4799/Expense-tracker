export const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const fmtCur = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export const today = () => new Date().toISOString().split("T")[0];

export const uid = () => Math.random().toString(36).slice(2, 9);
