import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ["#00d4ff", "#00e5a0", "#ffb830", "#a78bfa", "#ff4d6d", "#ff85a2", "#2dd4bf", "#94a3b8"];

const CATEGORY_COLORS = {
  "Food & Dining": "#00e5a0",      // Emerald green
  "Transport": "#ffb830",          // Amber
  "Shopping": "#a78bfa",           // Purple
  "Bills & Utilities": "#ff4d6d",   // Rose red
  "Healthcare": "#ff85a2",         // Pink
  "Entertainment": "#00d4ff",      // Cyan blue
  "Salary": "#4ade80",             // Green
  "Freelance": "#2dd4bf",          // Teal
  "Other": "#94a3b8",              // Slate gray
};

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

// Custom tooltip for platform-wide metrics
const PlatformTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-light)",
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: "var(--font-body)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <p
        style={{
          color: "var(--text-primary)",
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 6,
          fontFamily: "var(--font-display)"
        }}
      >
        👤 {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            color: p.color,
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            margin: "2px 0"
          }}
        >
          {p.name}: {p.name.includes("Rate") ? `${p.value}%` : `₹${p.value?.toLocaleString()}`}
        </p>
      ))}
    </div>
  );
};

// Custom tooltip for monthly user trend
const MonthlyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-light)",
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: "var(--font-body)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: 11,
          marginBottom: 5,
        }}
      >
        📅 {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            color: p.color,
            fontSize: 13,
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            margin: "2px 0"
          }}
        >
          {p.name}: ₹{p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// Custom Pie Chart tooltip
const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-light)",
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: "var(--font-body)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <p
        style={{
          color: "var(--text-primary)",
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {data.name}
      </p>
      <p
        style={{
          color: payload[0].color || "var(--accent)",
          fontSize: 12,
          fontFamily: "var(--font-mono)",
          margin: 0,
        }}
      >
        Amount: ₹{data.amount?.toLocaleString()} ({data.value}%)
      </p>
    </div>
  );
};

