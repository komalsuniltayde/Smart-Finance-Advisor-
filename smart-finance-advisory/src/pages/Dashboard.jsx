import React, { useEffect, useState } from "react";
import { useFinance } from "../context/FinanceContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import axios from "axios";

const COLORS = ["#00d4ff", "#00e5a0", "#ffb830", "#a78bfa", "#ff4d6d"];

const ChartTip = ({ active, payload, label }) => {
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
          marginBottom: 6,
        }}
      >
        {label}
      </p>
      {payload.map((p, i) => (
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
      ))}
    </div>
  );
};

function KpiCard({ label, value, sub, color, icon, delay, change }) {
  return (
    <div
      className={`card anim-up-${delay}`}
      style={{ borderTop: `2px solid ${color}`, padding: "22px 24px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            fontFamily: "var(--font-display)",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </p>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            color,
          }}
        >
          {icon}
        </div>
      </div>
      <p className="stat-number" style={{ color, marginBottom: 6 }}>
        {value}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</p>
        {change !== undefined && (
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: change >= 0 ? "var(--green)" : "var(--red)",
              background:
                change >= 0 ? "rgba(0,229,160,0.1)" : "rgba(255,77,109,0.1)",
              padding: "2px 7px",
              borderRadius: 100,
            }}
          >
            {change >= 0 ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
    </div>
  );
}

function HealthBadge({ rating, score }) {
  const map = {
    Good: ["var(--green)", "▲"],
    Neutral: ["var(--amber)", "◆"],
    Bad: ["var(--red)", "▼"],
  };
  const [color, icon] = map[rating] || map["Good"];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 22px",
        background: `${color}0d`,
        border: `1px solid ${color}25`,
        borderRadius: "var(--r-lg)",
        flex: 1,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          color,
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            fontFamily: "var(--font-display)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 2,
          }}
        >
          Financial Health
        </p>
        <p
          style={{
            fontSize: 18,
            fontWeight: 700,
            color,
            fontFamily: "var(--font-display)",
          }}
        >
          {rating}
        </p>
      </div>
      <div style={{ marginLeft: "auto", textAlign: "right" }}>
        <p
          style={{
            fontSize: 28,
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            color,
            lineHeight: 1,
          }}
        >
          {score}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>/ 100</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const {
    summary,
    fetchSummary,
    fetchHealthScore,
    healthScore,
    fetchPrediction,
    prediction,
    fetchTransactions,
    transactions,
  } = useFinance();
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminAdvice, setAdminAdvice] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      await fetchSummary();
      await fetchHealthScore();
      await fetchPrediction();
      await fetchTransactions();

      // Monthly chart data
      const monthly = await axios.get("/api/analytics/monthly");
      setMonthlyData(monthly.data);

      // Category pie data
      const cats = await axios.get("/api/analytics/categories");
      setCategoryData(cats.data);

      // Budget alerts
      try {
        const budgets = await axios.get("/api/budgets");
        const overlimit = budgets.data.filter((b) => b.overlimit);
        setAlerts(
          overlimit.map((b) => ({
            type: "danger",
            msg: `${b.category} exceeded budget by ₹${(b.spent - b.limit).toLocaleString()}`,
            icon: "⚠",
          })),
        );
      } catch {}

      // Fetch admin advisory for current user
      try {
        const advRes = await axios.get("/api/advisories");
        if (advRes.data?.advice) setAdminAdvice(advRes.data.advice);
        else setAdminAdvice(null);
      } catch {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const income = summary?.totalIncome ?? 0;
  const expense = summary?.totalExpense ?? 0;
  const savings = summary?.savings ?? 0;
  const savingsRate = summary?.savingsRate ?? 0;
  const health = healthScore?.rating ?? "Good";
  const score = healthScore?.score ?? 0;
  const nextMonth = prediction?.nextMonth ?? null;
  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const recentTxns = transactions.slice(0, 5);

  const CAT_ICONS = {
    "Food & Dining": "🍽",
    Transport: "🚗",
    Shopping: "🛍",
    "Bills & Utilities": "⚡",
    Healthcare: "💊",
    Entertainment: "🎬",
    Salary: "💼",
    Freelance: "💻",
    Other: "📋",
  };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div
        className="anim-up"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 28,
              color: "var(--text-primary)",
              marginBottom: 4,
              letterSpacing: "-0.02em",
            }}
          >
            {greet}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Here's your real-time financial overview
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={loadAll}>
          ↻ Refresh
        </button>
      </div>

      {/* Admin Advisory Card — shown only when admin has sent advice */}
      {adminAdvice && (
        <div
          className="anim-up"
          style={{
            marginBottom: 28,
            padding: "18px 22px",
            background: "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(0,212,255,0.05))",
            border: "1px solid rgba(167,139,250,0.25)",
            borderRadius: "var(--r-lg)",
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            📋
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#a78bfa",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                Advisory from Your Financial Advisor
              </p>
              <span
                style={{
                  background: "rgba(167,139,250,0.15)",
                  border: "1px solid rgba(167,139,250,0.3)",
                  color: "#a78bfa",
                  padding: "2px 8px",
                  borderRadius: 100,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                NEW
              </span>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-primary)",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {adminAdvice}
            </p>
          </div>
        </div>
      )}

      {/* Health + Prediction banner */}
      <div
        className="anim-up-1"
        style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}
      >
        <HealthBadge rating={health} score={score} />

        <div
          style={{
            flex: 1,
            minWidth: 220,
            padding: "16px 22px",
            background: "rgba(167,139,250,0.06)",
            border: "1px solid rgba(167,139,250,0.15)",
            borderRadius: "var(--r-lg)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(167,139,250,0.12)",
              border: "1px solid rgba(167,139,250,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              color: "var(--purple)",
            }}
          >
            ◈
          </div>
          <div>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontFamily: "var(--font-display)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 2,
              }}
            >
              ML Prediction — Next Month
            </p>
            <p
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--purple)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {nextMonth ? `₹${nextMonth.toLocaleString()}` : "Add more data"}
            </p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span className="badge badge-purple">AI Powered</span>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 220,
            padding: "16px 22px",
            background: "rgba(0,229,160,0.05)",
            border: "1px solid rgba(0,229,160,0.15)",
            borderRadius: "var(--r-lg)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(0,229,160,0.1)",
              border: "1px solid rgba(0,229,160,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              color: "var(--green)",
            }}
          >
            ◎
          </div>
          <div>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontFamily: "var(--font-display)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 2,
              }}
            >
              Savings Rate
            </p>
            <p
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--green)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {savingsRate}% of income
            </p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span
              className={`badge ${savingsRate >= 30 ? "badge-green" : savingsRate >= 10 ? "badge-amber" : "badge-red"}`}
            >
              {savingsRate >= 30
                ? "On Track"
                : savingsRate >= 10
                  ? "Neutral"
                  : "Low"}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 18,
          marginBottom: 24,
        }}
      >
        <KpiCard
          label="Monthly Income"
          value={income ? `₹${(income / 1000).toFixed(1)}K` : "₹0"}
          sub="Total income this month"
          color="var(--green)"
          icon="↑"
          delay={1}
        />
        <KpiCard
          label="Total Expenses"
          value={expense ? `₹${(expense / 1000).toFixed(1)}K` : "₹0"}
          sub="Spent across categories"
          color="var(--red)"
          icon="↓"
          delay={2}
        />
        <KpiCard
          label="Net Savings"
          value={savings ? `₹${(savings / 1000).toFixed(1)}K` : "₹0"}
          sub="Income minus expenses"
          color="var(--accent)"
          icon="◈"
          delay={3}
        />
        <KpiCard
          label="Transactions"
          value={transactions.length || "0"}
          sub="Total records this month"
          color="var(--purple)"
          icon="⇌"
          delay={4}
        />
      </div>

      {/* Charts Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.65fr 1fr",
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Area Chart */}
        <div className="card anim-up-3">
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
                Monthly trend from your real data
              </p>
            </div>
            <span className="badge badge-blue">Live</span>
          </div>
          {monthlyData.length === 0 ? (
            <div
              style={{
                height: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 36 }}>📊</div>
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                Add transactions to see chart
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={monthlyData}
                margin={{ top: 5, right: 0, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5a0" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00e5a0" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4d6d" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="period"
                  tick={{ fill: "#3d5570", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#3d5570", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v / 1000}k`}
                />
                <Tooltip content={<ChartTip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#00e5a0"
                  strokeWidth={2.5}
                  fill="url(#gIncome)"
                  name="Income"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ff4d6d"
                  strokeWidth={2.5}
                  fill="url(#gExpense)"
                  name="Expense"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="card anim-up-4">
          <div style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 2,
              }}
            >
              Expense Breakdown
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              By category this month
            </p>
          </div>
          {categoryData.length === 0 ? (
            <div
              style={{
                height: 160,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 32 }}>🥧</div>
              <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                No expenses yet
              </p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={72}
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
                        <div
                          style={{
                            background: "rgba(11,17,30,0.95)",
                            border: `1px solid ${d.payload.fill || "#333"}`,
                            borderRadius: 10,
                            padding: "10px 16px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                          }}
                        >
                          <p
                            style={{
                              color: d.payload.fill || "#fff",
                              fontSize: 13,
                              fontWeight: 700,
                              marginBottom: 2,
                            }}
                          >
                            {d.name}
                          </p>
                          <p
                            style={{
                              color: "#ffffff",
                              fontSize: 14,
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                            }}
                          >
                            {d.value}%
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  marginTop: 8,
                }}
              >
                {categoryData.slice(0, 5).map((e, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 13,
                      padding: "3px 0",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: COLORS[i % COLORS.length],
                          boxShadow: `0 0 6px ${COLORS[i % COLORS.length]}55`,
                        }}
                      />
                      <span style={{ color: "#e6ecf5", fontWeight: 500 }}>
                        {e.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: COLORS[i % COLORS.length],
                        fontWeight: 600,
                      }}
                    >
                      {e.value}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Recent Transactions */}
        <div
          className="card anim-up-5"
          style={{ padding: 0, overflow: "hidden" }}
        >
          <div
            style={{
              padding: "20px 24px 14px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Recent Transactions
            </h3>
          </div>
          {recentTxns.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
              No transactions yet
            </div>
          ) : (
            recentTxns.map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "13px 24px",
                  borderBottom: "1px solid rgba(26,45,69,0.4)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {CAT_ICONS[t.category] || "📋"}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {t.category}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {new Date(t.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: t.type === "income" ? "var(--green)" : "var(--red)",
                  }}
                >
                  {t.type === "income" ? "+" : "-"} ₹
                  {t.amount?.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Alerts */}
        <div className="card anim-up-6">
          <div style={{ marginBottom: 18 }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 2,
              }}
            >
              Smart Alerts
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              AI-powered spending notifications
            </p>
          </div>
          {alerts.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                No alerts — you are within budget!
              </p>
            </div>
          ) : (
            alerts.map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "14px 16px",
                  borderRadius: "var(--r-md)",
                  background: "rgba(255,77,109,0.07)",
                  border: "1px solid rgba(255,77,109,0.18)",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(255,77,109,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    color: "var(--red)",
                    flexShrink: 0,
                  }}
                >
                  {a.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-primary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {a.msg}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
