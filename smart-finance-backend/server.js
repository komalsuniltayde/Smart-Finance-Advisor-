import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import analyticsRoutes from "./routes/analytics.js";
import budgetRoutes from "./routes/budgets.js";
import mlRoutes from "./routes/ml.js";
import aiRoutes from "./routes/ai.js";
import adminRoutes from "./routes/admin.js";
import advisoryRoutes from "./routes/advisories.js";
import "./services/cronJobs.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/advisories", advisoryRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "✅ Backend running!" });
});

app.get("/", (req, res) => {
  res.send("🚀 FinanceAI Backend API is running! Access the web app at http://localhost:3000");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