function StatCard({ label, value, color, icon }) {
  return (
    <div
      className="card"
      style={{
        borderTop: `2px solid ${color}`,
        padding: "18px 20px",
        flex: 1,
        minWidth: 160,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--text-muted)",
            fontFamily: "var(--font-display)",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </p>
        <span style={{ fontSize: 16, color }}>{icon}</span>
      </div>
      <p
        style={{
          fontSize: 22,
          fontWeight: 700,
          color,
          fontFamily: "var(--font-mono)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Overall Platform Overview States
  const [platformAnalytics, setPlatformAnalytics] = useState([]);
  const [platformCategories, setPlatformCategories] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Selected User Specific States
  const [userSummary, setUserSummary] = useState(null);
  const [userTransactions, setUserTransactions] = useState([]);
  const [userMonthlyData, setUserMonthlyData] = useState([]);
  const [userCategories, setUserCategories] = useState([]);
  const [userAnomalies, setUserAnomalies] = useState([]);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [loadingAnomalies, setLoadingAnomalies] = useState(false);
  const [advice, setAdvice] = useState("");
  const [existingAdvice, setExistingAdvice] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingAdvice, setSavingAdvice] = useState(false);

  // Budget Alert States
  const [overlimitUsers, setOverlimitUsers] = useState([]);
  const [loadingOverlimit, setLoadingOverlimit] = useState(true);
  const [sendingAlert, setSendingAlert] = useState({});
  const [sendingAllAlerts, setSendingAllAlerts] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPlatformAnalytics();
    fetchOverlimitUsers();
  }, []);

  const fetchOverlimitUsers = async () => {
    try {
      setLoadingOverlimit(true);
      const res = await axios.get("/api/admin/overlimit-users");
      setOverlimitUsers(res.data);
    } catch (err) {
      console.error("Failed to load overlimit users", err);
    } finally {
      setLoadingOverlimit(false);
    }
  };

  const handleSendAlertEmail = async (userId, userName, userEmail, category, budgetLimit, amountSpent) => {
    const key = `${userId}-${category}`;
    setSendingAlert((prev) => ({ ...prev, [key]: true }));
    try {
      await axios.post("/api/admin/send-alert-email", {
        userId,
        category,
        budgetLimit,
        amountSpent,
      });
      toast.success(`✉️ Budget alert email sent to ${userName} (${userEmail}) for ${category}`);
    } catch (err) {
      toast.error("Failed to send alert email: " + (err.response?.data?.message || err.message));
      return false; // return success status for bulk sender
    } finally {
      setSendingAlert((prev) => ({ ...prev, [key]: false }));
    }
    return true;
  };

  const handleSendAllAlerts = async () => {
    if (overlimitUsers.length === 0) {
      toast.info("No overlimit users to alert.");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to send warning emails to all ${overlimitUsers.length} over-budget users?`)) {
      return;
    }

    setSendingAllAlerts(true);
    let successCount = 0;
    let failCount = 0;

    for (const u of overlimitUsers) {
      for (const cat of u.overCategories) {
        const success = await handleSendAlertEmail(u.userId, u.userName, u.userEmail, cat.category, cat.budgetLimit, cat.amountSpent);
        if (success) successCount++;
        else failCount++;
      }
    }

    setSendingAllAlerts(false);
    
    if (failCount === 0) {
      toast.success(`🎉 All ${successCount} alerts sent successfully!`);
    } else {
      toast.error(`Sent ${successCount} alerts, but ${failCount} failed. Check console for details.`);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await axios.get("/api/admin/users");
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPlatformAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const [analyticsRes, categoriesRes] = await Promise.all([
        axios.get("/api/admin/users-analytics"),
        axios.get("/api/admin/platform-categories")
      ]);
      setPlatformAnalytics(analyticsRes.data);
      setPlatformCategories(categoriesRes.data);
    } catch (err) {
      toast.error("Failed to load platform analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const selectUser = async (user) => {
    setSelectedUser(user);
    setAdvice("");
    setExistingAdvice("");
    setUserSummary(null);
    setUserTransactions([]);
    setUserMonthlyData([]);
    setUserCategories([]);
    setUserAnomalies([]);
    setLoadingUserData(true);
    setLoadingAnomalies(true);

    try {
      const [summaryRes, txnsRes, advRes, monthlyRes, catRes, anomalyRes] = await Promise.all([
        axios.get(`/api/admin/users/${user._id}/summary`),
        axios.get(`/api/admin/users/${user._id}/transactions`),
        axios.get(`/api/admin/advisories/${user._id}`),
        axios.get(`/api/admin/users/${user._id}/analytics/monthly`),
        axios.get(`/api/admin/users/${user._id}/categories`),
        axios.get(`/api/admin/users/${user._id}/anomalies`),
      ]);
      setUserSummary(summaryRes.data);
      setUserTransactions(txnsRes.data);
      setUserMonthlyData(monthlyRes.data);
      setUserCategories(catRes.data);
      setUserAnomalies(anomalyRes.data?.anomalies || []);
      if (advRes.data?.advice) {
        setExistingAdvice(advRes.data.advice);
        setAdvice(advRes.data.advice);
      }
    } catch (err) {
      toast.error("Failed to load user data");
    } finally {
      setLoadingUserData(false);
      setLoadingAnomalies(false);
    }
  };

  const saveAdvice = async () => {
    if (!advice.trim()) {
      toast.error("Please enter advice before saving");
      return;
    }
    setSavingAdvice(true);
    try {
      await axios.post("/api/admin/advisories", {
        userId: selectedUser._id,
        advice: advice.trim(),
      });
      setExistingAdvice(advice.trim());
      toast.success(`Advisory saved for ${selectedUser.name}!`);
    } catch (err) {
      toast.error("Failed to save advisory");
    } finally {
      setSavingAdvice(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Platform Wide KPI Computations
  const totalPlatformIncome = platformAnalytics.reduce((sum, u) => sum + u.totalIncome, 0);
  const totalPlatformExpense = platformAnalytics.reduce((sum, u) => sum + u.totalExpense, 0);
  const totalPlatformSavings = totalPlatformIncome - totalPlatformExpense;
  const avgPlatformSavingsRate = platformAnalytics.length > 0
    ? Math.round(platformAnalytics.reduce((sum, u) => sum + u.savingsRate, 0) / platformAnalytics.length)
    : 0;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div
        className="anim-up"
        style={{
          padding: "24px 32px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-surface)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            ⚙
          </div>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 22,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Admin Advisory Panel
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              View user spending patterns and send personalized financial advice
            </p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span
              style={{
                background: "rgba(167,139,250,0.12)",
                border: "1px solid rgba(167,139,250,0.3)",
                color: "#a78bfa",
                padding: "4px 12px",
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                letterSpacing: "0.07em",
              }}
            >
              ADMIN ONLY
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Left: User List ── */}
        <div
          style={{
            width: 280,
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-surface)",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "16px 16px 10px" }}>
            <input
              type="text"
              placeholder="🔍  Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                padding: "9px 14px",
                color: "var(--text-primary)",
                fontSize: 13,
                fontFamily: "var(--font-body)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingLeft: 4 }}>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {filteredUsers.length} User{filteredUsers.length !== 1 ? "s" : ""}
              </p>
              {selectedUser && (
                <button
                  onClick={() => setSelectedUser(null)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--accent)",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                    fontFamily: "var(--font-display)"
                  }}
                >
                  📊 Show Overview
                </button>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingUsers ? (
              <div style={{ padding: 30, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    border: "3px solid var(--border)",
                    borderTopColor: "var(--accent)",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    margin: "0 auto 10px",
                  }}
                />
                Loading...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No users found
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUser?._id === u._id;
                return (
                  <div
                    key={u._id}
                    onClick={() => selectUser(u)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      cursor: "pointer",
                      background: isSelected ? "rgba(0,212,255,0.07)" : "transparent",
                      borderLeft: `3px solid ${isSelected ? "var(--accent)" : "transparent"}`,
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: isSelected
                          ? "linear-gradient(135deg, var(--accent), var(--purple))"
                          : "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        color: isSelected ? "var(--bg-base)" : "var(--text-secondary)",
                        flexShrink: 0,
                      }}
                    >
                      {u.name[0].toUpperCase()}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isSelected ? "var(--accent)" : "var(--text-primary)",
                          fontFamily: "var(--font-display)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {u.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {u.email}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: Main Analytical Area ── */}
        {!selectedUser ? (
          /* ═════════════════════════════════════════════════════════════════
             ALL USERS OVERVIEW / PLATFORM DASHBOARD (GRAPHICAL FORMAT)
             ═════════════════════════════════════════════════════════════════ */
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {/* Dashboard Title */}
            <div className="anim-up" style={{ marginBottom: 24 }}>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 20,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                📊 Platform Financial Summary & Comparison
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                Aggregated graphical financial performance metrics across all users
              </p>
            </div>

            {loadingAnalytics ? (
              <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    border: "3px solid var(--border)",
                    borderTopColor: "var(--accent)",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    margin: "0 auto 12px",
                  }}
                />
                Loading platform charts...
              </div>
            ) : platformAnalytics.length === 0 ? (
              <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📈</div>
                <p style={{ fontSize: 14 }}>No user financial data is available to generate charts</p>
              </div>
            ) : (
              <>
                {/* Platform Overview Stat Cards */}
                <div
                  className="anim-up-1"
                  style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}
                >
                  <StatCard
                    label="Platform Total Income"
                    value={`₹${totalPlatformIncome.toLocaleString()}`}
                    color="var(--green)"
                    icon="↑"
                  />
                  <StatCard
                    label="Platform Total Expenses"
                    value={`₹${totalPlatformExpense.toLocaleString()}`}
                    color="var(--red)"
                    icon="↓"
                  />
                  <StatCard
                    label="Net Platform Savings"
                    value={`₹${totalPlatformSavings.toLocaleString()}`}
                    color="var(--accent)"
                    icon="◈"
                  />
                  <StatCard
                    label="Avg Savings Rate"
                    value={`${avgPlatformSavingsRate}%`}
                    color="var(--purple)"
                    icon="◎"
                  />
                  <StatCard
                    label="Registered Users"
                    value={platformAnalytics.length}
                    color="var(--amber)"
                    icon="👥"
                  />
                </div>

                {/* Platform Graphs Section */}
                <div
                  className="anim-up-2"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
                    gap: 20,
                    marginBottom: 24,
                  }}
                >
                  {/* Chart 1: Income vs Expense Comparison */}
                  <div className="card">
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 15,
                        marginBottom: 4,
                      }}
                    >
                      User Earnings vs Spending
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 18 }}>
                      Total income and expense compared side-by-side per user
                    </p>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={platformAnalytics} margin={{ left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,45,69,0.5)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                        />
                        <Tooltip content={<PlatformTooltip />} />
                        <Legend iconType="circle" />
                        <Bar
                          dataKey="totalIncome"
                          fill="#00e5a0"
                          name="Total Income"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={30}
                        />
                        <Bar
                          dataKey="totalExpense"
                          fill="#ff4d6d"
                          name="Total Expenses"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chart 2: Platform Spending Category Breakdown */}
                  <div className="card">
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 15,
                        marginBottom: 4,
                      }}
                    >
                      🍕 Platform Expense Categories
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 18 }}>
                      Aggregate breakdown of spending distribution across the platform
                    </p>
                    {platformCategories.length === 0 ? (
                      <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No spending data recorded</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", height: 260 }}>
                        <div style={{ width: "50%", height: 260 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={platformCategories}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="amount"
                                nameKey="name"
                              >
                                {platformCategories.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip content={<PieTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ width: "45%", display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                          {platformCategories.map((entry, index) => (
                            <div key={entry.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length] }} />
                                <span style={{ color: "var(--text-secondary)" }}>{CAT_ICONS[entry.name] || "📋"} {entry.name}</span>
                              </div>
                              <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                                {entry.value}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Platform Users Overview Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24, alignItems: "start" }}>
                  {/* Left: Savings Rate comparison chart */}
                  <div className="card">
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 15,
                        marginBottom: 4,
                      }}
                    >
                      User Savings Rates (%)
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 18 }}>
                      The percentage of income each user is successfully saving
                    </p>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={platformAnalytics} margin={{ left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,45,69,0.5)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip content={<PlatformTooltip />} />
                        <Legend iconType="circle" />
                        <Bar
                          dataKey="savingsRate"
                          fill="#00d4ff"
                          name="Savings Rate"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Right: Table of users summaries */}
                  <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div
                      style={{
                        padding: "16px 20px 14px",
                        borderBottom: "1px solid var(--border)",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 700,
                          fontSize: 15,
                        }}
                      >
                        Registered User Summaries
                      </h3>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr
                            style={{
                              borderBottom: "1px solid var(--border)",
                              textAlign: "left",
                              fontSize: 10,
                              color: "var(--text-muted)",
                              fontFamily: "var(--font-display)",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                            }}
                          >
                            <th style={{ padding: "10px 16px" }}>User</th>
                            <th style={{ padding: "10px 16px" }}>Income</th>
                            <th style={{ padding: "10px 16px" }}>Expense</th>
                            <th style={{ padding: "10px 16px", textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {platformAnalytics.map((u, i) => (
                            <tr
                              key={u._id}
                              style={{
                                borderBottom: i !== platformAnalytics.length - 1 ? "1px solid rgba(26,45,69,0.3)" : "none",
                                fontSize: 12,
                                color: "var(--text-primary)",
                              }}
                            >
                              <td style={{ padding: "10px 16px" }}>
                                <div style={{ fontWeight: 600 }}>{u.name}</div>
                                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{u.email}</div>
                              </td>
                              <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", color: "var(--green)" }}>
                                ₹{u.totalIncome.toLocaleString()}
                              </td>
                              <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", color: "var(--red)" }}>
                                ₹{u.totalExpense.toLocaleString()}
                              </td>
                              <td style={{ padding: "10px 16px", textAlign: "right" }}>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => {
                                    const originalUser = users.find(orig => orig._id === u._id);
                                    if (originalUser) selectUser(originalUser);
                                  }}
                                  style={{
                                    padding: "4px 10px",
                                    fontSize: 11,
                                    background: "linear-gradient(135deg, var(--accent), var(--purple))",
                                    border: "none",
                                  }}
                                >
                                  Analyze
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* ══════ BUDGET ALERT CENTRE ══════ */}
                <div className="anim-up-4" style={{ marginTop: 24 }}>
                  <div
                    style={{
                      background: "var(--bg-card)",
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "18px 22px",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "linear-gradient(135deg, rgba(255,77,109,0.06), rgba(255,184,48,0.04))",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            fontSize: 15,
                            color: "#ff4d6d",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          🚨 Budget Alert Centre
                        </h3>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                          Users who exceeded their budget limits this month — send them a warning email
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        {overlimitUsers.length > 0 && (
                          <button
                            onClick={handleSendAllAlerts}
                            disabled={sendingAllAlerts}
                            style={{
                              background: sendingAllAlerts ? "rgba(255,77,109,0.5)" : "linear-gradient(135deg, #ff4d6d, #c9184a)",
                              border: "none",
                              color: "#fff",
                              padding: "6px 14px",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: sendingAllAlerts ? "not-allowed" : "pointer",
                              fontFamily: "var(--font-display)",
                              transition: "all 0.2s",
                              boxShadow: "0 4px 12px rgba(255,77,109,0.3)"
                            }}
                          >
                            {sendingAllAlerts ? "Sending All..." : "📨 Send All Alerts"}
                          </button>
                        )}
                        <button
                          onClick={fetchOverlimitUsers}
                          style={{
                            background: "rgba(255,77,109,0.1)",
                            border: "1px solid rgba(255,77,109,0.3)",
                            color: "#ff4d6d",
                            padding: "6px 14px",
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          ↻ Refresh
                        </button>
                      </div>
                    </div>

                    <div style={{ padding: "16px 22px" }}>
                      {loadingOverlimit ? (
                        <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              border: "3px solid var(--border)",
                              borderTopColor: "#ff4d6d",
                              borderRadius: "50%",
                              animation: "spin 0.7s linear infinite",
                              margin: "0 auto 10px",
                            }}
                          />
                          Scanning budgets...
                        </div>
                      ) : overlimitUsers.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: 30,
                            color: "var(--text-secondary)",
                          }}
                        >
                          <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                          <p style={{ fontSize: 13, fontWeight: 500 }}>All users are within their budget limits!</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>No alerts to send right now</p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {overlimitUsers.map((u) => (
                            <div
                              key={u.userId}
                              style={{
                                background: "var(--bg-elevated)",
                                borderRadius: 10,
                                border: "1px solid rgba(255,77,109,0.15)",
                                overflow: "hidden",
                              }}
                            >
                              {/* User header */}
                              <div
                                style={{
                                  padding: "12px 16px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  borderBottom: "1px solid var(--border)",
                                  background: "rgba(255,77,109,0.04)",
                                }}
                              >
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #ff4d6d, #ff85a2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#fff",
                                  }}
                                >
                                  {u.userName[0].toUpperCase()}
                                </div>
                                <div>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                                    {u.userName}
                                  </p>
                                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.userEmail}</p>
                                </div>
                                <div
                                  style={{
                                    marginLeft: "auto",
                                    background: "rgba(255,77,109,0.12)",
                                    color: "#ff4d6d",
                                    padding: "3px 10px",
                                    borderRadius: 100,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    fontFamily: "var(--font-display)",
                                  }}
                                >
                                  {u.overCategories.length} OVER LIMIT
                                </div>
                              </div>

                              {/* Category-wise alerts */}
                              <div style={{ padding: "10px 16px" }}>
                                {u.overCategories.map((cat, ci) => {
                                  const alertKey = `${u.userId}-${cat.category}`;
                                  const isSending = sendingAlert[alertKey] || false;
                                  return (
                                    <div
                                      key={ci}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "8px 0",
                                        borderBottom: ci < u.overCategories.length - 1 ? "1px solid var(--border)" : "none",
                                      }}
                                    >
                                      <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: "#e6ecf5", marginBottom: 3 }}>
                                          {CAT_ICONS[cat.category] || "📋"} {cat.category}
                                        </p>
                                        <div style={{ display: "flex", gap: 14, fontSize: 11, fontFamily: "var(--font-mono)" }}>
                                          <span style={{ color: "var(--text-secondary)" }}>
                                            Limit: ₹{cat.budgetLimit.toLocaleString()}
                                          </span>
                                          <span style={{ color: "#ff4d6d", fontWeight: 600 }}>
                                            Spent: ₹{cat.amountSpent.toLocaleString()}
                                          </span>
                                          <span style={{ color: "#ffb830", fontWeight: 600 }}>
                                            Over by: ₹{cat.overBy.toLocaleString()}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleSendAlertEmail(
                                            u.userId,
                                            u.userName,
                                            u.userEmail,
                                            cat.category,
                                            cat.budgetLimit,
                                            cat.amountSpent
                                          )
                                        }
                                        disabled={isSending}
                                        style={{
                                          background: isSending
                                            ? "rgba(255,77,109,0.1)"
                                            : "linear-gradient(135deg, #ff4d6d, #c9184a)",
                                          color: isSending ? "#ff4d6d" : "#fff",
                                          border: "none",
                                          padding: "7px 14px",
                                          borderRadius: 8,
                                          fontSize: 11,
                                          fontWeight: 700,
                                          cursor: isSending ? "not-allowed" : "pointer",
                                          fontFamily: "var(--font-display)",
                                          whiteSpace: "nowrap",
                                          minWidth: 100,
                                          textAlign: "center",
                                          transition: "all 0.2s",
                                        }}
                                      >
                                        {isSending ? "Sending..." : "📧 Send Alert"}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </>
            )}
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════════════
             INDIVIDUAL USER ANALYSIS & ADVISING PANEL (WITH USER GRAPHICS)
             ═════════════════════════════════════════════════════════════════ */
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

            {/* User Info Bar */}
            <div
              className="anim-up"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 24,
                padding: "16px 20px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent), var(--purple))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--bg-base)",
                  flexShrink: 0,
                }}
              >
                {selectedUser.name[0].toUpperCase()}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.02em",
                    display: "flex",
                    alignItems: "center",
                    gap: 10
                  }}
                >
                  {selectedUser.name}
                  <button
                    onClick={() => setSelectedUser(null)}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid var(--border-light)",
                      color: "var(--text-secondary)",
                      fontSize: 11,
                      padding: "3px 10px",
                      borderRadius: 100,
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      fontFamily: "var(--font-display)",
                      gap: 4
                    }}
                  >
                    ← Back to Overview
                  </button>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {selectedUser.email}
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <span
                  style={{
                    background: "rgba(0,229,160,0.1)",
                    border: "1px solid rgba(0,229,160,0.25)",
                    color: "var(--green)",
                    padding: "4px 10px",
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  ● Active User
                </span>
                {existingAdvice && (
                  <span
                    style={{
                      background: "rgba(167,139,250,0.1)",
                      border: "1px solid rgba(167,139,250,0.25)",
                      color: "#a78bfa",
                      padding: "4px 10px",
                      borderRadius: 100,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    ✓ Advised
                  </span>
                )}
              </div>
            </div>

            {loadingUserData ? (
              <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    border: "3px solid var(--border)",
                    borderTopColor: "var(--accent)",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    margin: "0 auto 12px",
                  }}
                />
                Loading user data...
              </div>
            ) : (
              <>
                {/* Financial Summary Cards */}
                {userSummary && (
                  <div
                    className="anim-up-1"
                    style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}
                  >
                    <StatCard
                      label="Total Income"
                      value={userSummary.totalIncome ? `₹${userSummary.totalIncome.toLocaleString()}` : "₹0"}
                      color="var(--green)"
                      icon="↑"
                    />
                    <StatCard
                      label="Total Expenses"
                      value={userSummary.totalExpense ? `₹${userSummary.totalExpense.toLocaleString()}` : "₹0"}
                      color="var(--red)"
                      icon="↓"
                    />
                    <StatCard
                      label="Net Savings"
                      value={userSummary.savings ? `₹${userSummary.savings.toLocaleString()}` : "₹0"}
                      color="var(--accent)"
                      icon="◈"
                    />
                    <StatCard
                      label="Savings Rate"
                      value={`${userSummary.savingsRate}%`}
                      color={userSummary.savingsRate >= 30 ? "var(--green)" : userSummary.savingsRate >= 10 ? "var(--amber)" : "var(--red)"}
                      icon="◎"
                    />
                    <StatCard
                      label="Transactions"
                      value={userTransactions.length || "0"}
                      color="var(--purple)"
                      icon="⇌"
                    />
                  </div>
                )}

                {/* GRAPHICAL FORMAT FOR SELECTED USER DATA */}
                <div
                  className="anim-up-2"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                    gap: 20,
                    marginBottom: 22,
                  }}
                >
                  {/* User's Income vs Expense trend over time */}
                  <div className="card">
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 14,
                        marginBottom: 4,
                      }}
                    >
                      Income vs Expenses History
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
                      Monthly earnings and spending patterns of {selectedUser.name}
                    </p>
                    {userMonthlyData.length === 0 ? (
                      <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Insufficient historical data</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={userMonthlyData} barGap={3} margin={{ left: -15 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,45,69,0.5)" vertical={false} />
                          <XAxis
                            dataKey="period"
                            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `₹${v / 1000}k`}
                          />
                          <Tooltip content={<MonthlyTooltip />} />
                          <Bar dataKey="income" fill="#00e5a0" name="Income" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="expense" fill="#ff4d6d" name="Expense" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* User Category Spending Pie Chart */}
                  <div className="card">
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 14,
                        marginBottom: 4,
                      }}
                    >
                      🍕 Expense Category Breakdown
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
                      Category spending share for current month
                    </p>
                    {userCategories.length === 0 ? (
                      <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No expenses recorded this month</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: 180 }}>
                        <div style={{ width: "50%", height: 180 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={userCategories}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={3}
                                dataKey="amount"
                                nameKey="name"
                              >
                                {userCategories.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip content={<PieTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ width: "45%", display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflowY: "auto" }}>
                          {userCategories.map((entry, index) => (
                            <div key={entry.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, overflow: "hidden" }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length], flexShrink: 0 }} />
                                <span style={{ color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.name}</span>
                              </div>
                              <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                                {entry.value}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User's Savings Trend Area */}
                  <div className="card">
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 14,
                        marginBottom: 4,
                      }}
                    >
                      Net Savings Trend
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
                      Historical monthly net savings flow
                    </p>
                    {userMonthlyData.length === 0 ? (
                      <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Insufficient historical data</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={userMonthlyData} margin={{ left: -15 }}>
                          <defs>
                            <linearGradient id="userSav" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,45,69,0.5)" vertical={false} />
                          <XAxis
                            dataKey="period"
                            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `₹${v / 1000}k`}
                          />
                          <Tooltip content={<MonthlyTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="savings"
                            stroke="#00d4ff"
                            strokeWidth={2}
                            fill="url(#userSav)"
                            name="Savings"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* ML ANOMALIES & AUDIT SECTION */}
                <div className="anim-up-3" style={{ marginBottom: 22 }}>
                  {loadingAnomalies ? (
                    <div className="card" style={{ textAlign: "center", padding: 20 }}>
                      <div className="spinner" style={{ width: 18, height: 18, margin: "0 auto 8px" }} />
                      <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>ML Outlier detector scanning transactions...</p>
                    </div>
                  ) : userAnomalies.length > 0 ? (
                    <div
                      className="card"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,77,109,0.06), rgba(255,184,48,0.03))",
                        border: "1px solid rgba(255,77,109,0.25)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <span style={{ fontSize: 20 }}>🚨</span>
                        <div>
                          <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--red)" }}>
                            ML Detected Spending Anomalies
                          </h4>
                          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                            The Python Z-Score ML service flagged {userAnomalies.length} transaction{userAnomalies.length > 1 ? "s" : ""} as statistical outliers.
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                        {userAnomalies.map((anom, index) => (
                          <div
                            key={index}
                            style={{
                              background: "rgba(26,45,69,0.4)",
                              border: "1px solid rgba(255,77,109,0.15)",
                              borderRadius: "var(--r-md)",
                              padding: "12px 14px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                                {CAT_ICONS[anom.category] || "📋"} {anom.category}
                              </div>
                              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                                {anom.note || "No details"} · {new Date(anom.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ color: "var(--red)", fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: 13 }}>
                                -₹{anom.amount.toLocaleString()}
                              </div>
                              <div
                                style={{
                                  fontSize: 9,
                                  color: "var(--amber)",
                                  fontWeight: 600,
                                  background: "rgba(255,184,48,0.1)",
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                  marginTop: 2,
                                  display: "inline-block"
                                }}
                              >
                                {anom.zScore}x Outlier
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="card"
                      style={{
                        background: "linear-gradient(135deg, rgba(0,229,160,0.06), rgba(0,212,255,0.03))",
                        border: "1px solid rgba(0,229,160,0.2)",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 18px"
                      }}
                    >
                      <span style={{ fontSize: 18, color: "var(--green)" }}>✓</span>
                      <div>
                        <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--green)" }}>
                          No Outlier Spending Anomalies Detected
                        </h4>
                        <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 1 }}>
                          The Python ML Z-Score service has analyzed this user's expenses and found all transactions within normal boundaries.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Transactions & Advisory block */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
                  
                  {/* Recent Transactions */}
                  <div
                    className="card anim-up-4"
                    style={{ padding: 0, overflow: "hidden", marginBottom: 4 }}
                  >
                    <div
                      style={{
                        padding: "16px 20px 12px",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
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
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Showing last {Math.min(userTransactions.length, 8)} of {userTransactions.length}
                      </span>
                    </div>
                    {userTransactions.length === 0 ? (
                      <div
                        style={{
                          padding: 30,
                          textAlign: "center",
                          color: "var(--text-muted)",
                          fontSize: 13,
                        }}
                      >
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                        No transactions found for this user
                      </div>
                    ) : (
                      userTransactions.slice(0, 8).map((t, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "11px 20px",
                            borderBottom: "1px solid rgba(26,45,69,0.4)",
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
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
                              {t.note || "No note"} ·{" "}
                              {new Date(t.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 14,
                              fontWeight: 700,
                              color: t.type === "income" ? "var(--green)" : "var(--red)",
                            }}
                          >
                            {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Advisory Text Area */}
                  <div
                    className="card anim-up-5"
                    style={{
                      background: "linear-gradient(135deg, rgba(167,139,250,0.05), rgba(0,212,255,0.03))",
                      border: "1px solid rgba(167,139,250,0.2)",
                    }}
                  >
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 18 }}>📋</span>
                        <h3
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            fontSize: 16,
                            color: "var(--text-primary)",
                          }}
                        >
                          Financial Advisory
                        </h3>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", paddingLeft: 28 }}>
                        Write personalized spending advice for {selectedUser.name}. This will be displayed on their dashboard.
                      </p>
                    </div>

                    <textarea
                      value={advice}
                      onChange={(e) => setAdvice(e.target.value)}
                      placeholder={`Write your financial advice for ${selectedUser.name}...\n\nFor example:\n• Your Food & Dining spending is 40% above average — consider cooking at home 3x per week.\n• You have excellent savings discipline this month. Consider investing surplus in an SIP.\n• Set a strict ₹5,000/month limit for Shopping to improve your savings rate.`}
                      rows={8}
                      style={{
                        width: "100%",
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r-md)",
                        padding: "14px 16px",
                        color: "var(--text-primary)",
                        fontSize: 13,
                        fontFamily: "var(--font-body)",
                        lineHeight: 1.7,
                        resize: "vertical",
                        outline: "none",
                        boxSizing: "border-box",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(167,139,250,0.5)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                    />

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 14,
                      }}
                    >
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {existingAdvice
                          ? "✓ This user already has advice — saving will update it."
                          : "No advice has been sent to this user yet."}
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={saveAdvice}
                        disabled={savingAdvice || !advice.trim()}
                        style={{
                          background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                          border: "none",
                          minWidth: 130,
                        }}
                      >
                        {savingAdvice ? (
                          <span className="spinner" style={{ width: 16, height: 16 }} />
                        ) : (
                          existingAdvice ? "✓ Update Advisory" : "📤 Send Advisory"
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
