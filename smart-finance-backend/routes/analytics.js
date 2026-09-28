import express from "express";
import Transaction from "../models/Transaction.js";
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

export default router;
