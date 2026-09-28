import express from "express";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

// Summary — for Dashboard KPI cards
router.get("/summary", async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    const txns = await Transaction.find({
      user: req.user.id,
      date: { $gte: start },
    });

    const totalIncome = txns
      .filter((t) => t.type === "income")
      .reduce((a, b) => a + b.amount, 0);
    const totalExpense = txns
      .filter((t) => t.type === "expense")
      .reduce((a, b) => a + b.amount, 0);
    const savings = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

    res.json({
      totalIncome,
      totalExpense,
      savings,
      savingsRate,
      count: txns.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Monthly — for charts
router.get("/monthly", async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const txns = await Transaction.find({
      user: req.user.id,
      date: { $gte: sixMonthsAgo },
    });

    const map = {};
    txns.forEach((t) => {
      const key = new Date(t.date).toLocaleString("default", {
        month: "short",
      });
      if (!map[key])
        map[key] = { period: key, income: 0, expense: 0, savings: 0 };
      if (t.type === "income") map[key].income += t.amount;
      if (t.type === "expense") map[key].expense += t.amount;
      map[key].savings = map[key].income - map[key].expense;
    });

    res.json(Object.values(map));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Category breakdown — for pie chart
router.get("/categories", async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    const txns = await Transaction.find({
      user: req.user.id,
      type: "expense",
      date: { $gte: start },
    });

    const map = {};
    txns.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });

    const total = Object.values(map).reduce((a, b) => a + b, 0);
    const result = Object.entries(map).map(([name, amount]) => ({
      name,
      amount,
      value: total > 0 ? Math.round((amount / total) * 100) : 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Weekly — aggregates current month into weekly buckets
router.get("/weekly", async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const txns = await Transaction.find({
      user: req.user.id,
      date: { $gte: start, $lte: end },
    });

    const weeks = [
      { period: "Week 1", income: 0, expense: 0, savings: 0 },
      { period: "Week 2", income: 0, expense: 0, savings: 0 },
      { period: "Week 3", income: 0, expense: 0, savings: 0 },
      { period: "Week 4", income: 0, expense: 0, savings: 0 },
    ];

    txns.forEach((t) => {
      const day = new Date(t.date).getDate();
      let idx;
      if (day <= 7) idx = 0;
      else if (day <= 14) idx = 1;
      else if (day <= 21) idx = 2;
      else idx = 3;

      if (t.type === "income") weeks[idx].income += t.amount;
      if (t.type === "expense") weeks[idx].expense += t.amount;
      weeks[idx].savings = weeks[idx].income - weeks[idx].expense;
    });

    res.json(weeks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Yearly — aggregates last 12 months into monthly buckets
router.get("/yearly", async (req, res) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const txns = await Transaction.find({
      user: req.user.id,
      date: { $gte: twelveMonthsAgo },
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Build ordered list of the last 12 months
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      months.push({ period: key, income: 0, expense: 0, savings: 0 });
    }

    const monthMap = {};
    months.forEach((m) => {
      monthMap[m.period] = m;
    });

    txns.forEach((t) => {
      const d = new Date(t.date);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthMap[key]) {
        if (t.type === "income") monthMap[key].income += t.amount;
        if (t.type === "expense") monthMap[key].expense += t.amount;
        monthMap[key].savings = monthMap[key].income - monthMap[key].expense;
      }
    });

    res.json(months);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Budget vs Actual — compares budgets to actual spending for current month
router.get("/budget-vs-actual", async (req, res) => {
  try {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const budgets = await Budget.find({ user: req.user.id, month });

    const txns = await Transaction.find({
      user: req.user.id,
      type: "expense",
      date: { $gte: start, $lte: end },
    });

    // Sum actual spending per category
    const spendingMap = {};
    txns.forEach((t) => {
      spendingMap[t.category] = (spendingMap[t.category] || 0) + t.amount;
    });

    const result = budgets.map((b) => {
      const actual = spendingMap[b.category] || 0;
      return {
        category: b.category,
        budget: b.limit,
        actual,
        remaining: b.limit - actual,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
