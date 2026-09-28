import mongoose from "mongoose";

const budgetAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
    budgetLimit: { type: Number, required: true },
    amountSpent: { type: Number, required: true },
    overBy: { type: Number, required: true },
    emailSentToUser: { type: Boolean, default: false },
    emailSentToAdmin: { type: Boolean, default: false },
    adminEmailSent: { type: Boolean, default: false }, // manual email sent by admin
    adminEmailSentAt: { type: Date, default: null },
    month: { type: String, required: true }, // "2026-07"
  },
  { timestamps: true },
);

export default mongoose.model("BudgetAlert", budgetAlertSchema);
