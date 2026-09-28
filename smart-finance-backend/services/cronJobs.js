import cron from "node-cron";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { sendInactivityEmail } from "./emailService.js";

// Expose the core inactivity checker function so we can manually run and test it
export const checkInactivity = async () => {
  console.log("⏰ Inactivity Cron: Starting scans for inactive users...");
  try {
    const users = await User.find({});
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    let reminderCount = 0;
    const report = [];

    for (const user of users) {
      // Get latest transaction for user
      const lastTxn = await Transaction.findOne({ user: user._id }).sort({ date: -1 });

      let isInactive = false;
      let lastActivityDate = null;

      if (lastTxn) {
        lastActivityDate = new Date(lastTxn.date);
        if (lastActivityDate < twoDaysAgo) {
          isInactive = true;
        }
      } else {
        // Fallback to user creation date if no transactions exist
        lastActivityDate = new Date(user.createdAt || Date.now());
        if (lastActivityDate < twoDaysAgo) {
          isInactive = true;
        }
      }

      if (isInactive) {
        console.log(`⏰ Inactivity Cron: User '${user.name}' is inactive. Last activity was: ${lastActivityDate.toISOString()}`);
        await sendInactivityEmail(user);
        reminderCount++;
        report.push({ name: user.name, email: user.email, lastActivity: lastActivityDate });
      }
    }
    
    console.log(`⏰ Inactivity Cron: Completed scanning users. Reminders sent: ${reminderCount}`);
    return { reminderCount, report };
  } catch (err) {
    console.error("❌ Inactivity Cron Error:", err.message);
    throw err;
  }
};

// Schedule job to run every day at 9:00 AM (local time)
// Cron syntax: minute hour day-of-month month day-of-week
cron.schedule("0 9 * * *", async () => {
  console.log("⏰ Daily Inactivity Check Triggered (9:00 AM)");
  await checkInactivity();
});

console.log("⏰ Inactivity cron job successfully scheduled for 9:00 AM daily.");
