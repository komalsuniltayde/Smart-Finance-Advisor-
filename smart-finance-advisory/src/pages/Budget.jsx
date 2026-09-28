import React, { useState, useEffect } from "react";
import { useFinance } from "../context/FinanceContext.jsx";
import axios from "axios";

const DEFAULT_CATEGORIES = [
  { category: "Food & Dining", icon: "🍽", color: "#00d4ff" },
  { category: "Transport", icon: "🚗", color: "#00e5a0" },
  { category: "Shopping", icon: "🛍", color: "#ffb830" },
  { category: "Bills & Utilities", icon: "⚡", color: "#a78bfa" },
  { category: "Healthcare", icon: "💊", color: "#f472b6" },
  { category: "Entertainment", icon: "🎬", color: "#ff4d6d" },
];

function BudgetRow({ item, onEdit }) {
  const pct =
    item.limit > 0 ? Math.min((item.spent / item.limit) * 100, 100) : 0;
  const over = item.spent > item.limit && item.limit > 0;
  const warn = !over && pct >= 75;
  const bar = over ? "var(--red)" : warn ? "var(--amber)" : item.color;

  return (
    <div
      style={{
        padding: "18px 24px",
        borderBottom: "1px solid rgba(26,45,69,0.5)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: `${item.color}15`,
              border: `1px solid ${item.color}25`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            {item.icon}
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
                marginBottom: 2,
              }}
            >
              {item.category}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {over && (
                <span className="badge badge-red" style={{ fontSize: 10 }}>
                  ⚠ Overlimit
                </span>
              )}
              {warn && !over && (
                <span className="badge badge-amber" style={{ fontSize: 10 }}>
                  Near limit
                </span>
              )}
              {!over && !warn && item.limit > 0 && (
                <span className="badge badge-green" style={{ fontSize: 10 }}>
                  On track
                </span>
              )}
              {item.limit === 0 && (
                <span className="badge badge-blue" style={{ fontSize: 10 }}>
                  No limit set
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 15,
                fontWeight: 600,
                color: over ? "var(--red)" : "var(--text-primary)",
              }}
            >
              ₹{item.spent.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              of ₹{item.limit > 0 ? item.limit.toLocaleString() : "—"}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onEdit(item)}
            style={{ fontSize: 12 }}
          >
            Edit
          </button>
        </div>
      </div>
      {item.limit > 0 && (
        <>
          <div
            style={{
              height: 6,
              background: "var(--bg-elevated)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: bar,
                borderRadius: 3,
                transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {pct.toFixed(0)}% used
            </span>
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: over
                  ? "var(--red)"
                  : warn
                    ? "var(--amber)"
                    : "var(--text-muted)",
              }}
            >
              {over
                ? `₹${(item.spent - item.limit).toLocaleString()} over`
                : `₹${(item.limit - item.spent).toLocaleString()} left`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function EditModal({ item, onSave, onClose }) {
  const [val, setVal] = useState(item.limit || "");
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,10,16,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="card anim-up"
        style={{ width: 380, padding: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 17,
            }}
          >
            Set Budget — {item.category}
          </h3>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="label">Monthly Limit (₹)</label>
          <input
            className="input"
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Enter amount..."
            autoFocus
            style={{ fontSize: 18, fontFamily: "var(--font-mono)" }}
            onKeyDown={(e) =>
              e.key === "Enter" && onSave(item.category, Number(val))
            }
          />
          <p
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              marginTop: 8,
            }}
          >
            Current spend:{" "}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-primary)",
              }}
            >
              ₹{item.spent.toLocaleString()}
            </span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            style={{ flex: 1, justifyContent: "center" }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onSave(item.category, Number(val));
              onClose();
            }}
            style={{ flex: 2, justifyContent: "center" }}
          >
            Save Budget
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Budget() {
  const { saveBudget } = useFinance();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      // Get budgets from backend
      const budgetRes = await axios.get("/api/budgets");
      const budgetMap = {};
      budgetRes.data.forEach((b) => {
        budgetMap[b.category] = b;
      });

      // Get current month spending per category
      const catRes = await axios.get("/api/analytics/categories");
      const spentMap = {};
      catRes.data.forEach((c) => {
        spentMap[c.name] = c.amount;
      });

      // Merge with default categories
      const merged = DEFAULT_CATEGORIES.map((def) => ({
        ...def,
        limit: budgetMap[def.category]?.limit ?? 0,
        spent: spentMap[def.category] ?? 0,
        overlimit:
          (spentMap[def.category] ?? 0) >
            (budgetMap[def.category]?.limit ?? 0) &&
          (budgetMap[def.category]?.limit ?? 0) > 0,
      }));

      setItems(merged);
    } catch (err) {
      console.error("Budget load error:", err);
      // Fallback — show categories with 0 values
      setItems(
        DEFAULT_CATEGORIES.map((d) => ({
          ...d,
          limit: 0,
          spent: 0,
          overlimit: false,
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (category, limit) => {
    setItems((p) =>
      p.map((i) => (i.category === category ? { ...i, limit } : i)),
    );
    await saveBudget({ category, limit });
    await loadBudgets();
  };

  const overlimit = items.filter((i) => i.overlimit);
  const totalBudget = items.reduce((a, b) => a + b.limit, 0);
  const totalSpent = items.reduce((a, b) => a + b.spent, 0);
  const remaining = totalBudget - totalSpent;
  const overallPct =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  // Dynamic AI tips based on real data
  const tips = [];
  items.forEach((i) => {
    if (i.limit > 0 && i.spent > i.limit)
      tips.push({
        t: `${i.category} is ₹${(i.spent - i.limit).toLocaleString()} over budget. Try to reduce spending here.`,
        i: "⚠️",
      });
    else if (i.limit > 0 && i.spent / i.limit >= 0.75)
      tips.push({
        t: `${i.category} is at ${Math.round((i.spent / i.limit) * 100)}% of budget. Be careful!`,
        i: "💡",
      });
  });
  if (tips.length === 0)
    tips.push({
      t: "All categories are within budget. Great financial discipline!",
      i: "✅",
    });

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1200, margin: "0 auto" }}>
      {editing && (
        <EditModal
          item={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

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
          <h1>Budget Manager</h1>
          <p>Set monthly limits per category and track overlimit spending</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={loadBudgets}>
          ↻ Refresh
        </button>
      </div>

      {/* Overlimit Alert */}
      {overlimit.length > 0 && (
        <div
          className="anim-up-1"
          style={{
            marginBottom: 24,
            padding: "18px 22px",
            background: "rgba(255,77,109,0.07)",
            border: "1px solid rgba(255,77,109,0.22)",
            borderRadius: "var(--r-lg)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 15,
                color: "var(--red)",
              }}
            >
              Overlimit Alert — {overlimit.length}{" "}
              {overlimit.length === 1 ? "category" : "categories"} over budget!
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {overlimit.map((i) => (
              <div
                key={i.category}
                style={{
                  padding: "8px 14px",
                  background: "rgba(255,77,109,0.1)",
                  border: "1px solid rgba(255,77,109,0.2)",
                  borderRadius: "var(--r-md)",
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {i.icon} {i.category}
                </span>
                <span
                  style={{
                    color: "var(--red)",
                    fontFamily: "var(--font-mono)",
                    marginLeft: 8,
                  }}
                >
                  +₹{(i.spent - i.limit).toLocaleString()} over
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div
        className="anim-up-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[
          {
            l: "Total Budget",
            v: totalBudget > 0 ? `₹${totalBudget.toLocaleString()}` : "Not set",
            c: "var(--accent)",
          },
          {
            l: "Total Spent",
            v: `₹${totalSpent.toLocaleString()}`,
            c:
              totalSpent > totalBudget && totalBudget > 0
                ? "var(--red)"
                : "var(--amber)",
          },
          {
            l: "Remaining",
            v:
              totalBudget > 0
                ? `₹${Math.abs(remaining).toLocaleString()}`
                : "—",
            c: remaining >= 0 ? "var(--green)" : "var(--red)",
          },
          {
            l: "Over Budget",
            v: `${overlimit.length} of ${items.length}`,
            c: overlimit.length > 0 ? "var(--red)" : "var(--green)",
          },
        ].map((s) => (
          <div
            key={s.l}
            className="card"
            style={{ padding: "16px 20px", borderTop: `2px solid ${s.c}` }}
          >
            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontFamily: "var(--font-display)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 10,
              }}
            >
              {s.l}
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 20,
                fontWeight: 500,
                color: s.c,
              }}
            >
              {s.v}
            </p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      {totalBudget > 0 && (
        <div
          className="card anim-up-3"
          style={{ marginBottom: 20, padding: "20px 24px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Overall Budget Usage
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                color:
                  overallPct >= 100
                    ? "var(--red)"
                    : overallPct >= 80
                      ? "var(--amber)"
                      : "var(--green)",
              }}
            >
              {overallPct.toFixed(0)}%
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: "var(--bg-elevated)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${overallPct}%`,
                background:
                  overallPct >= 100
                    ? "var(--red)"
                    : overallPct >= 80
                      ? "var(--amber)"
                      : "var(--green)",
                borderRadius: 4,
                transition: "width 0.6s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              ₹{totalSpent.toLocaleString()} spent
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              ₹{totalBudget.toLocaleString()} budget
            </span>
          </div>
        </div>
      )}

      {/* Budget List + Tips */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}
      >
        <div
          className="card anim-up-4"
          style={{ padding: 0, overflow: "hidden" }}
        >
          <div
            style={{
              padding: "18px 24px",
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
              Category Budgets
            </h3>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Click Edit to change limit
            </span>
          </div>
          {loading ? (
            <div
              style={{
                padding: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <div className="spinner" />
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                Loading...
              </span>
            </div>
          ) : (
            items.map((item) => (
              <BudgetRow key={item.category} item={item} onEdit={setEditing} />
            ))
          )}
        </div>

        {/* AI Tips */}
        <div
          className="card anim-up-5"
          style={{
            background: "rgba(0,212,255,0.04)",
            border: "1px solid rgba(0,212,255,0.12)",
            alignSelf: "start",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 16 }}>◎</span>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 14,
                color: "var(--accent)",
              }}
            >
              AI Budget Recommendations
            </h3>
          </div>
          {tips.map((tip, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                padding: "10px 0",
                borderTop: i > 0 ? "1px solid rgba(0,212,255,0.08)" : "none",
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>{tip.i}</span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.55,
                }}
              >
                {tip.t}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
