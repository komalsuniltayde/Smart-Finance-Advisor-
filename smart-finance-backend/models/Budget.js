import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
    limit: { type: Number, required: true },
    month: {
      type: String,
      default: () => new Date().toISOString().slice(0, 7),
    },
  },
  { timestamps: true },
);

export default mongoose.model("Budget", budgetSchema);
