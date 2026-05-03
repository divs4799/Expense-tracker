import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { monthKey, fmtCur } from "../utils/helpers";

function ChartCard({ title, children }) {
  return (
    <div className="card bg-base-200 mb-4 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h3 className="card-title text-sm font-bold mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function ChartsView({ cats, expenses }) {
  const mk       = monthKey();
  const monthExp = expenses[mk] || [];

  const dayData = Array.from({ length: new Date().getDate() }, (_, i) => {
    const dateStr = `${mk}-${String(i + 1).padStart(2, "0")}`;
    return {
      day: String(i + 1),
      amount: monthExp.filter((e) => e.date === dateStr).reduce((a, e) => a + e.amount, 0),
    };
  });

  const pieData = cats
    .map((c) => ({
      name:  c.name,
      value: monthExp.filter((e) => e.catId === c.id).reduce((a, e) => a + e.amount, 0),
      color: c.color,
    }))
    .filter((d) => d.value > 0);

  const now = new Date();
  const monthComparison = Array.from({ length: 4 }, (_, i) => {
    const d   = new Date(now.getFullYear(), now.getMonth() - 3 + i, 1);
    const key = monthKey(d);
    return {
      month:  d.toLocaleString("default", { month: "short" }),
      spent:  (expenses[key] || []).reduce((a, e) => a + e.amount, 0),
      budget: cats.reduce((s, c) => s + c.budget, 0),
    };
  });

  // Recharts tooltip needs inline style — we use CSS variable values via getComputedStyle
  const ttStyle = {
    background: "var(--color-base-200)",
    border: "1px solid var(--color-base-300)",
    borderRadius: 8,
    fontSize: 12,
  };

  return (
    <div className="px-4 pb-28">
      <h2 className="text-lg font-bold mb-4">Analytics</h2>

      <ChartCard title={`📅 Daily Expenses — ${new Date().toLocaleString("default", { month: "long" })}`}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dayData} margin={{ top: 0, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-300)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "var(--color-base-content)", fontSize: 10, opacity: 0.5 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: "var(--color-base-content)", fontSize: 10, opacity: 0.5 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip contentStyle={ttStyle} formatter={(v) => [fmtCur(v), "Spent"]} cursor={{ fill: "var(--color-base-300)", opacity: 0.4 }} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {dayData.map((_, i) => <Cell key={i} fill="var(--color-primary)" fillOpacity={0.85} />)}
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
              <Tooltip contentStyle={ttStyle} formatter={(v) => [fmtCur(v)]} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, opacity: 0.7 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ChartCard title="📊 Last 4 Months Comparison">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthComparison} margin={{ top: 0, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-300)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "var(--color-base-content)", fontSize: 11, opacity: 0.5 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--color-base-content)", fontSize: 10, opacity: 0.5 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip contentStyle={ttStyle} formatter={(v) => [fmtCur(v)]} cursor={{ fill: "var(--color-base-300)", opacity: 0.4 }} />
            <Legend formatter={(v) => <span style={{ fontSize: 11, opacity: 0.7 }}>{v === "budget" ? "Cat. Budgets" : "Spent"}</span>} iconSize={8} />
            <Bar dataKey="budget" fill="var(--color-base-300)" radius={[4, 4, 0, 0]} name="budget" />
            <Bar dataKey="spent"  fill="var(--color-primary)"  radius={[4, 4, 0, 0]} name="spent"  />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
