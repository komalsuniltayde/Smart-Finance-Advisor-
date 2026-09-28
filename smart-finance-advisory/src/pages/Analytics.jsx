import React, { useState, useEffect } from "react";
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
} from "recharts";
import { useFinance } from "../context/FinanceContext.jsx";

const RADAR = [
  { subject: "Savings", A: 85 },
  { subject: "Budget", A: 62 },
  { subject: "Income", A: 78 },
  { subject: "Debt Free", A: 90 },
  { subject: "Emergency", A: 45 },
  { subject: "Investment", A: 55 },
];

const TTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-light)",
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: "var(--font-body)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: 12,
          marginBottom: 5,
        }}
      >
        {label}
      </p>
      {payload.map(
        (p, i) =>
          p.value != null && (
            <p
              key={i}
              style={{
                color: p.color,
                fontSize: 13,
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
              }}
            >
              {p.name}: ₹{p.value?.toLocaleString()}
            </p>
          ),
      )}
    </div>
  );
};

export default function Analytics() {
  const [tab, setTab] = useState("monthly");
  const { fetchAnalytics, summary, fetchSummary } = useFinance();
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    fetchSummary();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchAnalytics();
      if (res && res.length > 0) setMonthlyData(res);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const data = monthlyData.length > 0 ? monthlyData : [];
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const savings = summary?.savings ?? 0;
  const savingsRate = summary?.savingsRate ?? 0;

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div
        className="anim-up"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Analytics</h1>
          <p>Real-time breakdown of your financial data</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["monthly"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-ghost"}`}
              style={{ textTransform: "capitalize" }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary pills */}
      <div
        className="anim-up-1"
        style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}
      >
        {[
          {
            l: "Total Income",
            v: `₹${totalIncome.toLocaleString()}`,
            c: "var(--green)",
            b: "rgba(0,229,160,0.07)",
          },
          {
            l: "Total Expenses",
            v: `₹${totalExpense.toLocaleString()}`,
            c: "var(--red)",
            b: "rgba(255,77,109,0.07)",
          },
          {
            l: "Net Savings",
            v: `₹${savings.toLocaleString()}`,
            c: "var(--accent)",
            b: "rgba(0,212,255,0.07)",
          },
          {
            l: "Savings Rate",
            v: `${savingsRate}%`,
            c: "var(--purple)",
            b: "rgba(167,139,250,0.07)",
          },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              flex: 1,
              minWidth: 160,
              padding: "14px 18px",
              borderRadius: "var(--r-md)",
              background: s.b,
              border: `1px solid ${s.c}20`,
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                fontFamily: "var(--font-display)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 5,
              }}
            >
              {s.l}
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 17,
                fontWeight: 500,
                color: s.c,
              }}
            >
              {s.v}
            </p>
          </div>
        ))}
      </div>

      {/* Main bar chart */}
      <div className="card anim-up-2" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 2,
              }}
            >
              Income vs Expenses
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Monthly comparison from your real data
            </p>
          </div>
        </div>
        {loading ? (
          <div
            style={{
              height: 260,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div className="spinner" style={{ width: 24, height: 24 }} />
            <span style={{ color: "var(--text-secondary)" }}>
              Loading your data...
            </span>
          </div>
        ) : data.length === 0 ? (
          <div
            style={{
              height: 260,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 40 }}>📊</div>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              No data yet — add transactions to see charts
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} barGap={4} margin={{ left: -10 }}>
              <XAxis
                dataKey="period"
                tick={{ fill: "#3d5570", fontSize: 12, fontFamily: "DM Sans" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#3d5570", fontSize: 11, fontFamily: "DM Sans" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <Tooltip content={<TTip />} />
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(26,45,69,0.6)"
                vertical={false}
              />
              <Bar
                dataKey="income"
                fill="#00e5a0"
                radius={[5, 5, 0, 0]}
                name="Income"
                maxBarSize={40}
              />
              <Bar
                dataKey="expense"
                fill="#ff4d6d"
                radius={[5, 5, 0, 0]}
                name="Expense"
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Savings trend + Radar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div className="card anim-up-3">
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 4,
            }}
          >
            Savings Trend
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              marginBottom: 14,
            }}
          >
            Monthly net savings
          </p>
          {data.length === 0 ? (
            <div
              style={{
                height: 160,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                Add transactions to see trend
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={data} margin={{ left: -15 }}>
                <defs>
                  <linearGradient id="gSav" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="period"
                  tick={{ fill: "#3d5570", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#3d5570", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v / 1000}k`}
                />
                <Tooltip content={<TTip />} />
                <Area
                  type="monotone"
                  dataKey="savings"
                  stroke="#00d4ff"
                  strokeWidth={2.5}
                  fill="url(#gSav)"
                  name="Savings"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card anim-up-4">
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 4,
            }}
          >
            Financial Score
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              marginBottom: 14,
            }}
          >
            Across 6 dimensions
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart
              data={RADAR}
              margin={{ top: 0, right: 20, bottom: 0, left: 20 }}
            >
              <PolarGrid stroke="rgba(26,45,69,0.8)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#3d5570", fontSize: 10 }}
              />
              <Radar
                name="Score"
                dataKey="A"
                stroke="#00d4ff"
                fill="rgba(0,212,255,0.15)"
                strokeWidth={2}
              />
              <Tooltip content={<TTip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
