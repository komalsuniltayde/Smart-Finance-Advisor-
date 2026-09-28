import nodemailer from "nodemailer";

let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (emailUser && emailPass) {
    console.log("📨 Email Service: Using configured Gmail SMTP transporter...");
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  } else {
    console.log("⚠️ Email Service: EMAIL_USER and EMAIL_PASS not set. Generating test SMTP account via Ethereal...");
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`✅ Ethereal Test Account created! User: ${testAccount.user}`);
    } catch (err) {
      console.error("❌ Failed to create Ethereal SMTP account. Falling back to stdout mock logging.", err.message);
      // Fallback object to print mock emails to log instead of crashing
      transporter = {
        sendMail: async (mailOptions) => {
          console.log("\n📬 [MOCK EMAIL SENT] 📬");
          console.log(`To: ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log(`Body Snippet: ${mailOptions.text || "HTML content only"}`);
          console.log("📬 ------------------ 📬\n");
          return { messageId: "mock-id-12345" };
        }
      };
    }
  }
  return transporter;
};

// ── SEND OVERLIMIT EMAIL ──────────────────────────────────────────
export const sendOverlimitEmail = async (user, category, limit, spent) => {
  try {
    const client = await getTransporter();
    const overlimitAmount = spent - limit;

    const mailOptions = {
      from: process.env.EMAIL_USER ? `"FinanceAI Alerts" <${process.env.EMAIL_USER}>` : '"FinanceAI Alerts" <alerts@financeai.com>',
      to: user.email,
      subject: `⚠️ Budget Exceeded: ${category}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1c2b3e; border-radius: 12px; overflow: hidden; background-color: #0b111e; color: #e6ecf5;">
          <div style="background: linear-gradient(135deg, #ff4d6d, #c9184a); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">⚠️ Budget Alert</h1>
          </div>
          <div style="padding: 30px; line-height: 1.6;">
            <p style="font-size: 16px; margin-top: 0;">Hello <strong>${user.name}</strong>,</p>
            <p style="font-size: 14px; color: #a9b6cb;">You have exceeded your monthly budget limit for the category <strong>${category}</strong>.</p>
            
            <div style="background-color: #131c2b; border: 1px solid #1c2b3e; border-radius: 8px; padding: 20px; margin: 24px 0; display: flex; flex-direction: column; gap: 10px;">
              <div style="font-size: 14px; display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid #1c2b3e;">
                <span style="color: #8a99ad;">Category:</span>
                <strong style="color: #e6ecf5;">${category}</strong>
              </div>
              <div style="font-size: 14px; display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1c2b3e;">
                <span style="color: #8a99ad;">Monthly Limit:</span>
                <strong style="color: #e6ecf5;">₹${limit.toLocaleString()}</strong>
              </div>
              <div style="font-size: 14px; display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1c2b3e;">
                <span style="color: #8a99ad;">Total Spent:</span>
                <strong style="color: #ff4d6d;">₹${spent.toLocaleString()}</strong>
              </div>
              <div style="font-size: 14px; display: flex; justify-content: space-between; padding-top: 8px;">
                <span style="color: #8a99ad;">Amount Over Limit:</span>
                <strong style="color: #ff4d6d;">₹${overlimitAmount.toLocaleString()}</strong>
              </div>
            </div>
            
            <p style="font-size: 14px; color: #a9b6cb;">Consider reviewing your transactions and adjusting your spending habits for the remainder of the month to stay on track.</p>
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="http://localhost:3000/budget" style="background-color: #00d4ff; color: #0b111e; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Adjust Budgets</a>
            </div>
          </div>
          <div style="background-color: #131c2b; padding: 16px; text-align: center; font-size: 12px; color: #8a99ad; border-top: 1px solid #1c2b3e;">
            &copy; 2026 FinanceAI Platform. Tracking made smart.
          </div>
        </div>
      `,
    };

    const info = await client.sendMail(mailOptions);
    console.log(`✉️ Overlimit email successfully sent to ${user.email} (ID: ${info.messageId})`);
    
    // Log ethereal preview URL if available
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 Ethereal Email Preview: ${previewUrl}`);
    }
  } catch (err) {
    console.error(`❌ Failed to send budget alert email to ${user.email}:`, err.message);
  }
};

