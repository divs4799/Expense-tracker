import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";

// ─── Theme palettes ───────────────────────────────────────────────────────────
const DARK = {
  bg: "#0f1117",
  surface: "#1a1d27",
  card: "#20243a",
  border: "#2e3250",
  accent: "#6c63ff",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#f59e0b",
  text: "#e2e8f0",
  muted: "#94a3b8",
  teal: "#14b8a6",
  pink: "#ec4899",
  inputBg: "#20243a",
  shadow: "rgba(0,0,0,.45)",
};

const LIGHT = {
  bg: "#f0f2f9",
  surface: "#ffffff",
  card: "#ffffff",
  border: "#dde1f0",
  accent: "#6c63ff",
  green: "#16a34a",
  red: "#dc2626",
  yellow: "#d97706",
  text: "#1e2340",
  muted: "#64748b",
  teal: "#0d9488",
  pink: "#db2777",
  inputBg: "#f4f6fb",
  shadow: "rgba(99,102,241,.12)",
};

const CAT_COLORS = [
  "#6c63ff", "#14b8a6", "#f59e0b", "#ec4899", "#22c55e",
  "#f97316", "#3b82f6", "#a855f7", "#ef4444", "#06b6d4"
];

const DEFAULT_CATEGORIES = [
  { id: "1", name: "Groceries", icon: "🛒", budget: 8000, color: CAT_COLORS[0] },
  { id: "2", name: "Rent", icon: "🏠", budget: 20000, color: CAT_COLORS[1] },
  { id: "3", name: "Petrol", icon: "⛽", budget: 4000, color: CAT_COLORS[2] },
  { id: "4", name: "OTTs", icon: "📺", budget: 1500, color: CAT_COLORS[3] },
  { id: "5", name: "Medicines", icon: "💊", budget: 2000, color: CAT_COLORS[4] },
];

const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const fmtCur = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const today = () => new Date().toISOString().split("T")[0];
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Storage ──────────────────────────────────────────────────────────────────
const KEYS = { cats: "fam_cats", expenses: "fam_expenses", monthlyBudgets: "fam_monthly_budgets", theme: "fam_theme" };

function loadData() {
  try {
    return {
      cats: JSON.parse(localStorage.getItem(KEYS.cats)) || DEFAULT_CATEGORIES,
      expenses: JSON.parse(localStorage.getItem(KEYS.expenses)) || {},
      monthlyBudgets: JSON.parse(localStorage.getItem(KEYS.monthlyBudgets)) || {},
    };
  } catch { return { cats: DEFAULT_CATEGORIES, expenses: {}, monthlyBudgets: {} }; }
}

function saveData(cats, expenses, monthlyBudgets) {
  localStorage.setItem(KEYS.cats, JSON.stringify(cats));
  localStorage.setItem(KEYS.expenses, JSON.stringify(expenses));
  localStorage.setItem(KEYS.monthlyBudgets, JSON.stringify(monthlyBudgets));
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
function ThemeSwitch({ dark, onToggle, P }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle theme"
      style={{
        width: 52, height: 28, borderRadius: 99, border: "none",
        background: dark ? "#2e3250" : "#dde1f0",
        cursor: "pointer", position: "relative",
        transition: "background .35s ease", flexShrink: 0,
        display: "flex", alignItems: "center", padding: "0 3px",
      }}
    >
      <span style={{ position: "absolute", left: 7, fontSize: 13, opacity: dark ? 0 : 1, transition: "opacity .25s", pointerEvents: "none" }}>☀️</span>
      <span style={{ position: "absolute", right: 7, fontSize: 13, opacity: dark ? 1 : 0, transition: "opacity .25s", pointerEvents: "none" }}>🌙</span>
      <div style={{
        width: 22, height: 22, borderRadius: "50%", background: P.accent,
        transform: dark ? "translateX(24px)" : "translateX(0px)",
        transition: "transform .35s cubic-bezier(.4,0,.2,1)",
        boxShadow: `0 2px 8px ${P.shadow}`, position: "relative", zIndex: 1,
      }} />
    </button>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────
function ProgressBar({ pct, color, P }) {
  const clamped = Math.min(pct, 100);
  const barColor = pct >= 100 ? P.red : pct >= 80 ? P.yellow : color;
  return (
    <div style={{ background: P.border, borderRadius: 99, height: 6, overflow: "hidden" }}>
      <div style={{ width: `${clamped}%`, height: "100%", background: barColor, borderRadius: 99, transition: "width .4s ease" }} />
    </div>
  );
}

function Modal({ open, onClose, title, children, P }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: P.surface, borderRadius: "20px 20px 0 0",
        padding: "28px 24px 42px", width: "100%", maxWidth: 480,
        border: `1px solid ${P.border}`, borderBottom: "none",
        boxShadow: `0 -8px 32px ${P.shadow}`, transition: "background .3s"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: P.text, fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: P.inputBg, border: `1px solid ${P.border}`, color: P.muted, borderRadius: 99, width: 32, height: 32, cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, P, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", color: P.muted, fontSize: 11, marginBottom: 5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" }}>{label}</label>}
      <input {...props} style={{
        width: "100%", boxSizing: "border-box", background: P.inputBg,
        border: `1px solid ${P.border}`, borderRadius: 10, padding: "10px 14px",
        color: P.text, fontSize: 15, outline: "none",
        ...(props.style || {})
      }} />
    </div>
  );
}

