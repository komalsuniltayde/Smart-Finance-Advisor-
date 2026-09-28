import React, { useEffect, useState } from "react";
import { useFinance } from "../context/FinanceContext.jsx";
import toast from "react-hot-toast";

const EXPENSE_CATS = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Healthcare",
  "Entertainment",
  "Education",
  "Personal Care",
  "Other",
];
const INCOME_CATS = [
  "Salary",
  "Freelance",
  "Business",
  "Investment Returns",
  "Other Income",
];
const MOCK = [
  {
    _id: "1",
    type: "income",
    category: "Salary",
    amount: 55000,
    note: "January salary",
    date: "2025-01-01",
  },
  {
    _id: "2",
    type: "income",
    category: "Freelance",
    amount: 8000,
    note: "Website project",
    date: "2025-01-08",
  },
  {
    _id: "3",
    type: "expense",
    category: "Food & Dining",
    amount: 1200,
    note: "Restaurant lunch",
    date: "2025-01-15",
  },
  {
    _id: "4",
    type: "expense",
    category: "Shopping",
    amount: 3200,
    note: "Amazon order",
    date: "2025-01-13",
  },
  {
    _id: "5",
    type: "expense",
    category: "Bills & Utilities",
    amount: 2100,
    note: "Electricity bill",
    date: "2025-01-10",
  },
  {
    _id: "6",
    type: "expense",
    category: "Transport",
    amount: 450,
    note: "Uber rides",
    date: "2025-01-14",
  },
  {
    _id: "7",
    type: "expense",
    category: "Healthcare",
    amount: 800,
    note: "Pharmacy",
    date: "2025-01-12",
  },
  {
    _id: "8",
    type: "expense",
    category: "Entertainment",
    amount: 600,
    note: "Netflix + Spotify",
    date: "2025-01-05",
  },
];

function AddModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    type: "expense",
    category: "Food & Dining",
    amount: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [busy, setBusy] = useState(false);
  const cats = form.type === "income" ? INCOME_CATS : EXPENSE_CATS;
  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusy(true);
    await onAdd({ ...form, amount: parseFloat(form.amount) });
    setBusy(false);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="card" style={{ padding: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 20,
                }}
              >
                Add Transaction
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  marginTop: 2,
                }}
              >
                Record income or expense
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{ padding: "6px 10px", fontSize: 16 }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={submit}>
            {/* Type */}
            <div style={{ marginBottom: 18 }}>
              <label className="label">Transaction type</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {["expense", "income"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        type: t,
                        category: t === "income" ? "Salary" : "Food & Dining",
                      }))
                    }
                    className="btn"
                    style={{
                      justifyContent: "center",
                      padding: "11px",
                      background:
                        form.type === t
                          ? t === "income"
                            ? "rgba(0,229,160,0.15)"
                            : "rgba(255,77,109,0.15)"
                          : "var(--bg-elevated)",
                      color:
                        form.type === t
                          ? t === "income"
                            ? "var(--green)"
                            : "var(--red)"
                          : "var(--text-secondary)",
                      border: `1px solid ${form.type === t ? (t === "income" ? "rgba(0,229,160,0.4)" : "rgba(255,77,109,0.4)") : "var(--border)"}`,
                      fontWeight: form.type === t ? 600 : 400,
                    }}
                  >
                    {t === "income" ? "↑ Income" : "↓ Expense"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Category</label>
              <select
                className="input"
                name="category"
                value={form.category}
                onChange={handle}
              >
                {cats.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <label className="label">Amount (₹)</label>
                <input
                  className="input"
                  name="amount"
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handle}
                  required
                  min="1"
                  step="0.01"
                />
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  className="input"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handle}
                  required
                />
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Note (optional)</label>
              <input
                className="input"
                name="note"
                placeholder="What was this for?"
                value={form.note}
                onChange={handle}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: "center" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary"
                style={{ flex: 2, justifyContent: "center" }}
              >
                {busy ? (
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                ) : (
                  `Add ${form.type === "income" ? "Income" : "Expense"}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  const {
    transactions,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
    loading,
  } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const list = transactions
    .filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.category.toLowerCase().includes(q) ||
          (t.note || "").toLowerCase().includes(q)
        );
      }
      return true;
    })

    .sort((a, b) =>
      sort === "date"
        ? new Date(b.date) - new Date(a.date)
        : b.amount - a.amount,
    );

  const totalIncome = list
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = list
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  // const handleAdd = async (data) => {
  //   if (transactions.length) await addTransaction(data);
  //   else toast.success("Transaction added! (Connect backend to persist)");
  // };

  const handleAdd = async (d) => {
    await addTransaction(d);
  };

  const handleDelete = (id) => {
    if (transactions.length) deleteTransaction(id);
    else toast.success("Deleted (demo mode)");
  };

  return (
    <div className="page">
      {showAdd && (
        <AddModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      )}

      {/* Header */}
      <div
        className="anim-up page-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1>Transactions</h1>
          <p>
            {list.length} records · {filter === "all" ? "All types" : filter}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add Transaction
        </button>
      </div>

      {/* Summary bar */}
      <div
        className="anim-up-1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "Total Income",
            value: `₹${totalIncome.toLocaleString("en-IN")}`,
            color: "var(--green)",
          },
          {
            label: "Total Expenses",
            value: `₹${totalExpense.toLocaleString("en-IN")}`,
            color: "var(--red)",
          },
          {
            label: "Net",
            value: `₹${(totalIncome - totalExpense).toLocaleString("en-IN")}`,
            color: "var(--accent)",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="card"
            style={{ padding: "14px 18px", borderTop: `2px solid ${s.color}` }}
          >
            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                fontFamily: "var(--font-display)",
                marginBottom: 6,
              }}
            >
              {s.label}
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 18,
                color: s.color,
                fontWeight: 600,
              }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        className="card anim-up-2"
        style={{
          marginBottom: 18,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <input
          className="input"
          placeholder="🔍  Search category or note..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 260, flex: 1 }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "income", "expense"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`}
              style={{ textTransform: "capitalize" }}
            >
              {f}
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginLeft: "auto",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Sort:
          </span>
          <select
            className="input"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ width: "auto", padding: "7px 12px", fontSize: 13 }}
          >
            <option value="date">By Date</option>
            <option value="amount">By Amount</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div
        className="card anim-up-3"
        style={{ padding: 0, overflow: "hidden" }}
      >
        {loading ? (
          <div
            style={{
              padding: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Note</th>
                <th>Type</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      color: "var(--text-muted)",
                      padding: 48,
                      fontSize: 14,
                    }}
                  >
                    No transactions found
                  </td>
                </tr>
              )}
              {list.map((t) => (
                <tr key={t._id}>
                  <td
                    style={{
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {new Date(t.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background:
                            t.type === "income"
                              ? "rgba(0,229,160,0.1)"
                              : "rgba(255,77,109,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          flexShrink: 0,
                        }}
                      >
                        {t.type === "income" ? "↑" : "↓"}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>
                        {t.category}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    {t.note || "—"}
                  </td>
                  <td>
                    <span
                      className={`badge ${t.type === "income" ? "badge-green" : "badge-red"}`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      fontSize: 14,
                      color:
                        t.type === "income" ? "var(--green)" : "var(--red)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.type === "income" ? "+" : "-"} ₹
                    {t.amount?.toLocaleString("en-IN")}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(t._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
