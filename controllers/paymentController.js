import axios from "axios";
import redisClient from "../config/redis.js";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

/**
 * =====================================
 * INITIALIZE PAYMENT (PAYSTACK CHECKOUT)
 * =====================================
 */
export const initializePayment = async (req, res) => {
  try {
    const { agentId, email } = req.body;

    if (!agentId || !email) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // ✅ GET AMOUNT FROM REDIS (NOT FRONTEND)
    const expectedAmount = await redisClient.get(`agent:paymentDue:${agentId}`);

    if (!expectedAmount || Number(expectedAmount) <= 0) {
      return res.status(400).json({
        error: "No payment due",
      });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: Number(expectedAmount) * 100,
        metadata: {
          agentId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    return res.json({
      message: "Payment initialized",
      paymentUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (error) {
    console.error("Payment init error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Payment initialization failed" });
  }
};

/**
 * =====================================
 * REACTIVATE AGENT (INTERNAL)
 * =====================================
 */
const reactivateAgent = async (agentId) => {
  try {
    await redisClient.del(`agent:suspended:${agentId}`);
    await redisClient.del(`agent:inspectionCount:${agentId}`);
    await redisClient.set(`agent:paymentDue:${agentId}`, 0);

    await redisClient.set(`agent:status:${agentId}`, "online");

    console.log("✅ Agent reactivated:", agentId);
  } catch (err) {
    console.error("Reactivate error:", err.message);
  }
};

/**
 * =====================================
 * PAYSTACK WEBHOOK
 * =====================================
 */
export const paystackWebhook = async (req, res) => {
  try {
    const event = req.body;

    // ✅ Only process successful payments
    if (event.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const data = event.data;

    // ✅ Convert amount from kobo → naira
    const amountPaid = data.amount / 100;

    // ✅ Get agentId from metadata
    const agentId = data.metadata?.agentId;

    if (!agentId) {
      console.log("❌ No agentId in metadata");
      return res.sendStatus(200);
    }

    // ✅ Get expected amount
    const expectedAmount = await redisClient.get(`agent:paymentDue:${agentId}`);

    if (!expectedAmount) {
      console.log("❌ No payment due for agent:", agentId);
      return res.sendStatus(200);
    }

    // ❌ Reject underpayment
    if (Number(amountPaid) < Number(expectedAmount)) {
      console.log(
        `❌ Insufficient payment: paid ₦${amountPaid}, expected ₦${expectedAmount}`
      );
      return res.sendStatus(200);
    }

    // ✅ SUCCESS → Reactivate agent
    await reactivateAgent(agentId);

    console.log("✅ Payment verified & agent reactivated:", agentId);

    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.sendStatus(500);
  }
};
