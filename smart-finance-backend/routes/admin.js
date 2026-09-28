import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Advisory from "../models/Advisory.js";
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";

const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// GET all registered users (excluding password)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET aggregated analytics of all users for dashboard
router.get("/users-analytics", async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).select("-password");
    
    const analytics = await Promise.all(
      users.map(async (u) => {
        const txns = await Transaction.find({ user: u._id });
        const totalIncome = txns
          .filter((t) => t.type === "income")
          .reduce((a, b) => a + b.amount, 0);
        const totalExpense = txns
          .filter((t) => t.type === "expense")
          .reduce((a, b) => a + b.amount, 0);
        const savings = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
        
        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          totalIncome,
          totalExpense,
          savings,
          savingsRate,
          transactionCount: txns.length,
        };
      })
    );
    
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a user's transactions
router.get("/users/:userId/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.params.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a user's financial summary
router.get("/users/:userId/summary", async (req, res) => {
  try {
    const userId = req.params.userId;
    const transactions = await Transaction.find({ user: userId });

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((a, b) => a + b.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((a, b) => a + b.amount, 0);

    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

    res.json({
      totalIncome,
      totalExpense,
      savings,
      savingsRate,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a user's monthly summary for charts
router.get("/users/:userId/analytics/monthly", async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const txns = await Transaction.find({
      user: req.params.userId,
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

// GET advisory for a specific user
router.get("/advisories/:userId", async (req, res) => {
  try {
    const advisory = await Advisory.findOne({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(advisory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST/PUT advisory for a user
router.post("/advisories", async (req, res) => {
  try {
    const { userId, advice } = req.body;
    if (!userId || !advice) {
      return res.status(400).json({ message: "User ID and advice content are required" });
    }

    // Check if advice already exists for this user, if so update it, else create new
    let advisory = await Advisory.findOne({ user: userId });

    if (advisory) {
      advisory.advice = advice;
      advisory.admin = req.user.id;
      await advisory.save();
    } else {
      advisory = await Advisory.create({
        user: userId,
        advice,
        admin: req.user.id,
      });
    }

    res.status(201).json(advisory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET anomalies for a specific user via Python Flask ML
router.get("/users/:userId/anomalies", async (req, res) => {
  try {
    const txns = await Transaction.find({
      user: req.params.userId,
      type: "expense",
    })
      .sort({ date: -1 })
      .limit(50);

    if (txns.length < 5) {
      return res.json({
        anomalies: [],
        mean: 0,
        std: 0,
        message: "Need at least 5 expenses for anomaly detection",
      });
    }

    // Call python service
    const FLASK_URL = "http://localhost:8000";
    const callFlaskService = async (endpoint, payload) => {
      const response = await fetch(`${FLASK_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Flask ML service returned status ${response.status}: ${errorText}`);
      }
      return response.json();
    };

    const transactions = txns.map((t) => t.toObject());
    const result = await callFlaskService("/anomalies", { transactions });
    res.json(result);
  } catch (err) {
    console.error("Admin ML anomalies error:", err.message);
    res.status(500).json({ message: "ML Service Error: " + err.message });
  }
});

// GET category breakdown for a specific user
router.get("/users/:userId/categories", async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    const txns = await Transaction.find({
      user: req.params.userId,
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

// GET category breakdown for all users combined (platform-wide)
router.get("/platform-categories", async (req, res) => {
  try {
    const txns = await Transaction.find({ type: "expense" });
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
