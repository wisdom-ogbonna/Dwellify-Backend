import axios from "axios";
import redisClient from "../config/redis.js";
import { db } from "../config/firebase.js"; // 👈 ADD FIREBASE ADMIN/DB

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

/**
 * =====================================
 * INITIALIZE PAYMENT (PAYSTACK CHECKOUT)
 * =====================================
 */
export const initializePayment = async (req, res) => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: "Missing agentId" });
    }

    // 🔥 GET AGENT FROM DB (SOURCE OF TRUTH)
    const agentDoc = await db.collection("users").doc(agentId).get();

    if (!agentDoc.exists) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const agent = agentDoc.data();

    const email = agent.agentDetails?.email;


    console.log("🔥 RAW AGENT DOC:", agentDoc.data());
    if (!email) {
      return res.status(400).json({ error: "Agent email not found" });
    }

    // 🔥 GET PAYMENT DUE FROM REDIS
    const expectedAmount = await redisClient.get(
      `agent:paymentDue:${agentId}`
    );

    if (!expectedAmount || Number(expectedAmount) <= 0) {
      return res.status(400).json({
        error: "No payment due",
      });
    }

    // 💳 INIT PAYSTACK
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: Number(expectedAmount) * 100, // kobo
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
    console.error(
      "Payment init error:",
      error.response?.data || error.message
    );
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

    // optional: also update Firestore
    await db.collection("users").doc(agentId).update({
      status: "active",
      updatedAt: Date.now(),
    });

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

    // ❌ ignore non-success events
    if (event.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const data = event.data;

    const agentId = data.metadata?.agentId;

    if (!agentId) {
      console.log("❌ Missing agentId in metadata");
      return res.sendStatus(200);
    }

    const amountPaid = data.amount / 100;

    const expectedAmount = await redisClient.get(
      `agent:paymentDue:${agentId}`
    );

    if (!expectedAmount) {
      console.log("❌ No payment record found");
      return res.sendStatus(200);
    }

    // ❌ prevent underpayment fraud
    if (Number(amountPaid) < Number(expectedAmount)) {
      console.log(
        `❌ Underpayment detected: paid ${amountPaid}, expected ${expectedAmount}`
      );
      return res.sendStatus(200);
    }

    // ✅ SUCCESS FLOW
    await reactivateAgent(agentId);

    console.log("✅ Payment verified:", agentId);

    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.sendStatus(500);
  }
};