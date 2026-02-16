import { db } from "../config/firebase.js";
import { sendPushNotification } from "../utils/push.js";

export const clinetRequest = async (req, res) => {
  try {
    const {
      agentId,
      clientId,
      clientName,
      propertyType,
      lat,
      lng,
    } = req.body;

    if (!agentId || !clientId || !propertyType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const docRef = await db.collection("agent_requests").add({
      agentId,
      clientId,
      clientName,
      propertyType,
      lat,
      lng,
      status: "pending",
      createdAt: Date.now(),
    });

    // 🔔 Get Agent Info
    const agentSnap = await db.collection("agents").doc(agentId).get();
    const agentData = agentSnap.data();

    if (agentData) {
      await sendPushNotification(agentData, {
        title: "New Client 🚨",
        body: `${clientName} needs a ${propertyType}`,
        data: {
          requestId: docRef.id,
          lat,
          lng,
        },
      });
    }

    res.status(201).json({
      success: true,
      requestId: docRef.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create request" });
  }
};