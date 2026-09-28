import express from "express";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import User from "../models/User.js";
import BudgetAlert from "../models/BudgetAlert.js";
import authMiddleware from "../middleware/auth.js";
import { sendOverlimitEmail, sendAdminOverlimitNotification } from "../services/emailService.js";

const router = express.Router();
router.use(authMiddleware);

// GET all transactions
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({
      date: -1,
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADD transaction
router.post("/", async (req, res) => {
  try {
    const { type, category, amount, note, date } = req.body;
    if (!type || !category || !amount)
      return res
        .status(400)
        .json({ message: "Type, category and amount are required" });

    const txn = await Transaction.create({
      user: req.user.id,
      type,
      category,
      amount: parseFloat(amount),
      note: note || "",
      date: date || Date.now(),
    });

    // Check budget overlimit alert asynchronously (non-blocking)
    if (type === "expense") {
      (async () => {
        try {
          const parsedAmount = parseFloat(amount);
          const txnDate = date ? new Date(date) : new Date();
          const month = txnDate.toISOString().slice(0, 7);

          const budget = await Budget.findOne({ user: req.user.id, category, month });
          if (budget) {
            // Sum all other expenses in this category for this month
            const start = new Date(txnDate.getFullYear(), txnDate.getMonth(), 1);
            const otherTxns = await Transaction.find({
              user: req.user.id,
              type: "expense",
              category,
              date: { $gte: start },
              _id: { $ne: txn._id }
            });

            const prevSpent = otherTxns.reduce((a, b) => a + b.amount, 0);
            const totalSpent = prevSpent + parsedAmount;

            // Trigger alert email ONLY if it JUST crossed the threshold
            if (prevSpent <= budget.limit && totalSpent > budget.limit) {
              const user = await User.findById(req.user.id);
              if (user && user.email) {
                const overBy = totalSpent - budget.limit;
                console.log(`⚠️ Budget Breached: ${user.name} exceeded limit for ${category} (Spent: ${totalSpent}, Limit: ${budget.limit})`);
                
                // Save alert to database
                await BudgetAlert.create({
                  user: user._id,
                  category,
                  budgetLimit: budget.limit,
                  amountSpent: totalSpent,
                  overBy,
                  emailSentToUser: true,
                  emailSentToAdmin: true,
                  month,
                });

                await sendOverlimitEmail(user, category, budget.limit, totalSpent);
                await sendAdminOverlimitNotification(user, category, budget.limit, totalSpent);
              }
            }
          }
        } catch (error) {
          console.error("❌ Budget Breached Email Error:", error.message);
        }
      })();
    }

    res.status(201).json(txn);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE transaction
router.delete("/:id", async (req, res) => {
  try {
    const txn = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!txn) return res.status(404).json({ message: "Transaction not found" });
    await txn.deleteOne();
    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
