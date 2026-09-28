import express from "express";
import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

// GET all budgets with spent amount
router.get("/", async (req, res) => {
  try {
    const month = new Date().toISOString().slice(0, 7);
    const budgets = await Budget.find({ user: req.user.id, month });

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const txns = await Transaction.find({
      user: req.user.id,
      type: "expense",
      date: { $gte: start },
    });

    // Calculate spent per category
    const spentMap = {};
    txns.forEach((t) => {
      spentMap[t.category] = (spentMap[t.category] || 0) + t.amount;
    });

    const result = budgets.map((b) => ({
      ...b.toObject(),
      spent: spentMap[b.category] || 0,
      overlimit: (spentMap[b.category] || 0) > b.limit,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SAVE budget
router.post("/", async (req, res) => {
  try {
    const { category, limit } = req.body;
    const month = new Date().toISOString().slice(0, 7);

    const budget = await Budget.findOneAndUpdate(
      { user: req.user.id, category, month },
      { limit },
      { new: true, upsert: true },
    );
    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
