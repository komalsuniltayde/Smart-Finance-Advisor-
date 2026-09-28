import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
} from "recharts";
import { useFinance } from "../context/FinanceContext.jsx";
import axios from "axios";

/* ─── Color palette ─────────────────────────────────────────────── */
const COLORS = ["#00d4ff", "#00e5a0", "#ffb830", "#a78bfa", "#ff4d6d", "#f472b6", "#38bdf8", "#34d399"];
const GRADIENT_PAIRS = [
  { start: "#00d4ff", end: "#0284c7" },
  { start: "#00e5a0", end: "#059669" },
  { start: "#ffb830", end: "#d97706" },
  { start: "#a78bfa", end: "#7c3aed" },
];

/* ─── Custom Tooltip ────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(11,17,30,0.96)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(0,212,255,0.2)",
        borderRadius: 12,
        padding: "12px 16px",
        fontFamily: "var(--font-body)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
      }}
    >
      <p style={{ color: "#8a99ad", fontSize: 11, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      {payload.map(
        (p, i) =>
          p.value != null && (
            <p key={i} style={{ color: p.color || p.stroke, fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 600, margin: "3px 0" }}>
              {p.name}: ₹{p.value?.toLocaleString()}
            </p>
          ),
      )}
    </div>
  );
};

/* ─── Stat Card ──────────────────────────────────────────────── */
function StatCard({ label, value, icon, color, gradient, delay }) {
  return (
    <div
      className={`anim-up-${delay}`}
      style={{
        flex: 1,
        minWidth: 180,
        padding: "20px 22px",
        borderRadius: 14,
        background: `linear-gradient(135deg, ${gradient[0]}12, ${gradient[1]}08)`,
        border: `1px solid ${color}18`,
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${color}15`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ position: "absolute", top: -10, right: -10, fontSize: 52, opacity: 0.06 }}>{icon}</div>
      <p style={{
        fontSize: 10, color: "#6b7f96", fontFamily: "var(--font-display)", textTransform: "uppercase",
        letterSpacing: "0.08em", fontWeight: 700, marginBottom: 8,
      }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

/* ─── Section Header ─────────────────────────────────────────── */
function SectionHeader({ title, subtitle, icon }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{
        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16,
        display: "flex", alignItems: "center", gap: 8, marginBottom: 2,
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span> {title}
      </h3>
      <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{subtitle}</p>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function Analytics() {
  const [tab, setTab] = useState("monthly");
  const { fetchAnalytics, summary, fetchSummary } = useFinance();
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Fetch data based on selected time period */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = "/api/analytics/monthly";
      if (tab === "weekly") endpoint = "/api/analytics/weekly";
      else if (tab === "yearly") endpoint = "/api/analytics/yearly";

      const [chartRes, catRes, budgetRes] = await Promise.all([
        axios.get(endpoint),
        axios.get("/api/analytics/categories"),
        axios.get("/api/analytics/budget-vs-actual").catch(() => ({ data: [] })),
      ]);

      setChartData(chartRes.data || []);
      setCategoryData(catRes.data || []);
      setBudgetData(budgetRes.data || []);
    } catch (err) {
      console.error("Analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadData();
    fetchSummary();
  }, [tab]);

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const savings = summary?.savings ?? 0;
  const savingsRate = summary?.savingsRate ?? 0;
  const tabLabels = { weekly: "This Week", monthly: "This Month", yearly: "This Year" };
  const tabSubtitles = { weekly: "Weekly breakdown of your finances", monthly: "Monthly comparison from your real data", yearly: "12-month financial overview" };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1320, margin: "0 auto" }}>
      {/* ─── Header ───────────────────────────────────────────── */}
      <div className="anim-up" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Analytics</h1>
          <p>Real-time breakdown of your financial data</p>
        </div>
        <div style={{
          display: "flex", gap: 0, background: "var(--bg-card)", borderRadius: 10,
          border: "1px solid var(--border)", overflow: "hidden",
        }}>
          {["weekly", "monthly", "yearly"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 20px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-display)",
                border: "none", cursor: "pointer", textTransform: "capitalize",
                transition: "all 0.25s ease",
                background: tab === t ? "linear-gradient(135deg, #00d4ff, #a78bfa)" : "transparent",
                color: tab === t ? "#0b111e" : "#6b7f96",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ─── KPI Cards ────────────────────────────────────────── */}
      <div className="anim-up-1" style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Total Income" value={`₹${totalIncome.toLocaleString()}`} icon="💰" color="#00e5a0" gradient={["#00e5a0", "#059669"]} delay={1} />
        <StatCard label="Total Expenses" value={`₹${totalExpense.toLocaleString()}`} icon="🔥" color="#ff4d6d" gradient={["#ff4d6d", "#be123c"]} delay={1} />
        <StatCard label="Net Savings" value={`₹${savings.toLocaleString()}`} icon="🏦" color="#00d4ff" gradient={["#00d4ff", "#0284c7"]} delay={1} />
        <StatCard label="Savings Rate" value={`${savingsRate}%`} icon="📈" color="#a78bfa" gradient={["#a78bfa", "#7c3aed"]} delay={1} />
      </div>

      {/* ─── Income vs Expenses Chart ─────────────────────────── */}
      <div className="card anim-up-2" style={{ marginBottom: 20 }}>
        <SectionHeader title="Income vs Expenses" subtitle={tabSubtitles[tab]} icon="📊" />
        {loading ? (
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div className="spinner" style={{ width: 24, height: 24 }} />
            <span style={{ color: "var(--text-secondary)" }}>Loading your data...</span>
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 48 }}>📊</div>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No data yet — add transactions to see charts</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ left: -5, right: 5, top: 5 }}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5a0" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00e5a0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff4d6d" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#ff4d6d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,45,69,0.5)" vertical={false} />
              <XAxis dataKey="period" tick={{ fill: "#4a6580", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4a6580", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="income" fill="#00e5a0" radius={[6, 6, 0, 0]} name="Income" maxBarSize={36} fillOpacity={0.85} />
              <Bar dataKey="expense" fill="#ff4d6d" radius={[6, 6, 0, 0]} name="Expense" maxBarSize={36} fillOpacity={0.85} />
              <Line type="monotone" dataKey="savings" stroke="#00d4ff" strokeWidth={2.5} dot={{ r: 4, fill: "#00d4ff", stroke: "#0b111e", strokeWidth: 2 }} name="Savings" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ─── Middle Row: Savings Trend + Category Donut ────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Savings Trend Area */}
        <div className="card anim-up-3">
          <SectionHeader title="Savings Trend" subtitle={`${tab === "weekly" ? "Weekly" : tab === "yearly" ? "Yearly" : "Monthly"} net savings flow`} icon="💎" />
          {chartData.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Add transactions to see trend</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ left: -10 }}>
                <defs>
                  <linearGradient id="gSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.35} />
                    <stop offset="50%" stopColor="#a78bfa" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,45,69,0.4)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "#4a6580", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4a6580", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="savings" stroke="#00d4ff" strokeWidth={2.5} fill="url(#gSavings)" name="Savings" dot={{ r: 3, fill: "#00d4ff", stroke: "#0b111e", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Donut */}
        <div className="card anim-up-4">
          <SectionHeader title="Expense Breakdown" subtitle="Category-wise spending share" icon="🍕" />
          {categoryData.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 36 }}>🥧</div>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No expenses yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <ResponsiveContainer width="50%" height={190}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoryData.map((e, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div style={{
                          background: "rgba(11,17,30,0.96)", border: `1px solid ${d.payload.fill}`,
                          borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        }}>
                          <p style={{ color: d.payload.fill, fontSize: 13, fontWeight: 700 }}>{d.name}</p>
                          <p style={{ color: "#fff", fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{d.value}%</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {categoryData.slice(0, 6).map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length],
                        boxShadow: `0 0 6px ${COLORS[i % COLORS.length]}55`,
                      }} />
                      <span style={{ color: "#e6ecf5", fontWeight: 500 }}>{e.name}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", color: COLORS[i % COLORS.length], fontWeight: 600 }}>
                      {e.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Budget vs Actual Spending ─────────────────────── */}
      <div className="card anim-up-5" style={{ marginBottom: 20 }}>
        <SectionHeader title="Budget vs Actual Spending" subtitle="How your spending compares to your set budget limits" icon="🎯" />
        {budgetData.length === 0 ? (
          <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 40 }}>🎯</div>
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Set budgets on the Budget page to see comparison</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {budgetData.map((item, i) => {
              const pct = item.budget > 0 ? Math.min((item.actual / item.budget) * 100, 100) : 0;
              const overPct = item.budget > 0 && item.actual > item.budget ? Math.min(((item.actual - item.budget) / item.budget) * 100, 50) : 0;
              const isOver = item.actual > item.budget;
              const barColor = isOver ? "#ff4d6d" : pct > 75 ? "#ffb830" : "#00e5a0";
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "flex-end" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length] }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#e6ecf5" }}>{item.category}</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, fontFamily: "var(--font-mono)" }}>
                      <span style={{ color: barColor, fontWeight: 600 }}>₹{item.actual.toLocaleString()}</span>
                      <span style={{ color: "#4a6580" }}>/ ₹{item.budget.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{
                    height: 10, borderRadius: 5, background: "rgba(26,45,69,0.6)", overflow: "hidden", position: "relative",
                  }}>
                    <div style={{
                      height: "100%", borderRadius: 5, width: `${Math.min(pct, 100)}%`,
                      background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                      transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                      boxShadow: `0 0 12px ${barColor}40`,
                    }} />
                    {isOver && (
                      <div style={{
                        position: "absolute", top: 0, right: 0, height: "100%",
                        width: `${overPct}%`, background: "repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(255,77,109,0.3) 3px, rgba(255,77,109,0.3) 6px)",
                        borderRadius: "0 5px 5px 0",
                      }} />
                    )}
                  </div>
                  {isOver && (
                    <p style={{ fontSize: 11, color: "#ff4d6d", marginTop: 4, fontWeight: 500 }}>
                      ⚠️ Over budget by ₹{(item.actual - item.budget).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Bottom Row: Expense Trend + Financial Health Radar ─ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Expense Line Trend */}
        <div className="card anim-up-6">
          <SectionHeader title="Expense Trend" subtitle={`${tab === "weekly" ? "Daily" : tab === "yearly" ? "Yearly" : "Monthly"} expense trajectory`} icon="📉" />
          {chartData.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,45,69,0.4)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "#4a6580", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4a6580", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="expense" stroke="#ff4d6d" strokeWidth={2.5} name="Expense"
                  dot={{ r: 4, fill: "#ff4d6d", stroke: "#0b111e", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#ff4d6d", stroke: "#fff", strokeWidth: 2 }}
                />
                <Line type="monotone" dataKey="income" stroke="#00e5a0" strokeWidth={2} strokeDasharray="5 5" name="Income"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Financial Health Radar */}
        <div className="card anim-up-7">
          <SectionHeader title="Financial Health Score" subtitle="AI-powered health assessment" icon="🛡️" />
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart
              data={(() => {
                const savPct = totalIncome > 0 ? Math.min(Math.round((savings / totalIncome) * 100), 100) : 0;
                const budgetPct = budgetData.length > 0
                  ? Math.round(budgetData.filter(b => b.actual <= b.budget).length / budgetData.length * 100)
                  : 50;
                const expRatio = totalIncome > 0 ? Math.max(0, 100 - Math.round((totalExpense / totalIncome) * 100)) : 50;
                return [
                  { subject: "Savings", A: Math.max(savPct, 10) },
                  { subject: "Budget", A: Math.max(budgetPct, 10) },
                  { subject: "Income", A: Math.min(totalIncome > 0 ? 80 : 30, 95) },
                  { subject: "Debt Free", A: 85 },
                  { subject: "Expense Control", A: Math.max(expRatio, 10) },
                  { subject: "Consistency", A: Math.min(chartData.length * 15, 90) },
                ];
              })()}
              margin={{ top: 5, right: 30, bottom: 5, left: 30 }}
            >
              <PolarGrid stroke="rgba(26,45,69,0.7)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#5a7a96", fontSize: 10, fontWeight: 500 }} />
              <Radar name="Score" dataKey="A" stroke="#00d4ff" fill="rgba(0,212,255,0.12)" strokeWidth={2.5} />
              <Radar name="Baseline" dataKey="A" stroke="#a78bfa" fill="rgba(167,139,250,0.05)" strokeWidth={1} strokeDasharray="4 4" />
              <Tooltip content={<ChartTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Spending Heatmap Inspired Summary ─────────────── */}
      {categoryData.length > 0 && (
        <div className="card anim-up-8" style={{ marginBottom: 20 }}>
          <SectionHeader title="Category Spending Overview" subtitle="Visual breakdown of where your money goes" icon="🔍" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {categoryData.slice(0, 8).map((cat, i) => (
              <div
                key={i}
                style={{
                  padding: "16px 18px",
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}10, ${COLORS[i % COLORS.length]}05)`,
                  border: `1px solid ${COLORS[i % COLORS.length]}18`,
                  transition: "transform 0.2s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length],
                    boxShadow: `0 0 8px ${COLORS[i % COLORS.length]}60`,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#e6ecf5" }}>{cat.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: COLORS[i % COLORS.length] }}>
                    {cat.value}%
                  </span>
                  {cat.amount != null && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b7f96" }}>
                      ₹{cat.amount.toLocaleString()}
                    </span>
                  )}
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(26,45,69,0.5)", marginTop: 10, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 2, width: `${cat.value}%`,
                    background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}aa, ${COLORS[i % COLORS.length]})`,
                    transition: "width 1s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
