import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const user = await User.findById(req.user.id);

    // 1. Get user's real financial data (Your existing logic)
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
    const savings = income - expense;
    const rate = income > 0 ? Math.round((savings / income) * 100) : 0;

    // Category breakdown
    const catMap = {};
    txns
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });

    const topCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString()}`)
      .join(", ");

    // Get budgets
    const month = now.toISOString().slice(0, 7);
    const budgets = await Budget.find({ user: req.user.id, month });
    const overlimitBudgets = budgets
      .filter((b) => {
        const spent = catMap[b.category] || 0;
        return spent > b.limit;
      })
      .map((b) => b.category);

    // 2. System prompt with real user data
    const systemPrompt = `You are Fintech, a smart personal financial advisor.
CURRENT USER INFO:
- Name: ${user ? user.name : "User"}

CURRENT USER FINANCIAL DATA (This Month):
- Total Income: ₹${income.toLocaleString()}
- Total Expenses: ₹${expense.toLocaleString()}
- Net Savings: ₹${savings.toLocaleString()}
- Savings Rate: ${rate}%
- Top Spending Categories: ${topCategories || "No expenses yet"}
- Overlimit Categories: ${overlimitBudgets.length > 0 ? overlimitBudgets.join(", ") : "None"}

INSTRUCTIONS:
- Give personalized advice based on the REAL data above.
- Use ₹ for Indian Rupees.
- Be concise, friendly, and actionable.
- Only answer finance and app related questions.
- If asked unrelated questions say "I can only help with financial advice."
- FORMATTING FOR TEXT CHAT (Written Advisor): Format responses clearly with bullet points when listing items.
- FORMATTING FOR VOICE ASSISTANT: If the message request indicates it is for a voice assistant, speak in a warm, conversational, human-like voice. Avoid all markdown formatting, asterisks, hash signs, list formats, or bullet points. Speak in complete, natural sentences that flow well when read aloud. Keep it extremely brief (max 2 short sentences).`;

    // 3. Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Use gemini-2.5-flash (fast, highly capable, and fully supported on free tier)
      systemInstruction: systemPrompt,
    });

    // 4. Format history specifically for Gemini
    // Gemini expects roles to be 'user' or 'model' (Claude used 'assistant')
    // It also requires history to start with a 'user' message and alternate 'user' -> 'model'.
    let formattedHistory = [];
    for (const m of history) {
      const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
      const parts = [{ text: m.content }];

      if (formattedHistory.length === 0) {
        if (role === "user") {
          formattedHistory.push({ role, parts });
        }
      } else {
        const lastRole = formattedHistory[formattedHistory.length - 1].role;
        if (role !== lastRole) {
          formattedHistory.push({ role, parts });
        }
      }
    }

    // Since the next message we send is from 'user', history must end with a 'model' response
    if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === "user") {
      formattedHistory.pop();
    }

    // Keep history clean and limit size (max 6 messages / 3 pairs)
    if (formattedHistory.length > 6) {
      const discardCount = formattedHistory.length - 6;
      // Ensure we discard an even number of items to keep starting with 'user'
      const adjustedDiscard = discardCount % 2 === 0 ? discardCount : discardCount + 1;
      if (adjustedDiscard < formattedHistory.length) {
        formattedHistory = formattedHistory.slice(adjustedDiscard);
      } else {
        formattedHistory = [];
      }
    }

    // 5. Start chat and send the new message
    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({ reply: responseText });
  } catch (err) {
    console.error("AI Error:", err.message);
    // Fallback response if API key is missing or quota is hit
    res.json({
      reply: `Based on your financial data, here are my recommendations:\n\n• Track your expenses daily to stay within budget\n• Aim for a savings rate of at least 30%\n• Build an emergency fund of 6 months expenses\n\nWould you like specific advice on any category?`,
    });
  }
});

export default router;
