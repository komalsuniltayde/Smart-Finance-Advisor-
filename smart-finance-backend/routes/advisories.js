import express from "express";
import Advisory from "../models/Advisory.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET the latest advisory for the logged-in user
router.get("/", async (req, res) => {
  try {
    const advisory = await Advisory.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(advisory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
