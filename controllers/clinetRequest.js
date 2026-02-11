import { db } from "../config/firebase.js";
import { sendPushNotification } from "../utils/push.js";

export const clinetRequest = async (req, res) => {
  try {
    const { agentId, clientId, clientName, propertyType, lat, lng } = req.body;

    if (!agentId || !clientId || !propertyType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    const docRef = await db.collection("agent_requests").add({
      agentId,
      clientId,
      clientName: clientName || "A client",
      propertyType,
      lat: latitude,
      lng: longitude,
      status: "pending",
      createdAt: Date.now(),
    });

    console.log(`✅ Request created: ${docRef.id}`);

    const agentSnap = await db.collection("agents").doc(agentId).get();

    if (!agentSnap.exists) {
      console.log("⚠️ Agent not found");
    } else {
      const { notification } = agentSnap.data();

      if (notification) {
        await sendPushNotification(notification, {
          title: "New Client Request 🚨",
          body: `${clientName || "A client"} needs a ${propertyType}`,
          data: {
            requestId: String(docRef.id),
            lat: String(latitude),
            lng: String(longitude),
            type: "NEW_BOOKING_REQUEST",
          },
        });

        console.log("📨 Push sent");
      } else {
        console.log("⚠️ No notification token");
      }
    }

    res.status(201).json({
      success: true,
      requestId: docRef.id,
    });
  } catch (error) {
    console.error("❌ Controller Error:", error);
    res.status(500).json({ error: "Failed to create request" });
  }
};