// ── SEND INACTIVITY EMAIL ─────────────────────────────────────────
export const sendInactivityEmail = async (user) => {
  try {
    const client = await getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER ? `"FinanceAI Alerts" <${process.env.EMAIL_USER}>` : '"FinanceAI Alerts" <alerts@financeai.com>',
      to: user.email,
      subject: "📊 Don't forget to track your expenses!",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1c2b3e; border-radius: 12px; overflow: hidden; background-color: #0b111e; color: #e6ecf5;">
          <div style="background: linear-gradient(135deg, #00d4ff, #a78bfa); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #0b111e; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">📈 Weekly Check-in</h1>
          </div>
          <div style="padding: 30px; line-height: 1.6;">
            <p style="font-size: 16px; margin-top: 0;">Hello <strong>${user.name}</strong>,</p>
            <p style="font-size: 14px; color: #a9b6cb;">We noticed that you haven't logged any transactions on your FinanceAI dashboard in the past 2 days.</p>
            
            <p style="font-size: 14px; color: #a9b6cb;">Keeping a daily log of your spending helps you build strong financial habits, detect anomalies quickly, and unlock highly accurate predictions from our machine learning models.</p>
            
            <div style="background-color: #131c2b; border: 1px solid #1c2b3e; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
              <h3 style="margin-top: 0; color: #00d4ff;">It only takes 30 seconds!</h3>
              <p style="margin-bottom: 20px; font-size: 13px; color: #8a99ad;">Log your recent grocery trips, subscriptions, dining out, or transport costs now.</p>
              <a href="http://localhost:3000/transactions" style="background-color: #a78bfa; color: #0b111e; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Add Transactions</a>
            </div>
            
            <p style="font-size: 14px; color: #a9b6cb;">If you have any questions or want to check your spending limits, simply open the AI Advisor and say "Am I spending too much this month?".</p>
          </div>
          <div style="background-color: #131c2b; padding: 16px; text-align: center; font-size: 12px; color: #8a99ad; border-top: 1px solid #1c2b3e;">
            &copy; 2026 FinanceAI Platform. Tracking made smart.
          </div>
        </div>
      `,
    };

    const info = await client.sendMail(mailOptions);
    console.log(`✉️ Inactivity email successfully sent to ${user.email} (ID: ${info.messageId})`);
    
    // Log ethereal preview URL if available
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 Ethereal Email Preview: ${previewUrl}`);
    }
  } catch (err) {
    console.error(`❌ Failed to send inactivity email to ${user.email}:`, err.message);
  }
};

// ── SEND ADMIN OVERLIMIT ALERT ──────────────────────────────────────
export const sendAdminOverlimitNotification = async (user, category, limit, spent) => {
  try {
    const client = await getTransporter();
    const overlimitAmount = spent - limit;

    // Dynamically import User model to avoid circular dependency
    const User = (await import("../models/User.js")).default;
    const admins = await User.find({ role: "admin" });

    if (!admins || admins.length === 0) {
      console.log("ℹ️ No admin accounts found to notify.");
      return;
    }

    const adminEmails = admins.map(admin => admin.email).join(", ");
    
    const mailOptions = {
      from: process.env.EMAIL_USER ? `"FinanceAI Alerts" <${process.env.EMAIL_USER}>` : '"FinanceAI Alerts" <alerts@financeai.com>',
      to: adminEmails,
      subject: `🚨 [Admin Alert] Budget Exceeded by ${user.name}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1c2b3e; border-radius: 12px; overflow: hidden; background-color: #0b111e; color: #e6ecf5;">
          <div style="background: linear-gradient(135deg, #7c3aed, #a78bfa); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">🚨 Admin Alert: User Budget Breached</h1>
          </div>
          <div style="padding: 30px; line-height: 1.6;">
            <p style="font-size: 16px; margin-top: 0;">Hello Advisor/Admin,</p>
            <p style="font-size: 14px; color: #a9b6cb;">A user has exceeded their budget limit. Here are the details:</p>
            
            <div style="background-color: #131c2b; border: 1px solid #1c2b3e; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #a78bfa; font-size: 15px; border-bottom: 1px solid #1c2b3e; padding-bottom: 8px;">User Information</h3>
              <p style="font-size: 13px; margin: 6px 0; color: #e6ecf5;"><strong>Name:</strong> ${user.name}</p>
              <p style="font-size: 13px; margin: 6px 0; color: #e6ecf5;"><strong>Email:</strong> ${user.email}</p>
              
              <h3 style="margin-top: 16px; color: #a78bfa; font-size: 15px; border-bottom: 1px solid #1c2b3e; padding-bottom: 8px;">Budget Details</h3>
              <p style="font-size: 13px; margin: 6px 0; color: #e6ecf5;"><strong>Category:</strong> ${category}</p>
              <p style="font-size: 13px; margin: 6px 0; color: #e6ecf5;"><strong>Limit:</strong> ₹${limit.toLocaleString()}</p>
              <p style="font-size: 13px; margin: 6px 0; color: #ff4d6d;"><strong>Total Spent:</strong> ₹${spent.toLocaleString()}</p>
              <p style="font-size: 13px; margin: 6px 0; color: #ff4d6d;"><strong>Over Limit By:</strong> ₹${overlimitAmount.toLocaleString()}</p>
            </div>
            
            <p style="font-size: 13px; color: #a9b6cb;">You can view their full spending patterns and write a custom advisory report in the Admin Panel.</p>
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="http://localhost:3000/admin" style="background-color: #a78bfa; color: #0b111e; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Go to Admin Panel</a>
            </div>
          </div>
          <div style="background-color: #131c2b; padding: 16px; text-align: center; font-size: 12px; color: #8a99ad; border-top: 1px solid #1c2b3e;">
            &copy; 2026 FinanceAI Platform. Admin Notification Service.
          </div>
        </div>
      `,
    };

    const info = await client.sendMail(mailOptions);
    console.log(`✉️ Admin notification email successfully sent to ${adminEmails} (ID: ${info.messageId})`);
  } catch (err) {
    console.error("❌ Failed to send admin budget alert notification:", err.message);
  }
};
