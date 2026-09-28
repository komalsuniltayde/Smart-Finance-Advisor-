import express from "express";
import Transaction from "../models/Transaction.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

const FLASK_URL = process.env.FLASK_URL || (process.env.VERCEL ? "" : "http://localhost:8000");

// Helper function to send request to Python Flask service
const callFlaskService = async (endpoint, payload) => {
  if (!FLASK_URL) throw new Error("FLASK_URL must point to the hosted Python service");
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

// ── HEALTH SCORE — Decision Tree / Rule-based Classifier ────────
router.get("/health", async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    const txns = await Transaction.find({
      user: req.user.id,
      date: { $gte: start },
    });
    const income = txns
      .filter((t) => t.type === "income")
      .reduce((a, b) => a + b.amount, 0);
    const expense = txns
      .filter((t) => t.type === "expense")
      .reduce((a, b) => a + b.amount, 0);

    const result = await callFlaskService("/health", { income, expense });
    res.json(result);
  } catch (err) {
    console.error("ML Health Error:", err.message);
    res.status(500).json({ message: "Error calculating health score from ML service: " + err.message });
  }
});

// ── SPENDING PREDICTION — Linear Regression ──────────────────────
router.get("/predict", async (req, res) => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const txns = await Transaction.find({
      user: req.user.id,
      type: "expense",
      date: { $gte: threeMonthsAgo },
    });

    if (txns.length < 2) {
      return res.json({
        nextMonth: null,
        trend: "insufficient data",
        message: "Add more transactions to unlock ML predictions",
        monthsAnalyzed: 0
      });
    }

    // Group expenses by month
    const monthly = {};
    txns.forEach((t) => {
      const key = new Date(t.date).toISOString().slice(0, 7);
      monthly[key] = (monthly[key] || 0) + t.amount;
    });

    const values = Object.values(monthly);

    if (values.length < 2) {
      return res.json({
        nextMonth: null,
        trend: "insufficient data",
        message: "Need at least 2 months of data for prediction",
        monthsAnalyzed: values.length
      });
    }

    const result = await callFlaskService("/predict", { values });
    res.json(result);
  } catch (err) {
    console.error("ML Predict Error:", err.message);
    res.status(500).json({ message: "Error running spending prediction from ML service: " + err.message });
  }
});

// ── ANOMALY DETECTION — Z-Score Method ──────────────────────────
router.get("/anomalies", async (req, res) => {
  try {
    const txns = await Transaction.find({
      user: req.user.id,
      type: "expense",
    })
      .sort({ date: -1 })
      .limit(50);

    if (txns.length < 5) {
      return res.json({
        anomalies: [],
        mean: 0,
        std: 0,
        message: "Need more transactions for anomaly detection",
      });
    }

    // Format transaction data objects to send to Flask
    const transactions = txns.map((t) => t.toObject());

    const result = await callFlaskService("/anomalies", { transactions });
    res.json(result);
  } catch (err) {
    console.error("ML Anomalies Error:", err.message);
    res.status(500).json({ message: "Error running anomaly detection from ML service: " + err.message });
  }
});

export default router;