function Btn({ children, variant = "primary", P, ...props }) {
  const bg = variant === "primary" ? P.accent : variant === "danger" ? P.red : P.inputBg;
  const col = variant === "ghost" ? P.text : "#fff";
  return (
    <button {...props} style={{
      background: bg, color: col,
      border: `1px solid ${variant === "ghost" ? P.border : "transparent"}`,
      borderRadius: 12, padding: "12px 20px", fontWeight: 700, fontSize: 14,
      cursor: "pointer", width: "100%", letterSpacing: ".02em", transition: "opacity .15s",
      ...(props.style || {})
    }}>{children}</button>
  );
}

// ─── Set Monthly Budget Modal ─────────────────────────────────────────────────
function SetBudgetModal({ open, onClose, monthlyBudgets, onSave, P }) {
  const mk = monthKey();
  const current = monthlyBudgets[mk] || "";
  const [val, setVal] = useState(String(current));
  useEffect(() => { if (open) setVal(String(monthlyBudgets[monthKey()] || "")); }, [open, monthlyBudgets]);

  const save = () => {
    const n = Number(val);
    if (!n || n <= 0) return;
    onSave(n);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Set Monthly Budget" P={P}>
      <div style={{ color: P.muted, fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>
        Set your total income / budget for{" "}
        <strong style={{ color: P.text }}>{new Date().toLocaleString("default", { month: "long", year: "numeric" })}</strong>.
        This is separate from your category allocations.
      </div>
      <Input P={P} label="Total Monthly Budget (₹)" type="number" value={val}
        onChange={e => setVal(e.target.value)} placeholder="e.g. 60000" autoFocus />
      <Btn P={P} onClick={save}>Save Budget</Btn>
    </Modal>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ cats, expenses, monthlyBudgets, onNav, onSetBudget, P }) {
  const mk = monthKey();
  const monthExp = expenses[mk] || [];
  const monthlyBudget = monthlyBudgets[mk] || 0;
  const totalCatBudget = cats.reduce((s, c) => s + c.budget, 0);
  const totalSpent = monthExp.reduce((s, e) => s + e.amount, 0);
  const overallBudget = monthlyBudget || totalCatBudget;
  const totalRemaining = overallBudget - totalSpent;
  const overallPct = overallBudget ? (totalSpent / overallBudget) * 100 : 0;
  const unallocated = monthlyBudget ? monthlyBudget - totalCatBudget : 0;

  const overBudgetCats = cats.filter(c => {
    const sp = monthExp.filter(e => e.catId === c.id).reduce((a, e) => a + e.amount, 0);
    return sp > c.budget;
  });

  return (
    <div style={{ padding: "0 16px 100px" }}>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${P.accent}ee, ${P.teal}cc)`,
        borderRadius: 20, padding: "22px 20px 18px", marginBottom: 14,
        position: "relative", overflow: "hidden",
        boxShadow: `0 8px 32px ${P.accent}33`
      }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
        <div style={{ position: "absolute", right: 50, bottom: -24, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ color: "rgba(255,255,255,.8)", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
            {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
          </div>
          <button onClick={onSetBudget} style={{
            background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.35)",
            color: "#fff", borderRadius: 99, padding: "4px 13px",
            fontSize: 11, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(4px)"
          }}>✏️ Set Budget</button>
        </div>

        <div style={{ color: "#fff", fontSize: 38, fontWeight: 800, marginBottom: 2, letterSpacing: "-.02em", lineHeight: 1 }}>
          {fmtCur(totalRemaining)}
        </div>
        <div style={{ color: "rgba(255,255,255,.72)", fontSize: 13, marginBottom: 14 }}>
          remaining of{" "}
          <strong style={{ color: "#fff" }}>{fmtCur(overallBudget)}</strong>
          {monthlyBudget > 0 && <span style={{ opacity: .6 }}> (monthly budget)</span>}
        </div>

        <ProgressBar pct={overallPct} color="rgba(255,255,255,.9)"
          P={{ border: "rgba(255,255,255,.25)", red: "#ff6b6b", yellow: "#ffd166" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
          <span style={{ color: "rgba(255,255,255,.6)", fontSize: 12 }}>Spent: {fmtCur(totalSpent)}</span>
          <span style={{ color: "rgba(255,255,255,.6)", fontSize: 12 }}>{Math.round(overallPct)}% used</span>
        </div>
      </div>

      {/* Unallocated notice */}
      {monthlyBudget > 0 && unallocated !== 0 && (
        <div style={{
          background: unallocated < 0 ? P.red + "18" : P.teal + "18",
          border: `1px solid ${unallocated < 0 ? P.red : P.teal}33`,
          borderRadius: 12, padding: "10px 14px", marginBottom: 10,
          display: "flex", alignItems: "center", gap: 10
        }}>
          <span style={{ fontSize: 18 }}>{unallocated < 0 ? "⚠️" : "💡"}</span>
          <div>
            <div style={{ color: unallocated < 0 ? P.red : P.teal, fontWeight: 700, fontSize: 13 }}>
              {unallocated < 0
                ? "Category budgets exceed monthly budget!"
                : `${fmtCur(unallocated)} unallocated`}
            </div>
            <div style={{ color: P.muted, fontSize: 11 }}>
              {unallocated < 0
                ? `Categories total ${fmtCur(totalCatBudget)} vs ${fmtCur(monthlyBudget)} monthly`
                : "Budget not yet assigned to any category"}
            </div>
          </div>
        </div>
      )}

      {/* Over-budget alert */}
      {overBudgetCats.length > 0 && (
        <div style={{ background: P.red + "18", border: `1px solid ${P.red}33`, borderRadius: 12, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🚨</span>
          <div style={{ color: P.red, fontWeight: 700, fontSize: 13 }}>
            Over budget: {overBudgetCats.map(c => c.name).join(", ")}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Categories", val: cats.length, icon: "📁", color: P.accent },
          { label: "Expenses", val: monthExp.length, icon: "📝", color: P.teal },
          { label: "Avg / Day", val: fmtCur(Math.round(totalSpent / Math.max(1, new Date().getDate()))), icon: "📅", color: P.yellow },
          { label: "Days Left", val: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate(), icon: "⏳", color: P.pink },
        ].map(s => (
          <div key={s.label} style={{ background: P.card, borderRadius: 14, padding: "14px 16px", border: `1px solid ${P.border}`, boxShadow: `0 2px 10px ${P.shadow}` }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ color: s.color, fontWeight: 800, fontSize: 20, marginTop: 4 }}>{s.val}</div>
            <div style={{ color: P.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category list */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ margin: 0, color: P.text, fontSize: 16, fontWeight: 700 }}>Categories</h2>
        <button onClick={() => onNav("categories")} style={{ background: "none", border: "none", color: P.accent, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Manage →</button>
      </div>

      {cats.map(cat => {
        const spent = monthExp.filter(e => e.catId === cat.id).reduce((a, e) => a + e.amount, 0);
        const remaining = cat.budget - spent;
        const pct = cat.budget ? (spent / cat.budget) * 100 : 0;
        return (
          <div key={cat.id} style={{
            background: P.card, borderRadius: 14, padding: "13px 15px", marginBottom: 9,
            border: `1px solid ${P.border}`, borderLeft: `3px solid ${cat.color}`,
            boxShadow: `0 2px 8px ${P.shadow}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <span style={{ color: P.text, fontWeight: 600, fontSize: 14 }}>{cat.name}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: remaining < 0 ? P.red : P.green, fontWeight: 700, fontSize: 13 }}>
                  {fmtCur(Math.abs(remaining))}{remaining < 0 ? " over" : " left"}
                </div>
                <div style={{ color: P.muted, fontSize: 11 }}>{fmtCur(spent)} / {fmtCur(cat.budget)}</div>
              </div>
            </div>
            <ProgressBar pct={pct} color={cat.color} P={P} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
function ExpensesView({ cats, expenses, onAdd, P }) {
  const mk = monthKey();
  const monthExp = (expenses[mk] || []).slice().reverse();
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? monthExp : monthExp.filter(e => e.catId === filter);

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, color: P.text, fontSize: 18, fontWeight: 700 }}>Expenses</h2>
        <button onClick={onAdd} style={{ background: P.accent, color: "#fff", border: "none", borderRadius: 99, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Add</button>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
        {[{ id: "all", name: "All", icon: "🔍", color: P.accent }, ...cats].map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)} style={{
            background: filter === c.id ? (c.color || P.accent) : P.card,
            color: filter === c.id ? "#fff" : P.muted,
            border: `1px solid ${filter === c.id ? (c.color || P.accent) : P.border}`,
            borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 600,
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "all .2s"
          }}>{c.icon} {c.name}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: P.muted }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>📭</div>
          <div>No expenses yet</div>
        </div>
      ) : filtered.map(exp => {
        const cat = cats.find(c => c.id === exp.catId);
        return (
          <div key={exp.id} style={{
            background: P.card, borderRadius: 12, padding: "13px 15px", marginBottom: 9,
            border: `1px solid ${P.border}`, display: "flex", alignItems: "center", gap: 12,
            boxShadow: `0 2px 8px ${P.shadow}`
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: (cat?.color || P.accent) + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
              {cat?.icon || "💰"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: P.text, fontWeight: 600, fontSize: 14 }}>{exp.note || cat?.name || "Expense"}</div>
              <div style={{ color: P.muted, fontSize: 11, marginTop: 2 }}>{exp.date} · {cat?.name}</div>
            </div>
            <div style={{ color: P.red, fontWeight: 800, fontSize: 15, flexShrink: 0 }}>−{fmtCur(exp.amount)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────
function ChartsView({ cats, expenses, P }) {
  const mk = monthKey();
  const monthExp = expenses[mk] || [];

  const dayData = Array.from({ length: new Date().getDate() }, (_, i) => {
    const dateStr = `${mk}-${String(i + 1).padStart(2, "0")}`;
    return { day: String(i + 1), amount: monthExp.filter(e => e.date === dateStr).reduce((a, e) => a + e.amount, 0) };
  });

  const pieData = cats.map(c => ({
    name: c.name, value: monthExp.filter(e => e.catId === c.id).reduce((a, e) => a + e.amount, 0), color: c.color
  })).filter(d => d.value > 0);

  const now = new Date();
  const monthComparison = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 3 + i, 1);
    const key = monthKey(d);
    return {
      month: d.toLocaleString("default", { month: "short" }),
      spent: (expenses[key] || []).reduce((a, e) => a + e.amount, 0),
      budget: cats.reduce((s, c) => s + c.budget, 0),
    };
  });

  const ttStyle = { background: P.card, border: `1px solid ${P.border}`, borderRadius: 8, color: P.text, fontSize: 12 };

  const ChartCard = ({ title, children }) => (
    <div style={{ background: P.card, borderRadius: 16, padding: "18px 12px 14px", marginBottom: 14, border: `1px solid ${P.border}`, boxShadow: `0 2px 10px ${P.shadow}` }}>
      <h3 style={{ margin: "0 0 14px 4px", color: P.text, fontSize: 14, fontWeight: 700 }}>{title}</h3>
      {children}
    </div>
  );

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: P.text, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Analytics</h2>

      <ChartCard title={`📅 Daily Expenses — ${new Date().toLocaleString("default", { month: "long" })}`}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dayData} margin={{ top: 0, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={P.border} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: P.muted, fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: P.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip contentStyle={ttStyle} formatter={v => [fmtCur(v), "Spent"]} cursor={{ fill: P.border + "66" }} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {dayData.map((_, i) => <Cell key={i} fill={P.accent} fillOpacity={.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {pieData.length > 0 && (
        <ChartCard title="🗂 Category Breakdown">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={ttStyle} formatter={v => [fmtCur(v)]} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: P.muted, fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ChartCard title="📊 Last 4 Months Comparison">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthComparison} margin={{ top: 0, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={P.border} vertical={false} />
            <XAxis dataKey="month" tick={{ fill: P.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: P.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip contentStyle={ttStyle} formatter={v => [fmtCur(v)]} cursor={{ fill: P.border + "66" }} />
            <Legend formatter={v => <span style={{ color: P.muted, fontSize: 11 }}>{v === "budget" ? "Cat. Budgets" : "Spent"}</span>} iconSize={8} />
            <Bar dataKey="budget" fill={P.border} radius={[4, 4, 0, 0]} name="budget" />
            <Bar dataKey="spent" fill={P.accent} radius={[4, 4, 0, 0]} name="spent" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────
function CategoriesView({ cats, expenses, onCatsChange, P }) {
  const mk = monthKey();
  const monthExp = expenses[mk] || [];
  const [showAdd, setShowAdd] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: "", icon: "💰", budget: "", color: CAT_COLORS[0] });

  const openAdd = () => { setForm({ name: "", icon: "💰", budget: "", color: CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)] }); setEditCat(null); setShowAdd(true); };
  const openEdit = (cat) => { setForm({ name: cat.name, icon: cat.icon, budget: String(cat.budget), color: cat.color }); setEditCat(cat); setShowAdd(true); };
  const save = () => {
    if (!form.name || !form.budget) return;
    if (editCat) onCatsChange(cats.map(c => c.id === editCat.id ? { ...c, ...form, budget: Number(form.budget) } : c));
    else onCatsChange([...cats, { id: uid(), ...form, budget: Number(form.budget) }]);
    setShowAdd(false);
  };
  const del = (id) => { if (window.confirm("Delete this category?")) onCatsChange(cats.filter(c => c.id !== id)); };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, color: P.text, fontSize: 18, fontWeight: 700 }}>Categories</h2>
        <button onClick={openAdd} style={{ background: P.accent, color: "#fff", border: "none", borderRadius: 99, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Add</button>
      </div>

      {cats.map(cat => {
        const spent = monthExp.filter(e => e.catId === cat.id).reduce((a, e) => a + e.amount, 0);
        return (
          <div key={cat.id} style={{ background: P.card, borderRadius: 14, padding: "13px 15px", marginBottom: 9, border: `1px solid ${P.border}`, borderLeft: `3px solid ${cat.color}`, boxShadow: `0 2px 8px ${P.shadow}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>{cat.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: P.text, fontWeight: 700, fontSize: 15 }}>{cat.name}</div>
                <div style={{ color: P.muted, fontSize: 12 }}>Budget: {fmtCur(cat.budget)} · Spent: {fmtCur(spent)}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => openEdit(cat)} style={{ background: P.inputBg, border: `1px solid ${P.border}`, color: P.muted, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>✏️</button>
                <button onClick={() => del(cat.id)} style={{ background: P.red + "18", border: `1px solid ${P.red}33`, color: P.red, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>🗑</button>
              </div>
            </div>
          </div>
        );
      })}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editCat ? "Edit Category" : "New Category"} P={P}>
        <Input P={P} label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Groceries" />
        <Input P={P} label="Icon" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="💰" />
        <Input P={P} label="Monthly Budget (₹)" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="5000" />
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", color: P.muted, fontSize: 11, marginBottom: 8, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" }}>Color</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CAT_COLORS.map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: form.color === c ? `3px solid ${P.text}` : "3px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
        </div>
        <Btn P={P} onClick={save}>{editCat ? "Save Changes" : "Add Category"}</Btn>
      </Modal>
    </div>
  );
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────
function AddExpenseModal({ open, onClose, cats, onAdd, P }) {
  const [form, setForm] = useState({ catId: cats[0]?.id || "", amount: "", note: "", date: today() });
  useEffect(() => { if (open) setForm(f => ({ ...f, catId: cats[0]?.id || "", date: today() })); }, [open, cats]);

  const submit = () => {
    if (!form.catId || !form.amount) return;
    onAdd({ id: uid(), catId: form.catId, amount: Number(form.amount), note: form.note, date: form.date });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Expense" P={P}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", color: P.muted, fontSize: 11, marginBottom: 7, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" }}>Category</label>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {cats.map(c => (
            <button key={c.id} onClick={() => setForm(f => ({ ...f, catId: c.id }))} style={{
              background: form.catId === c.id ? c.color : P.inputBg,
              color: form.catId === c.id ? "#fff" : P.muted,
              border: `1px solid ${form.catId === c.id ? c.color : P.border}`,
              borderRadius: 99, padding: "6px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s"
            }}>{c.icon} {c.name}</button>
          ))}
        </div>
      </div>
      <Input P={P} label="Amount (₹)" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="300" />
      <Input P={P} label="Note (optional)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Vegetables, fuel top-up…" />
      <Input P={P} label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      <Btn P={P} onClick={submit}>Add Expense</Btn>
    </Modal>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem(KEYS.theme) !== "light");
  const [data, setData] = useState(() => loadData());
  const [tab, setTab] = useState("home");
  const [addExpOpen, setAddExpOpen] = useState(false);
  const [setBudgetOpen, setSetBudgetOpen] = useState(false);

  const P = dark ? DARK : LIGHT;

  const toggleTheme = () => setDark(d => {
    const next = !d;
    localStorage.setItem(KEYS.theme, next ? "dark" : "light");
    return next;
  });

  const setCats = useCallback((newCats) => {
    setData(d => { saveData(newCats, d.expenses, d.monthlyBudgets); return { ...d, cats: newCats }; });
  }, []);

  const addExpense = useCallback((exp) => {
    setData(d => {
      const mk = monthKey(new Date(exp.date));
      const newExpenses = { ...d.expenses, [mk]: [...(d.expenses[mk] || []), exp] };
      saveData(d.cats, newExpenses, d.monthlyBudgets);
      return { ...d, expenses: newExpenses };
    });
  }, []);

  const saveMonthlyBudget = useCallback((amount) => {
    setData(d => {
      const mk = monthKey();
      const newMB = { ...d.monthlyBudgets, [mk]: amount };
      saveData(d.cats, d.expenses, newMB);
      return { ...d, monthlyBudgets: newMB };
    });
  }, []);

  const tabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "expenses", icon: "📝", label: "Expenses" },
    { id: "charts", icon: "📊", label: "Charts" },
    { id: "categories", icon: "🗂", label: "Categories" },
  ];

  return (
    <div style={{ background: P.bg, minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif", color: P.text, transition: "background .35s, color .35s" }}>

      {/* ── Header ── */}
      <div style={{
        background: P.surface, borderBottom: `1px solid ${P.border}`,
        padding: "14px 18px 12px", position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: `0 2px 12px ${P.shadow}`, transition: "background .35s, border .35s"
      }}>
        <div>
          <div style={{ fontSize: 10, color: P.muted, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>Budget Tracker</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: P.text, marginTop: 1 }}>
            {tabs.find(t => t.id === tab)?.icon} {tabs.find(t => t.id === tab)?.label}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeSwitch dark={dark} onToggle={toggleTheme} P={P} />
          <button onClick={() => setAddExpOpen(true)} style={{
            background: P.accent, color: "#fff", border: "none", borderRadius: 12,
            padding: "9px 15px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            boxShadow: `0 4px 14px ${P.accent}44`
          }}>+ Expense</button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ paddingTop: 14 }}>
        {tab === "home" && <Dashboard cats={data.cats} expenses={data.expenses} monthlyBudgets={data.monthlyBudgets} onNav={setTab} onSetBudget={() => setSetBudgetOpen(true)} P={P} />}
        {tab === "expenses" && <ExpensesView cats={data.cats} expenses={data.expenses} onAdd={() => setAddExpOpen(true)} P={P} />}
        {tab === "charts" && <ChartsView cats={data.cats} expenses={data.expenses} P={P} />}
        {tab === "categories" && <CategoriesView cats={data.cats} expenses={data.expenses} onCatsChange={setCats} P={P} />}
      </div>

      {/* ── Bottom Nav ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: P.surface, borderTop: `1px solid ${P.border}`,
        display: "flex", padding: "8px 0 20px", zIndex: 50,
        boxShadow: `0 -2px 12px ${P.shadow}`, transition: "background .35s, border .35s"
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: 0
          }}>
            <span style={{ fontSize: 22, filter: tab === t.id ? "none" : "grayscale(1) opacity(.4)", transition: "filter .25s" }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: tab === t.id ? P.accent : P.muted, letterSpacing: ".03em", transition: "color .25s" }}>{t.label}</span>
            {tab === t.id && <div style={{ width: 18, height: 3, background: P.accent, borderRadius: 99, marginTop: 1 }} />}
          </button>
        ))}
      </div>

      {/* ── Modals ── */}
      <AddExpenseModal open={addExpOpen} onClose={() => setAddExpOpen(false)} cats={data.cats} onAdd={addExpense} P={P} />
      <SetBudgetModal open={setBudgetOpen} onClose={() => setSetBudgetOpen(false)} monthlyBudgets={data.monthlyBudgets} onSave={saveMonthlyBudget} P={P} />
    </div>
  );
}
